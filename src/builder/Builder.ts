import * as assert from 'node:assert';
import binaryen from 'binaryen';
import {VirtualMachine} from '../vm/index.ts';
import type {SymbolSchemaVar} from '../validator/index.ts';
import type {Temp} from '../optimizer/index.ts';
import {Global} from '../code-generator/index.ts';
import {bigint_to_i64} from './utils-public.ts';
import {Local} from './Local.ts';
import type {BinaryenModuleUpdates} from './-types.d.ts';



export enum BinConst {
	NULL,
	FALSE,
	TRUE,
}



/**
 * Insert entries into an internal array for a record/Dict.
 *
 * Find a bucket in which to place the entry.
 * By default this will have index `id mod capacity`,
 * but in the case of collisions we will use the *linear probing* technique.
 *
 * This function mutates the `array` argument.
 * For records, the array will have been completely filled by the time this function returns.
 * For Dicts, the array may still have empty slots (native `undefined`);
 * these are expected to be filled with `(ref.null $Property)` values later, but are not done so here.
 *
 * @param entry the entry to insert; must be of type `(ref $Property)` in the case of records, `(ref null $Property)` in the case of Dicts
 * @param index the index of the internal array at which to attempt to insert the entry; should be the result of an already-hashed key
 * @param array an empty array in which to insert the entry
 * @see https://en.wikipedia.org/wiki/Linear_probing
 */
function insert_entry(array: Array<binaryen.ExpressionRef | undefined>, index: number, entry: binaryen.ExpressionRef): void {
	if (index < 0 || array.length <= index) {
		throw new RangeError('Given index must not be out of array bounds.');
	}
	if (array[index] === undefined) {
		array[index] = entry;
		return;
	}
	return insert_entry(array, (index + 1) % array.length, entry);
}





/**
 * The Builder generates assembly code.
 */
export class Builder {
	/**
	 * Load Factor for arrays.
	 * The number of items (including tombstones) in a `$ListInternal`/`$DictInternal`
	 * must not exceed this factor as a multiple of array length.
	 */
	static readonly #LOAD_FACTOR = 7 / 8;


	/** A registry of constant WASM expressions. */
	readonly #constRegistry: ReadonlyMap<BinConst, binaryen.ExpressionRef>;

	/** A set containing data of WASM local variables. */
	readonly #locals = new Set<Local>();

	/** A map containing data of WASM local variables, indexed by their name. */
	readonly #globals = new Map<string, Global>();

	/** Alias for `this.vm.mod`.         */ public readonly module:      VirtualMachine['mod'];
	/** Alias for `this.vm.heaptype`.    */ public readonly heaptype:    VirtualMachine['heaptype'];
	/** Alias for `this.vm.reftype`.     */ public readonly reftype:     VirtualMachine['reftype'];
	/** Alias for `this.vm.reftypeNull`. */ public readonly reftypeNull: VirtualMachine['reftypeNull'];
	/** Alias for `this.vm.structGet`.   */ public readonly structGet:   VirtualMachine['structGet'];


	public constructor(public readonly vm: VirtualMachine = new VirtualMachine()) {
		this.module      = this.vm.mod;
		this.heaptype    = this.vm.heaptype;
		this.reftype     = this.vm.reftype;
		this.reftypeNull = this.vm.reftypeNull;
		this.structGet   = this.vm.structGet;

		this.#setupGlobals();
		this.#setupFunctions();

		this.#constRegistry = new Map([
			[BinConst.NULL,  this.newValue(this.newVect())],
			[BinConst.FALSE, this.newValue(this.newVect(false))],
			[BinConst.TRUE,  this.newValue(this.newVect(true))],
		]);
	}

	public getConst(key: BinConst): binaryen.ExpressionRef {
		assert.ok(this.#constRegistry.has(key), `Expected constant registry to have constant \`${ BinConst[key] }\`.`);
		return this.#constRegistry.get(key)!;
	}

	/**
	 * Create and add a new temporary local variable, for use in short-circuiting operations and placeholder values.
	 * @param value the binaryen value of the variable to add
	 * @param type  the type of the value; if not supplied, the Local will compute its type using `binaryen.getExpressionType`
	 * @return      the new local variable
	 */
	public newLocal(value: binaryen.ExpressionRef, typ?: binaryen.Type): Local {
		const local = new Local(this.module, this.#locals.size, value, typ);
		this.#locals.add(local);
		return local;
	}

	/**
	 * Set a local variable, given a variable id.
	 * If a variable with that id has already been added, do nothing.
	 * @param schema the compiler’s internal data for a declared variable or an optimizer temporary
	 * @param value  the binaryen value of the variable to set
	 * @param type   the type of the value; if not supplied, the Local will compute its type using `binaryen.getExpressionType`
	 * @return       Was the operation performed?
	 */
	public setLocal(schema: SymbolSchemaVar | Temp, value: binaryen.ExpressionRef, typ?: binaryen.Type): boolean {
		let did: boolean = false;
		if (!this.getLocal(schema)) {
			this.#locals.add(new Local(this.module, this.#locals.size, value, typ, schema));
			did = true;
		}
		return did;
	}

	/**
	 * Get the local with the given schema/temp in this Builder’s list, if it’s been added; else, return `undefined`.
	 * @param  schema the compiler’s internal data for a declared variable or an optimizer temporary
	 * @return        the local or `undefined`
	 */
	public getLocal(schema: SymbolSchemaVar | Temp): Local | undefined {
		return [...this.#locals].find((local) => local.schema === schema);
	}

	/**
	 * Set and then return a local variable.
	 * If a variable with that schema has already been added, this Builder’s state is not changed.
	 * @param schema the compiler’s internal data for a declared variable or an optimizer temporary
	 * @param value  the binaryen value of the variable to set
	 * @param type   the type of the value; if not supplied, the Local will compute its type using `binaryen.getExpressionType`
	 * @return       the local variable set (or retrieved)
	 */
	public teeLocal(schema: SymbolSchemaVar | Temp, value: binaryen.ExpressionRef, type?: binaryen.Type): Local {
		this.setLocal(schema, value, type);
		return this.getLocal(schema)!;
	}

	/**
	 * Return a copy of a list of this Builder’s local variables.
	 * @return the local variables in an array
	 */
	public getAllLocals(): Local[] {
		return [...this.#locals];
	}

	/**
	 * Return a `v128` representing the argument.
	 * @param arg one of the following:
	 *            - the native value `null`, `false`, or `true` (corresponding to its representation)
	 *            - a Binaryen `i64`, `f64`, or `v128` value to use in a `v128`
	 *            - an `unreachable`, which is directly returned
	 * @param opts an object:
	 * 	@property `unsigned` - if `arg` is an `i64`, should it be interpreted as unsigned? (default `false`)
	 * 	@property `scale`    - the scale factor for decimal values (default `undefined`) — currently not supported
	 * @returns a `v128` value encoding the argument (or `unreachable` if given)
	 */
	public newVect(
		arg:  null | boolean | binaryen.ExpressionRef /* unreachable | i64 | f64 | v128 */ = null,
		opts: {unsigned?: boolean, scale?: bigint} = {},
	): binaryen.ExpressionRef /* v128 */ {
		const {mod, Vect} = this.vm;
		switch (arg) {
			case null:  { return mod.global.get('Vect.NULL',  binaryen.v128); }
			case false: { return mod.global.get('Vect.FALSE', binaryen.v128); }
			case true:  { return mod.global.get('Vect.TRUE',  binaryen.v128); }
		}
		switch (binaryen.getExpressionType(arg)) {
			case binaryen.v128: {
				return arg;
			}
			case binaryen.unreachable: {
				return arg;
			}
			case binaryen.i64: {
				return opts.unsigned ? Vect.newNat(arg) : Vect.newInt(arg);
			}
			case binaryen.f64: {
				return Vect.newFloat(arg);
			}
			default: {
				throw new TypeError(`Expected argument \`${ binaryen.emitText(arg) }\` to be one of the following types:\n\t${ [
					'`unreachable`',
					'`i64`',
					'`f64`',
				].join('\n\t') }.`);
			}
		}
	}

	/**
	 * Create a `$Value` struct containing the argument.
	 * @param arg one of the following:
	 *            - the native value `null`, which returns `(struct.new_default $Value)` (valid only in tombstones)
	 *            - a Binaryen `v128`, `eqref`, `(ref $Value)`, or `(ref null $Value)`
	 *            - an `unreachable`, which is directly returned
	 * @returns a `(struct.new $Value)` holding an encoding of the argument (or `unreachable` if given)
	 */
	public newValue(arg: binaryen.ExpressionRef /* unreachable | v128 | eqref | (ref $Value) | (ref null $Value) */ | null): binaryen.ExpressionRef /* (ref $Value) */ {
		const {mod, heaptype, reftype, reftypeNull, Value} = this.vm;
		if (arg === null) {
			return mod.struct.new_default(heaptype.Value);
		}
		switch (binaryen.getExpressionType(arg)) {
			// WARNING: leaky abstraction! bitwise-ORing with 4 provides the “exact” type, i.e. `(ref (exact $Value))` --- see WebAssembly/binaryen/src/wasm-type.h
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			case binaryen.nullref: // `(ref null none)` // BUG: Binaryen treats all nullish values the same. See NOTE below.
			case reftypeNull.Value | 4:
			case reftype.Value     | 4:
			case reftypeNull.Value:
			case reftype.Value: { // if given a (nullish) `$Value`, just use that
				/* NOTE: If the expression type is `binaryen.nullref`, we’re assuming a `(ref null $Value)` was given.
				But in case a `(ref null $Property)`, etc. is given, a `(struct.new_default $Value)` should be returned, since those aren’t valid in a `$Value` struct.
				Since Binaryen considers all nullish values to be `nullref`, we can’t make that distinction. */
				return arg;
			}
			case binaryen.unreachable: {
				return arg;
			}
			case binaryen.v128: {
				return Value.newPrimitive(arg);
			}
			case binaryen.eqref:
			case reftype.String:
			case reftype.Tuple:
			case reftype.Record:
			case reftype.Object:
			case reftype.List:
			case reftype.Dict:
			case reftype.Map:
			default: {
				return Value.newComposite(arg);
			}
			/*
			default: {
				throw new TypeError(`Expected argument \`${ binaryen.emitText(arg) }\` to be one of the following types:\n\t${ [
					'`unreachable`',
					'`v128`',
					'`(ref $Tuple)`',
					'`(ref $Record)`',
					'`(ref $Object)` or a subtype',
					'`(ref $Value)`',
					'`(ref null $Value)`',
				].join('\n\t') }.`);
			}
			*/
		}
	}

	/**
	 * Create a `$Property` struct containing the given key and `$Value`.
	 * Note that a `$Property` may only contain a “default” `$Value` (a `(struct.new_default)`)
	 * if its key is less than `\x100` — in which case it is a tombstone property.
	 * @param arg one of the following:
	 *            - a Binaryen `(ref $Value)`, or `(ref null $Value)`
	 *            - an `unreachable`, which is directly returned
	 * @returns a `(struct.new $Value)` holding an encoding of the argument (or `unreachable` if given)
	 */
	public newProperty(key: bigint, arg: binaryen.ExpressionRef /* unreachable | (ref $Value) | (ref null $Value) */): binaryen.ExpressionRef /* (ref $Property) */ {
		switch (binaryen.getExpressionType(arg)) {
			case binaryen.unreachable: {
				return arg;
			}
			// WARNING: leaky abstraction! bitwise-ORing with 4 provides the “exact” type, i.e. `(ref (exact $Value))` --- see WebAssembly/binaryen/src/wasm-type.h
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			case binaryen.nullref: // `(ref null none)` // BUG: Binaryen treats all nullish values the same. See NOTE below.
			case this.vm.reftypeNull.Value | 4:
			case this.vm.reftype.Value     | 4:
			case this.vm.reftypeNull.Value:
			case this.vm.reftype.Value:
			default: {
				/* NOTE: If the expression type is `binaryen.nullref`, we’re assuming a `(ref null $Value)` was given.
				But in case a `(ref null $Case)`, etc. is given, an `(unreachable)` should be returned, since those aren’t valid in a `$Property` struct.
				Since Binaryen considers all nullish values to be `nullref`, we can’t make that distinction. */
				return this.vm.mod.struct.new([
					bigint_to_i64(this.vm.mod, key, true),
					arg,
				], this.vm.heaptype.Property);
			}
		}
	}

	/**
	 * Return a new `$String` from UTF-8-encoded code units.
	 * @param units items in the array; must be of type `i32`
	 * @return      `(array.new_fixed $String <...items>)`
	 */
	public codegenString(units: readonly binaryen.ExpressionRef[] = []): binaryen.ExpressionRef {
		return this.module.array.new_fixed(this.heaptype.String, units);
	}

	/**
	 * Return a new `$Tuple` from items.
	 * @param items items in the array; must be of type `(ref $Value)`
	 * @return      `(array.new_fixed $Tuple <...items>)`
	 */
	public codegenTuple(items: readonly binaryen.ExpressionRef[] = []): binaryen.ExpressionRef {
		return this.module.array.new_fixed(this.heaptype.Tuple, items);
	}

	/**
	 * Return a new `$Record` from properties.
	 * This method automatically hashes the property keys and inserts them at the correct indices.
	 * @param props key–value pairs whose keys are key ids (`bigint`s) and whose values (of type `(ref $Property)`) are items in the array
	 * @return      `(array.new_fixed $Record <...props>)`
	 */
	public codegenRecord(props: ReadonlyMap<bigint, binaryen.ExpressionRef> = new Map()): binaryen.ExpressionRef {
		const entries = new Array<binaryen.ExpressionRef | undefined>(props.size);
		props.forEach((code, id) => insert_entry(entries, Number(id) % entries.length, code));
		return this.module.array.new_fixed(this.heaptype.Record, entries as binaryen.ExpressionRef[]);
	}

	/**
	 * Return a new `$List` from items.
	 * This method automatically populates blank slots with the WASM expression `(ref.null $Value)`.
	 * @param items items in the array; must be of type `(ref null $Value)`
	 * @return      `(struct.new $List <count> (array.new_fixed $ListInternal <...items>))`
	 */
	public codegenList(items: readonly binaryen.ExpressionRef[] = []): binaryen.ExpressionRef {
		let capacity: number = 8;
		while (items.length > capacity * Builder.#LOAD_FACTOR) {
			capacity *= 2;
		}
		const entries: binaryen.ExpressionRef[] = Array.from(
			new Array(capacity),
			(_, i) => items[i] ?? this.module.ref.null(this.reftypeNull.Value),
		);
		return this.module.struct.new([
			this.#globals.get('obj-ctr')!.plusPlus(),
			this.module.i32.const(items.length),
			this.module.array.new_fixed(this.heaptype.ListInternal, entries),
		], this.heaptype.List);
	}

	/**
	 * Return a new `$Dict` from properties.
	 * This method automatically hashes the property keys and inserts them at the correct indices,
	 * as well as populates blank slots with the WASM expression `(ref.null $Property)`.
	 * @param props key–value pairs whose keys are key ids (`bigint`s) and whose values (of type `(ref $Value)`) are items in the array
	 * @return      `(struct.new $Dict <count> (array.new_fixed $DictInternal <...props>))`
	 */
	public codegenDict(props: ReadonlyMap<bigint, binaryen.ExpressionRef> = new Map()): binaryen.ExpressionRef {
		let capacity: number = 8;
		while (props.size > capacity * Builder.#LOAD_FACTOR) {
			capacity *= 2;
		}
		const entries = new Array<binaryen.ExpressionRef | undefined>(capacity).fill(undefined);
		props.forEach((code, id) => insert_entry(entries, Number(id) % entries.length, code));
		return this.module.struct.new([
			this.#globals.get('obj-ctr')!.plusPlus(),
			this.module.i32.const(props.size),
			this.module.array.new_fixed(
				this.heaptype.DictInternal,
				entries.map((entry) => entry ?? this.module.ref.null(this.reftypeNull.Property)),
			),
		], this.heaptype.Dict);
	}

	/**
	 * Return a new struct modeling a Set from items.
	 * It uses a `$Map` implementation, where the cases consist of item–`null` pairs (the Counterpoint `null` value).
	 * This method automatically populates blank slots with the WASM expression `(ref.null $Case)`.
	 * @param items items to be used as antecedents in the array of cases; must be of type `(ref null $Value)`
	 * @return      `(struct.new $Map <count> (array.new_fixed $MapInternal <...cases>))`
	 */
	public codegenSet(items: readonly binaryen.ExpressionRef[] = []): binaryen.ExpressionRef {
		return this.codegenMap(new Map(items.map((item) => [item, this.getConst(BinConst.NULL)])));
	}

	/**
	 * Return a new `$Map` from cases.
	 * This method automatically hashes the case antecedents and inserts them at the correct indices,
	 * as well as populates blank slots with the WASM expression `(ref.null $Case)`.
	 * @param props antecedent–consequent pairs of values (of type `(ref $Value)`) in the array
	 * @return      `(struct.new $Map <count> (array.new_fixed $MapInternal <...cases>))`
	 */
	public codegenMap(cases: ReadonlyMap<binaryen.ExpressionRef, binaryen.ExpressionRef> = new Map()): binaryen.ExpressionRef {
		let capacity: number = 8;
		while (cases.size > capacity * Builder.#LOAD_FACTOR) {
			capacity *= 2;
		}
		const map_obj = this.module.struct.new([
			this.#globals.get('obj-ctr')!.plusPlus(),
			this.module.i32.const(cases.size),
			this.module.array.new_default(this.heaptype.MapInternal, this.module.i32.const(capacity)),
		], this.heaptype.Map);
		if (!cases.size) {
			return map_obj;
		}
		const local: Local = this.newLocal(map_obj, this.reftype.Map);
		return this.module.block(null, [
			local.set(),
			...[...cases].map(([ant, con]) => this.module.call('Map.set', [local.get(), ant, con], binaryen.none)),
			local.get(),
		], this.reftype.Map);
	}

	/** assumes both operands are primitive */
	#setupBinopArithmetic(
		name:    string,
		method:  (num0: binaryen.ExpressionRef, num1: binaryen.ExpressionRef) => binaryen.ExpressionRef,
		typekey: 'asInt' | 'asNat' | 'asFloat',
	): binaryen.FunctionRef {
		const mod: BinaryenModuleUpdates = this.module;
		return mod.addFunction(
			name,
			binaryen.createType([this.reftype.Value, this.reftype.Value]),
			this.reftype.Value,
			[],
			this.newValue(this.newVect(method(
				this.vm.Vect[typekey](this.vm.Value.field(mod.local.get(0, this.reftype.Value)).primitive),
				this.vm.Vect[typekey](this.vm.Value.field(mod.local.get(1, this.reftype.Value)).primitive),
			))),
		);
	}

	/** assumes both operands are primitive */
	#setupBinopComparative(
		name:        string,
		method_ints: (int0:   binaryen.ExpressionRef, int1:   binaryen.ExpressionRef) => binaryen.ExpressionRef,
		method_nats: (nat0:   binaryen.ExpressionRef, nat1:   binaryen.ExpressionRef) => binaryen.ExpressionRef,
		method_flts: (float0: binaryen.ExpressionRef, float1: binaryen.ExpressionRef) => binaryen.ExpressionRef,
	): binaryen.FunctionRef {
		const mod: BinaryenModuleUpdates = this.module;
		const {Vect} = this.vm;
		const local_vects = [0, 1].map((i) => this.vm.Value.field(mod.local.get(i, this.reftype.Value)).primitive);

		const int_int: binaryen.ExpressionRef = method_ints(Vect.asInt(local_vects[0]),      Vect.asInt(local_vects[1]));
		const int_nat: binaryen.ExpressionRef = method_nats(Vect.intToNat(local_vects[0]),   Vect.asNat(local_vects[1]));
		const int_flt: binaryen.ExpressionRef = method_flts(Vect.intToFloat(local_vects[0]), Vect.asFloat(local_vects[1]));
		const nat_int: binaryen.ExpressionRef = method_nats(Vect.asNat(local_vects[0]),      Vect.intToNat(local_vects[1]));
		const nat_nat: binaryen.ExpressionRef = method_nats(Vect.asNat(local_vects[0]),      Vect.asNat(local_vects[1]));
		const nat_flt: binaryen.ExpressionRef = method_flts(Vect.natToFloat(local_vects[0]), Vect.asFloat(local_vects[1]));
		const flt_int: binaryen.ExpressionRef = method_flts(Vect.asFloat(local_vects[0]),    Vect.intToFloat(local_vects[1]));
		const flt_nat: binaryen.ExpressionRef = method_flts(Vect.asFloat(local_vects[0]),    Vect.natToFloat(local_vects[1]));
		const flt_flt: binaryen.ExpressionRef = method_flts(Vect.asFloat(local_vects[0]),    Vect.asFloat(local_vects[1]));

		return mod.addFunction(name, binaryen.createType([this.reftype.Value, this.reftype.Value]), this.reftype.Value, [], this.vm.Value.boolFromI32(mod.if(
			Vect.isInt(local_vects[0]),
			mod.if(
				Vect.isInt(local_vects[1]),
				int_int,
				mod.if(
					Vect.isNat(local_vects[1]),
					int_nat,
					mod.if(
						Vect.isFloat(local_vects[1]),
						int_flt,
						mod.unreachable(),
					),
				),
			),
			mod.if(
				Vect.isNat(local_vects[0]),
				mod.if(
					Vect.isInt(local_vects[1]),
					nat_int,
					mod.if(
						Vect.isNat(local_vects[1]),
						nat_nat,
						mod.if(
							Vect.isFloat(local_vects[1]),
							nat_flt,
							mod.unreachable(),
						),
					),
				),
				mod.if(
					Vect.isFloat(local_vects[0]),
					mod.if(
						Vect.isInt(local_vects[1]),
						flt_int,
						mod.if(
							Vect.isNat(local_vects[1]),
							flt_nat,
							mod.if(
								Vect.isFloat(local_vects[1]),
								flt_flt,
								mod.unreachable(),
							),
						),
					),
					mod.unreachable(),
				),
			),
		)));
	}

	#setupGlobals(): void {
		const global = new Global(this.module, 'obj-ctr', bigint_to_i64(this.module, 0n, true), binaryen.i64, true);
		this.#globals.set(global.name, global);
		global.init();
	}

	#setupFunctions(): void {
		const as_composite = (v: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* eqref */ => this.vm.Value.field(v).composite;

		const mod:       BinaryenModuleUpdates = this.module;
		const rt_value:  binaryen.Type         = this.reftype.Value;
		const rt_tuple:  binaryen.Type         = this.reftype.Tuple;
		const rt_record: binaryen.Type         = this.reftype.Record;
		const rt_list:   binaryen.Type         = this.reftype.List;
		const rt_dict:   binaryen.Type         = this.reftype.Dict;
		const rt_map:    binaryen.Type         = this.reftype.Map;
		const {Vect}      = this.vm;
		const local_vals  = [0, 1].map((i) => mod.local.get(i, rt_value));
		const local_vects = local_vals.map((valuestruct) => this.vm.Value.field(valuestruct).primitive);

		/* Binary Operators */
		this.#setupBinopArithmetic('vidiv_s', mod.i64.div_s.bind(null), 'asInt');
		this.#setupBinopArithmetic('vidiv_u', mod.i64.div_u.bind(null), 'asNat');
		this.#setupBinopArithmetic('vfdiv',   mod.f64.div  .bind(null), 'asFloat');
		this.#setupBinopArithmetic('viexp',   (num0, num1) => mod.call('iexp', [num0, num1], binaryen.i64), 'asInt');

		this.#setupBinopComparative('vlt',  mod.i64.lt_s.bind(null), mod.i64.lt_u.bind(null), mod.f64.lt.bind(null));
		this.#setupBinopComparative('vgt',  mod.i64.gt_s.bind(null), mod.i64.gt_u.bind(null), mod.f64.gt.bind(null));
		this.#setupBinopComparative('vle',  mod.i64.le_s.bind(null), mod.i64.le_u.bind(null), mod.f64.le.bind(null));
		this.#setupBinopComparative('vge',  mod.i64.ge_s.bind(null), mod.i64.ge_u.bind(null), mod.f64.ge.bind(null));
		this.#setupBinopComparative('veqn', mod.i64.eq  .bind(null), mod.i64.eq  .bind(null), mod.f64.eq.bind(null));

		mod.removeFunction('vid'); // removes stub defined in `stubs.wat`
		mod.addFunction('vid', binaryen.createType([rt_value, rt_value]), rt_value, [], this.vm.Value.boolFromI32(mod.if(
			mod.i32.and(
				this.vm.Value.isPrimitive(local_vals[0]),
				this.vm.Value.isPrimitive(local_vals[1]),
			),
			mod.if(
				mod.i32.and(Vect.isSpecial(local_vects[0]), Vect.isSpecial(local_vects[1])),
				mod.i32.eq(Vect.type(local_vects[0]), Vect.type(local_vects[1])),
				mod.if(
					mod.i32.and(Vect.isInt(local_vects[0]), Vect.isInt(local_vects[1])),
					mod.i64.eq(Vect.asInt(local_vects[0]), Vect.asInt(local_vects[1])), // `i64.eq` for ints gives the same result as `ID` operator
					mod.if(
						mod.i32.and(Vect.isNat(local_vects[0]), Vect.isNat(local_vects[1])),
						mod.i64.eq(Vect.asNat(local_vects[0]), Vect.asNat(local_vects[1])), // `i64.eq` for nats gives the same result as `ID` operator
						mod.if(
							mod.i32.and(Vect.isFloat(local_vects[0]), Vect.isFloat(local_vects[1])),
							mod.call('fid', [Vect.asFloat(local_vects[0]), Vect.asFloat(local_vects[1])], binaryen.i32),
							mod.i32.const(0),
						),
					),
				),
			),
			mod.if(
				mod.i32.and(
					mod.ref.test(as_composite(local_vals[0]), rt_tuple),
					mod.ref.test(as_composite(local_vals[1]), rt_tuple),
				),
				mod.call('Tuple.identical', [
					mod.ref.cast(as_composite(local_vals[0]), rt_tuple),
					mod.ref.cast(as_composite(local_vals[1]), rt_tuple),
				], binaryen.i32),
				mod.if(
					mod.i32.and(
						mod.ref.test(as_composite(local_vals[0]), rt_record),
						mod.ref.test(as_composite(local_vals[1]), rt_record),
					),
					mod.call('Record.identical', [
						mod.ref.cast(as_composite(local_vals[0]), rt_record),
						mod.ref.cast(as_composite(local_vals[1]), rt_record),
					], binaryen.i32),
					mod.ref.eq(
						as_composite(local_vals[0]),
						as_composite(local_vals[1]),
					),
				),
			),
		)));

		mod.removeFunction('veq'); // removes stub defined in `stubs.wat`
		mod.addFunction('veq', binaryen.createType([rt_value, rt_value]), rt_value, [], mod.if(
			mod.i32.and(
				this.vm.Value.isPrimitive(local_vals[0]),
				this.vm.Value.isPrimitive(local_vals[1]),
			),
			mod.if(
				mod.i32.or(Vect.isSpecial(local_vects[0]), Vect.isSpecial(local_vects[1])),
				mod.call('vid',  [local_vals[0], local_vals[1]], rt_value),
				mod.call('veqn', [local_vals[0], local_vals[1]], rt_value),
			),
			mod.if(
				mod.i32.and(
					mod.ref.test(as_composite(local_vals[0]), rt_tuple),
					mod.ref.test(as_composite(local_vals[1]), rt_tuple),
				),
				this.vm.Value.boolFromI32(mod.call('Tuple.equal', [
					mod.ref.cast(as_composite(local_vals[0]), rt_tuple),
					mod.ref.cast(as_composite(local_vals[1]), rt_tuple),
				], binaryen.i32)),
				mod.if(
					mod.i32.and(
						mod.ref.test(as_composite(local_vals[0]), rt_record),
						mod.ref.test(as_composite(local_vals[1]), rt_record),
					),
					this.vm.Value.boolFromI32(mod.call('Record.equal', [
						mod.ref.cast(as_composite(local_vals[0]), rt_record),
						mod.ref.cast(as_composite(local_vals[1]), rt_record),
					], binaryen.i32)),
					mod.if(
						mod.i32.and(
							mod.ref.test(as_composite(local_vals[0]), rt_list),
							mod.ref.test(as_composite(local_vals[1]), rt_list),
						),
						this.vm.Value.boolFromI32(mod.call('List.equal', [
							mod.ref.cast(as_composite(local_vals[0]), rt_list),
							mod.ref.cast(as_composite(local_vals[1]), rt_list),
						], binaryen.i32)),
						mod.if(
							mod.i32.and(
								mod.ref.test(as_composite(local_vals[0]), rt_dict),
								mod.ref.test(as_composite(local_vals[1]), rt_dict),
							),
							this.vm.Value.boolFromI32(mod.call('Dict.equal', [
								mod.ref.cast(as_composite(local_vals[0]), rt_dict),
								mod.ref.cast(as_composite(local_vals[1]), rt_dict),
							], binaryen.i32)),
							mod.if(
								mod.i32.and(
									mod.ref.test(as_composite(local_vals[0]), rt_map),
									mod.ref.test(as_composite(local_vals[1]), rt_map),
								),
								this.vm.Value.boolFromI32(mod.call('Map.equal', [
									mod.ref.cast(as_composite(local_vals[0]), rt_map),
									mod.ref.cast(as_composite(local_vals[1]), rt_map),
								], binaryen.i32)),
								mod.call('vid', [local_vals[0], local_vals[1]], rt_value),
							),
						),
					),
				),
			),
		));
	}

	/**
	 * Prepare the main function in this binaryen Module, then performs validation.
	 * The main function should contain generated code for a program.
	 * @param main a callback to run before validation
	 */
	public setupMain(main?: () => void): void {
		main?.call(null);
		if (!this.module.validate()) {
			throw new Error('Invalid WebAssembly module.');
		}
	}
}

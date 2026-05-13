import * as assert from 'node:assert';
import binaryen from 'binaryen';
import {VirtualMachine} from '../vm/index.ts';
import type {SymbolSchemaVar} from '../validator/index.ts';
import type {Temp} from '../optimizer/index.ts';
import {Global} from '../code-generator/index.ts';
import {bigint_to_i64} from './utils-public.ts';
import {Local} from './Local.ts';



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


	public constructor(public readonly vm: VirtualMachine = new VirtualMachine()) {
		this.module      = this.vm.mod;
		this.heaptype    = this.vm.heaptype;
		this.reftype     = this.vm.reftype;
		this.reftypeNull = this.vm.reftypeNull;

		this.#setupGlobals();

		this.#constRegistry = new Map([
			[BinConst.NULL,  this.vm.Value.newPrimitive(this.vm.Vect.NULL)],
			[BinConst.FALSE, this.vm.Value.newPrimitive(this.vm.Vect.FALSE)],
			[BinConst.TRUE,  this.vm.Value.newPrimitive(this.vm.Vect.TRUE)],
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
	 * @deprecated
	 */
	public newVect(
		arg:  binaryen.ExpressionRef /* unreachable | i64 | f64 | v128 */,
		opts: {unsigned?: boolean, scale?: bigint} = {},
	): binaryen.ExpressionRef /* v128 */ {
		const {Vect} = this.vm;
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
			...[...cases].map(([ant, con]) => this.vm.Map.set(local.get(), ant, con)),
			local.get(),
		], this.reftype.Map);
	}

	#setupGlobals(): void {
		const global = new Global(this.module, 'obj-ctr', bigint_to_i64(this.module, 0n, true), binaryen.i64, true);
		this.#globals.set(global.name, global);
		global.init();
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

import * as binaryen from 'binaryen.ts';
import {VirtualMachine} from '../vm/index.ts';
import type {SymbolSchemaVar} from '../validator/index.ts';
import type {Temp} from '../builder/index.ts';
import {Local} from './Local.ts';



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
 * The CodeGenerator generates assembly code.
 */
export class CodeGenerator {
	/**
	 * Load Factor for arrays.
	 * The number of items (including tombstones) in a `$ListInternal`/`$DictInternal`
	 * must not exceed this factor as a multiple of array length.
	 */
	static readonly #LOAD_FACTOR = 7 / 8;


	/** A registry of constant WASM expressions. */
	readonly #constRegistry: ReadonlyMap<null | boolean, binaryen.ExpressionRef>;

	/** A set containing data of WASM local variables. */
	readonly #locals = new Set<Local>();

	/** A map containing code-generated `CfgNode`s. */
	readonly #blockRefs = new Map<string, binaryen.RelooperBlockRef>();

	/** The Binaryen module holding the generated code. */
	public readonly mod: binaryen.Module;


	public constructor(public readonly vm: VirtualMachine = new VirtualMachine()) {
		this.mod = new binaryen.Module();
		this.mod.features = vm.mod.features;

		this.#constRegistry = new Map<null | boolean, binaryen.ExpressionRef>([
			[null,  this.vm.Value.newPrimitive(this.vm.Vect.NULL)],
			[false, this.vm.Value.newPrimitive(this.vm.Vect.FALSE)],
			[true,  this.vm.Value.newPrimitive(this.vm.Vect.TRUE)],
		]);
	}

	public getConst(key: null | boolean): binaryen.ExpressionRef {
		return this.#constRegistry.get(key)!;
	}

	/**
	 * Create and add a new temporary local variable, for use in short-circuiting operations and placeholder values.
	 * @param value the binaryen value of the variable to add
	 * @param type  the type of the value; if not supplied, the Local will compute its type using `binaryen.getExpressionType`
	 * @return      the new local variable
	 */
	public newLocal(value: binaryen.ExpressionRef, typ?: binaryen.Type): Local {
		const local = new Local(this.mod.wasm, this.#locals.size, value, typ);
		this.#locals.add(local);
		return local;
	}

	/**
	 * Set a local variable, given a variable id.
	 * If a variable with that id has already been added, do nothing.
	 * @param schema the compiler’s internal data for a declared variable or a Builder temporary
	 * @param value  the binaryen value of the variable to set
	 * @param type   the type of the value; if not supplied, the Local will compute its type using `binaryen.getExpressionType`
	 * @return       Was the operation performed?
	 */
	public setLocal(schema: SymbolSchemaVar | Temp, value: binaryen.ExpressionRef, typ?: binaryen.Type): boolean {
		let did: boolean = false;
		if (!this.getLocal(schema)) {
			this.#locals.add(new Local(this.mod.wasm, this.#locals.size, value, typ, schema));
			did = true;
		}
		return did;
	}

	/**
	 * Get the local with the given schema/temp in this CodeGenerator’s list, if it’s been added; else, return `undefined`.
	 * @param  schema the compiler’s internal data for a declared variable or a Builder temporary
	 * @return        the local or `undefined`
	 */
	public getLocal(schema: SymbolSchemaVar | Temp): Local | undefined {
		return [...this.#locals].find((local) => local.schema === schema);
	}

	/**
	 * Set and then return a local variable.
	 * If a variable with that schema has already been added, this CodeGenerator’s state is not changed.
	 * @param schema the compiler’s internal data for a declared variable or a Builder temporary
	 * @param value  the binaryen value of the variable to set
	 * @param type   the type of the value; if not supplied, the Local will compute its type using `binaryen.getExpressionType`
	 * @return       the local variable set (or retrieved)
	 */
	public teeLocal(schema: SymbolSchemaVar | Temp, value: binaryen.ExpressionRef, type?: binaryen.Type): Local {
		this.setLocal(schema, value, type);
		return this.getLocal(schema)!;
	}

	/**
	 * Return a copy of a list of this CodeGenerator’s local variables.
	 * @return the local variables in an array
	 */
	public getAllLocals(): Local[] {
		return [...this.#locals];
	}

	/**
	 * Register a new code-gen’d block.
	 * @param label the block label
	 * @param block_ref the code-generated block
	 */
	public registerBlockRef(label: string, block_ref: binaryen.RelooperBlockRef): void {
		this.#blockRefs.set(label, block_ref);
	}

	/**
	 * Retrieve a code-gen’d block by label.
	 * @param label the block label
	 * @returns     the code-generated block
	 */
	public getBlockRef(label: string): binaryen.RelooperBlockRef {
		if (!this.#blockRefs.has(label)) {
			throw new Error(`BlockRef with label \`${ label }\` not found in CodeGenerator.`);
		}
		return this.#blockRefs.get(label)!;
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
		const {vm: {heaptype, reftype, reftypeNull}, mod: {wasm}} = this;
		switch (binaryen.getExpressionType(arg)) {
			case binaryen.unreachable: {
				return arg;
			}
			// WARNING: leaky abstraction! bitwise-ORing with 4 provides the “exact” type, i.e. `(ref (exact $Value))` --- see WebAssembly/binaryen/src/wasm-type.h
			case binaryen.nullref: // `(ref null none)` // BUG: Binaryen treats all nullish values the same. See NOTE below.
			case reftypeNull.Value | 4:
			case reftype.Value     | 4:
			case reftypeNull.Value:
			case reftype.Value:
			default: {
				/* NOTE: If the expression type is `binaryen.nullref`, we’re assuming a `(ref null $Value)` was given.
				But in case a `(ref null $Case)`, etc. is given, an `(unreachable)` should be returned, since those aren’t valid in a `$Property` struct.
				Since Binaryen considers all nullish values to be `nullref`, we can’t make that distinction. */
				return wasm.struct.new([
					wasm.i64.const(key),
					arg,
				], heaptype.Property);
			}
		}
	}

	/**
	 * Return a new `$String` from UTF-8-encoded code units.
	 * @param units items in the array; must be of type `i32`
	 * @return      `(array.new_fixed $String <...items>)`
	 */
	public codegenString(units: readonly binaryen.ExpressionRef[] = []): binaryen.ExpressionRef {
		return this.mod.wasm.array.new_fixed(this.vm.heaptype.String, units);
	}

	/**
	 * Return a new `$Tuple` from items.
	 * @param items items in the array; must be of type `(ref $Value)`
	 * @return      `(array.new_fixed $Tuple <...items>)`
	 */
	public codegenTuple(items: readonly binaryen.ExpressionRef[] = []): binaryen.ExpressionRef {
		return this.mod.wasm.array.new_fixed(this.vm.heaptype.Tuple, items);
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
		return this.mod.wasm.array.new_fixed(this.vm.heaptype.Record, entries as binaryen.ExpressionRef[]);
	}

	/**
	 * Return a new `$List` from items.
	 * This method automatically populates blank slots with the WASM expression `(ref.null $Value)`.
	 * @param items items in the array; must be of type `(ref null $Value)`
	 * @return      `(struct.new $List <count> (array.new_fixed $ListInternal <...items>))`
	 */
	public codegenList(items: readonly binaryen.ExpressionRef[] = []): binaryen.ExpressionRef {
		const {vm: {heaptype, reftypeNull, Object: VmObject}, mod: {wasm}} = this;
		let capacity: number = 8;
		while (items.length > capacity * CodeGenerator.#LOAD_FACTOR) {
			capacity *= 2;
		}
		const entries: binaryen.ExpressionRef[] = Array.from(
			new Array(capacity),
			(_, i) => items[i] ?? wasm.ref.null(reftypeNull.Value),
		);
		return wasm.struct.new([
			VmObject.ctrPlusPlus(),
			wasm.i32.const(items.length),
			wasm.array.new_fixed(heaptype.ListInternal, entries),
		], heaptype.List);
	}

	/**
	 * Return a new `$Dict` from properties.
	 * This method automatically hashes the property keys and inserts them at the correct indices,
	 * as well as populates blank slots with the WASM expression `(ref.null $Property)`.
	 * @param props key–value pairs whose keys are key ids (`bigint`s) and whose values (of type `(ref $Value)`) are items in the array
	 * @return      `(struct.new $Dict <count> (array.new_fixed $DictInternal <...props>))`
	 */
	public codegenDict(props: ReadonlyMap<bigint, binaryen.ExpressionRef> = new Map()): binaryen.ExpressionRef {
		const {vm: {heaptype, reftypeNull, Object: VmObject}, mod: {wasm}} = this;
		let capacity: number = 8;
		while (props.size > capacity * CodeGenerator.#LOAD_FACTOR) {
			capacity *= 2;
		}
		const entries = new Array<binaryen.ExpressionRef | undefined>(capacity).fill(undefined);
		props.forEach((code, id) => insert_entry(entries, Number(id) % entries.length, code));
		return wasm.struct.new([
			VmObject.ctrPlusPlus(),
			wasm.i32.const(props.size),
			wasm.array.new_fixed(
				heaptype.DictInternal,
				entries.map((entry) => entry ?? wasm.ref.null(reftypeNull.Property)),
			),
		], heaptype.Dict);
	}

	/**
	 * Return a new struct modeling a Set from items.
	 * It uses a `$Map` implementation, where the cases consist of item–`null` pairs (the Counterpoint `null` value).
	 * This method automatically populates blank slots with the WASM expression `(ref.null $Case)`.
	 * @param items items to be used as antecedents in the array of cases; must be of type `(ref null $Value)`
	 * @return      `(struct.new $Map <count> (array.new_fixed $MapInternal <...cases>))`
	 */
	public codegenSet(items: readonly binaryen.ExpressionRef[] = []): binaryen.ExpressionRef {
		return this.codegenMap(new Map(items.map((item) => [item, this.getConst(null)])));
	}

	/**
	 * Return a new `$Map` from cases.
	 * This method automatically hashes the case antecedents and inserts them at the correct indices,
	 * as well as populates blank slots with the WASM expression `(ref.null $Case)`.
	 * @param props antecedent–consequent pairs of values (of type `(ref $Value)`) in the array
	 * @return      `(struct.new $Map <count> (array.new_fixed $MapInternal <...cases>))`
	 */
	public codegenMap(cases: ReadonlyMap<binaryen.ExpressionRef, binaryen.ExpressionRef> = new Map()): binaryen.ExpressionRef {
		const {vm: {heaptype, reftype, Object: VmObject, Map: VmMap}, mod: {wasm}} = this;
		let capacity: number = 8;
		while (cases.size > capacity * CodeGenerator.#LOAD_FACTOR) {
			capacity *= 2;
		}
		const map_obj = wasm.struct.new([
			VmObject.ctrPlusPlus(),
			wasm.i32.const(cases.size),
			wasm.array.new_default(heaptype.MapInternal, wasm.i32.const(capacity)),
		], heaptype.Map);
		if (!cases.size) {
			return map_obj;
		}
		const local: Local = this.newLocal(map_obj, reftype.Map);
		return wasm.block(null, [
			local.set(),
			...[...cases].map(([ant, con]) => VmMap.set(local.get(), ant, con)),
			local.get(),
		], reftype.Map);
	}

	/**
	 * Return a new `$Maybe` from a given optional value.
	 * @param value the optional value; if not given, `(ref.null $Value)` is used
	 * @return      `(struct.new $Maybe <value?>)`
	 */
	public codegenMaybe(value?: binaryen.ExpressionRef): binaryen.ExpressionRef {
		const {vm: {heaptype, reftypeNull, Object: VmObject}, mod: {wasm}} = this;
		return wasm.struct.new([
			VmObject.ctrPlusPlus(),
			value ?? wasm.ref.null(reftypeNull.Value),
		], heaptype.Maybe);
	}

	/**
	 * Prepare the main function in this binaryen Module, then performs validation.
	 * The main function should contain generated code for a program.
	 * @param body the body of the main function
	 */
	public setupMain(body: binaryen.ExpressionRef): void {
		const {mod} = this;

		const extern_mod_name: string = 'wat';
		this.vm.globalImportDataMap.forEach((data, export_name) => (
			mod.imports.addGlobal(data.name, extern_mod_name, export_name, data.type, false)
		));
		[
			this.vm.util     .funcImportDataMap,
			this.vm.op       .funcImportDataMap,
			this.vm.Vect     .funcImportDataMap,
			this.vm.Value    .funcImportDataMap,
			this.vm.Property .funcImportDataMap,
			this.vm.Case     .funcImportDataMap,
			this.vm.Record   .funcImportDataMap,
			this.vm.Object   .funcImportDataMap,
			this.vm.List     .funcImportDataMap,
			this.vm.Dict     .funcImportDataMap,
			this.vm.Map      .funcImportDataMap,
			this.vm.Maybe    .funcImportDataMap,
		].forEach((datamap) => datamap.forEach((data, export_name) => (
			mod.imports.addFunction(data.name, extern_mod_name, export_name, data.param, data.result)
		)));

		const fn_name: string = 'main';
		mod.functions.add(
			fn_name,
			binaryen.none,
			binaryen.none,
			this.getAllLocals().map((local) => local.type),
			body,
		);
		mod.exports.addFunction(fn_name, fn_name);
		if (!mod.validate()) {
			throw new Error('Invalid WebAssembly module.');
		}
	}
}

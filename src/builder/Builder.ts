import * as fs from 'node:fs';
import * as path from 'node:path';
import binaryen from 'binaryen';
import type {
	AST,
	SymbolSchemaVar,
} from '../validator/index.ts';
import type {Temp} from '../optimizer/index.ts';
import {BinValue} from '../code-generator/index.ts';
import {bigint_to_i64} from './utils-public.ts';
import {Local} from './Local.ts';
import {BinVect} from './BinVect.ts';
import type {
	BinaryenModuleUpdates,
	Field,
	TypeBuilder,
} from './-types.d.ts';



type HeaptypeKey = (
	| '$Value'
	| '$Property'
	| '$Tuple'
	| '$Record'
	| '$ListInternal'
	| '$DictInternal'
	| '$Object'
	| '$List'
	| '$Dict'
);
type ReftypeKey = `(ref ${ 'null ' | '' }${ HeaptypeKey })`;



/**
 * A type modeling the Binaryen `module.block`.
 */
type Block = {
	readonly index: number,
	readonly node:  AST.ASTNodeCP,
};



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
	private static readonly IMPORTS: readonly string[] = [
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/types.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/builder/iexp.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/builder/isub_u.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/builder/fid.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/mod.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/retrieve-entry-record.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/retrieve-entry-dict.wat'), 'utf8'),
	];

	/**
	 * Create a new struct field for a `TypeBuilder`.
	 * @param typ        the field type
	 * @param packedType one of `'notPacked' | 'i8' | 'i16'` @default `'notPacked'`
	 * @param mutable    Can the field be reassigned?        @default `false`
	 */
	private static newField(typ: binaryen.Type, packedType: 'notPacked' | 'i8' | 'i16' = 'notPacked', mutable: boolean = false): Field {
		return {
			type:       typ,
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			// eslint-disable-next-line
			packedType: binaryen[packedType],
			mutable,
		};
	}


	/** A lookup table for heap types created by a Binaryen TypeBuilder. */
	readonly #heaptypeRegistry = new Map<HeaptypeKey, binaryen.Type>();

	/** A registry of reference (and reference-null) types. */
	readonly #reftypeRegistry = new Map<ReftypeKey, binaryen.Type>();

	#typeCount: bigint = 0n;

	/** A set containing data of WASM local variables. */
	readonly #locals = new Set<Local>();

	/** A set containing blocks. */
	private readonly blocks = new Set<Block>();

	/** The Binaryen module to build upon building. */
	public readonly module: BinaryenModuleUpdates = binaryen.parseText(`
		(module
			${ Builder.IMPORTS.join('') }
		)
	`) as BinaryenModuleUpdates;

	// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
	// eslint-disable-next-line
	public readonly typeBuilder: TypeBuilder = new binaryen.TypeBuilder();

	public constructor() {
		this.#setupTypes();
	}

	public nextTypeIndex(): bigint {
		return this.#typeCount++;
	}

	public getHeaptype(key: HeaptypeKey): binaryen.Type | undefined {
		return this.#heaptypeRegistry.get(key);
	}

	public getReftype(key: ReftypeKey): binaryen.Type | undefined {
		return this.#reftypeRegistry.get(key);
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
	 * Set a new block, given an ASTNode.
	 * @param node node that builds the block
	 * @return     Was the operation performed?
	 */
	public setBlock(node: AST.ASTNodeCP): boolean {
		let did: boolean = false;
		if (!this.getBlock(node)) {
			this.blocks.add({node, index: this.blocks.size});
			did = true;
		}
		return did;
	}

	/**
	 * Get the block with the given node in this Builder’s list, if it’s been added; else, return `undefined`.
	 * @param  node the node of the block to get
	 * @return      the block or `undefined`
	 */
	public getBlock(node: AST.ASTNodeCP): Block | undefined {
		return [...this.blocks].find((block) => block.node === node);
	}

	/**
	 * Set a block to the given node and return it.
	 * If a block with that node has already been added, this Builder’s state is not changed.
	 * @param node the node of the block to set
	 * @return     the block set (or retreived)
	 */
	public teeBlock(node: AST.ASTNodeCP): Block {
		this.setBlock(node);
		return this.getBlock(node)!;
	}

	/**
	 * Return a new `$Tuple` from items.
	 * @param items items in the array; must be of type `(ref $Value)`
	 * @return      `(array.new_fixed $Tuple <...items>)`
	 */
	public codegenTuple(items: readonly binaryen.ExpressionRef[] = []): binaryen.ExpressionRef {
		return this.module.array.new_fixed(this.getHeaptype('$Tuple')!, items);
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
		return this.module.array.new_fixed(this.getHeaptype('$Record')!, entries as binaryen.ExpressionRef[]);
	}

	/**
	 * Return a new `$List` from items.
	 * The capacity of `$ListInternal` is always the least power of 2 greater than or equal to
	 * the number of given items (the List’s count), or 8, whichever is greater.
	 * This method automatically populates blank slots with the WASM expression `(ref.null $Value)`.
	 * @param items items in the array; must be of type `(ref null $Value)`
	 * @return      `(struct.new $List <count> (array.new_fixed $ListInternal <...items>))`
	 */
	public codegenList(items: readonly binaryen.ExpressionRef[] = []): binaryen.ExpressionRef {
		let capacity: number = 8;
		while (capacity < items.length) {
			capacity *= 2;
		}
		const entries: binaryen.ExpressionRef[] = Array.from(
			new Array(capacity),
			(_, i) => items[i] ?? this.module.ref.null(this.getReftype('(ref null $Value)')!),
		);
		return this.module.struct.new([
			this.module.i32.const(items.length),
			this.module.array.new_fixed(this.getHeaptype('$ListInternal')!, entries),
		], this.getHeaptype('$List')!);
	}

	/**
	 * Return a new `$Dict` from properties.
	 * This method automatically hashes the property keys and inserts them at the correct indices,
	 * as well as populates blank slots with the WASM expression `(ref.null $Property)`.
	 * @param props key–value pairs whose keys are key ids (`bigint`s) and whose values (of type `(ref null $Property)`) are items in the array
	 * @return      `(struct.new $Dict <count> (array.new_fixed $DictInternal <...items>))`
	 */
	public codegenDict(props: ReadonlyMap<bigint, binaryen.ExpressionRef> = new Map()): binaryen.ExpressionRef {
		let capacity: number = 8;
		while (capacity < props.size) {
			capacity *= 2;
		}
		const entries = new Array<binaryen.ExpressionRef | undefined>(capacity).fill(undefined);
		props.forEach((code, id) => insert_entry(entries, Number(id) % entries.length, code));
		return this.module.struct.new([
			this.module.i32.const(props.size),
			this.module.array.new_fixed(
				this.getHeaptype('$DictInternal')!,
				entries.map((entry) => entry ?? this.module.ref.null(this.getReftype('(ref null $Property)')!)),
			),
		], this.getHeaptype('$Dict')!);
	}

	/**
	 * Set up common types.
	 * We’ve defined these in a static `types.wat` file,
	 * but there’s currently no way to access them dynamically with Binaryen,
	 * so we repeat them here.
	 */
	#setupTypes(): void {
		// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
		// eslint-disable-next-line
		const tb: TypeBuilder = new binaryen.TypeBuilder();

		let type_count: number = 0;

		/* (type $Value ...) */
		const i_value: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_value, [
			Builder.newField(binaryen.i32, 'i8'),
			Builder.newField(binaryen.v128),
			Builder.newField(binaryen.eqref),
		]);

		/* (type $Property ...) */
		const i_property: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_property, [
			Builder.newField(binaryen.i32),
			Builder.newField(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
		]);

		/* (type $Tuple ...) */
		const i_tuple: number = type_count++;
		tb.grow(1);
		tb.setArrayType(
			i_tuple,
			tb.getTempRefType(tb.getTempHeapType(i_value), false),
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			// eslint-disable-next-line
			binaryen.notPacked,
			false,
		);

		/* (type $Record ...) */
		const i_record: number = type_count++;
		tb.grow(1);
		tb.setArrayType(
			i_record,
			tb.getTempRefType(tb.getTempHeapType(i_property), false),
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			// eslint-disable-next-line
			binaryen.notPacked,
			false,
		);

		/* (type $ListInternal ...) */
		const i_list_internal: number = type_count++;
		tb.grow(1);
		tb.setArrayType(
			i_list_internal,
			tb.getTempRefType(tb.getTempHeapType(i_value), true),
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			// eslint-disable-next-line
			binaryen.notPacked,
			true,
		);

		/* (type $DictInternal ...) */
		const i_dict_internal: number = type_count++;
		tb.grow(1);
		tb.setArrayType(
			i_dict_internal,
			tb.getTempRefType(tb.getTempHeapType(i_property), true),
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			// eslint-disable-next-line
			binaryen.notPacked,
			true,
		);

		/* (type $Object ...) */
		const i_object: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_object, []);
		tb.setOpen(i_object);

		/* (type $List ...) */
		const i_list: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_list, [
			Builder.newField(binaryen.v128, 'notPacked', true),
			Builder.newField(tb.getTempRefType(tb.getTempHeapType(i_list_internal), false), 'notPacked', true),
		]);
		tb.setSubType(i_list, tb.getTempHeapType(i_object));
		tb.setOpen(i_list);

		/* (type $Dict ...) */
		const i_dict: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_dict, [
			Builder.newField(binaryen.v128, 'notPacked', true),
			Builder.newField(tb.getTempRefType(tb.getTempHeapType(i_dict_internal), false), 'notPacked', true),
		]);
		tb.setSubType(i_dict, tb.getTempHeapType(i_object));
		tb.setOpen(i_dict);

		const heaptypes: readonly binaryen.Type[] = tb.buildAndDispose();

		this.#heaptypeRegistry.set('$Value',        heaptypes[i_value]);
		this.#heaptypeRegistry.set('$Property',     heaptypes[i_property]);
		this.#heaptypeRegistry.set('$Tuple',        heaptypes[i_tuple]);
		this.#heaptypeRegistry.set('$Record',       heaptypes[i_record]);
		this.#heaptypeRegistry.set('$ListInternal', heaptypes[i_list_internal]);
		this.#heaptypeRegistry.set('$DictInternal', heaptypes[i_dict_internal]);
		this.#heaptypeRegistry.set('$Object',       heaptypes[i_object]);
		this.#heaptypeRegistry.set('$List',         heaptypes[i_list]);
		this.#heaptypeRegistry.set('$Dict',         heaptypes[i_dict]);

		// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
		const {getTypeFromHeapType} = binaryen;

		/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
		this.#reftypeRegistry.set('(ref $Value)',        getTypeFromHeapType(heaptypes[i_value],         false));
		this.#reftypeRegistry.set('(ref $Property)',     getTypeFromHeapType(heaptypes[i_property],      false));
		this.#reftypeRegistry.set('(ref $Tuple)',        getTypeFromHeapType(heaptypes[i_tuple],         false));
		this.#reftypeRegistry.set('(ref $Record)',       getTypeFromHeapType(heaptypes[i_record],        false));
		this.#reftypeRegistry.set('(ref $ListInternal)', getTypeFromHeapType(heaptypes[i_list_internal], false));
		this.#reftypeRegistry.set('(ref $DictInternal)', getTypeFromHeapType(heaptypes[i_dict_internal], false));
		this.#reftypeRegistry.set('(ref $Object)',       getTypeFromHeapType(heaptypes[i_object],        false));
		this.#reftypeRegistry.set('(ref $List)',         getTypeFromHeapType(heaptypes[i_list],          false));
		this.#reftypeRegistry.set('(ref $Dict)',         getTypeFromHeapType(heaptypes[i_dict],          false));

		this.#reftypeRegistry.set('(ref null $Value)',    getTypeFromHeapType(heaptypes[i_value],    true)); // only used as the fields of `$ListInternal`
		this.#reftypeRegistry.set('(ref null $Property)', getTypeFromHeapType(heaptypes[i_property], true)); // only used as the fields of `$DictInternal`
		/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
	}

	#binOpArithmetic(
		name:    string,
		method:  (num0: binaryen.ExpressionRef, num1: binaryen.ExpressionRef) => binaryen.ExpressionRef,
		typekey: 'intValue' | 'natValue' | 'floatValue',
	): binaryen.FunctionRef {
		const mod: binaryen.Module = this.module;
		const local_vects = [
			new BinVect(mod, mod.local.get(0, binaryen.v128)),
			new BinVect(mod, mod.local.get(1, binaryen.v128)),
		] as const;
		return mod.addFunction(
			name,
			binaryen.createType([binaryen.v128, binaryen.v128]),
			binaryen.v128,
			[],
			new BinVect(mod, method.call(null, local_vects[0][typekey], local_vects[1][typekey])).vect,
		);
	}

	#binOpComparative(
		name:        string,
		method_ints: (int0:   binaryen.ExpressionRef, int1:   binaryen.ExpressionRef) => binaryen.ExpressionRef,
		method_nats: (nat0:   binaryen.ExpressionRef, nat1:   binaryen.ExpressionRef) => binaryen.ExpressionRef,
		method_flts: (float0: binaryen.ExpressionRef, float1: binaryen.ExpressionRef) => binaryen.ExpressionRef,
	): binaryen.FunctionRef {
		const mod: binaryen.Module = this.module;
		const local_vects = [
			new BinVect(mod, mod.local.get(0, binaryen.v128)),
			new BinVect(mod, mod.local.get(1, binaryen.v128)),
		] as const;
		const int_int: binaryen.ExpressionRef = BinVect.asBool(mod, method_ints.call(null, local_vects[0].intValue,   local_vects[1].intValue));
		const int_nat: binaryen.ExpressionRef = BinVect.asBool(mod, method_nats.call(null, local_vects[0].i_to_n(),   local_vects[1].natValue));
		const int_flt: binaryen.ExpressionRef = BinVect.asBool(mod, method_flts.call(null, local_vects[0].i_to_f(),   local_vects[1].floatValue));
		const nat_int: binaryen.ExpressionRef = BinVect.asBool(mod, method_nats.call(null, local_vects[0].natValue,   local_vects[1].i_to_n()));
		const nat_nat: binaryen.ExpressionRef = BinVect.asBool(mod, method_nats.call(null, local_vects[0].natValue,   local_vects[1].natValue));
		const nat_flt: binaryen.ExpressionRef = BinVect.asBool(mod, method_flts.call(null, local_vects[0].n_to_f(),   local_vects[1].floatValue));
		const flt_int: binaryen.ExpressionRef = BinVect.asBool(mod, method_flts.call(null, local_vects[0].floatValue, local_vects[1].i_to_f()));
		const flt_nat: binaryen.ExpressionRef = BinVect.asBool(mod, method_flts.call(null, local_vects[0].floatValue, local_vects[1].n_to_f()));
		const flt_flt: binaryen.ExpressionRef = BinVect.asBool(mod, method_flts.call(null, local_vects[0].floatValue, local_vects[1].floatValue));
		return mod.addFunction(name, binaryen.createType([binaryen.v128, binaryen.v128]), binaryen.v128, [], mod.if(
			local_vects[0].isInt,
			mod.if(
				local_vects[1].isInt,
				int_int,
				mod.if(
					local_vects[1].isNat,
					int_nat,
					mod.if(
						local_vects[1].isFloat,
						int_flt,
						mod.unreachable(),
					),
				),
			),
			mod.if(
				local_vects[0].isNat,
				mod.if(
					local_vects[1].isInt,
					nat_int,
					mod.if(
						local_vects[1].isNat,
						nat_nat,
						mod.if(
							local_vects[1].isFloat,
							nat_flt,
							mod.unreachable(),
						),
					),
				),
				mod.if(
					local_vects[0].isFloat,
					mod.if(
						local_vects[1].isInt,
						flt_int,
						mod.if(
							local_vects[1].isNat,
							flt_nat,
							mod.if(
								local_vects[1].isFloat,
								flt_flt,
								mod.unreachable(),
							),
						),
					),
					mod.unreachable(),
				),
			),
		));
	}

	/** assumes both operands are primitive */
	#setupBinopArithmetic(
		name:    string,
		method:  (num0: binaryen.ExpressionRef, num1: binaryen.ExpressionRef) => binaryen.ExpressionRef,
		typekey: 'intValue' | 'natValue' | 'floatValue',
	): binaryen.FunctionRef {
		const mod:      BinaryenModuleUpdates = this.module;
		const rt_value: binaryen.Type         = this.getReftype('(ref $Value)')!;
		const local_vects = [
			new BinValue(this, mod.local.get(0, rt_value)),
			new BinValue(this, mod.local.get(1, rt_value)),
		].map((binval) => new BinVect(mod, binval.primitiveValue));
		return mod.addFunction(
			name,
			binaryen.createType([rt_value, rt_value]),
			rt_value,
			[],
			new BinValue(this, new BinVect(mod, method.call(null, local_vects[0][typekey], local_vects[1][typekey])).vect).value,
		);
	};

	/** assumes both operands are primitive */
	#setupBinopComparative(
		name:        string,
		method_ints: (int0:   binaryen.ExpressionRef, int1:   binaryen.ExpressionRef) => binaryen.ExpressionRef,
		method_nats: (nat0:   binaryen.ExpressionRef, nat1:   binaryen.ExpressionRef) => binaryen.ExpressionRef,
		method_flts: (float0: binaryen.ExpressionRef, float1: binaryen.ExpressionRef) => binaryen.ExpressionRef,
	): binaryen.FunctionRef {
		const mod:      BinaryenModuleUpdates = this.module;
		const rt_value: binaryen.Type         = this.getReftype('(ref $Value)')!;
		const local_vects = [
			new BinValue(this, mod.local.get(0, rt_value)),
			new BinValue(this, mod.local.get(1, rt_value)),
		].map((binval) => new BinVect(mod, binval.primitiveValue));

		const int_int: binaryen.ExpressionRef = new BinValue(this, BinVect.asBool(mod, method_ints.call(null, local_vects[0].intValue,   local_vects[1].intValue)))  .value;
		const int_nat: binaryen.ExpressionRef = new BinValue(this, BinVect.asBool(mod, method_nats.call(null, local_vects[0].i_to_n(),   local_vects[1].natValue)))  .value;
		const int_flt: binaryen.ExpressionRef = new BinValue(this, BinVect.asBool(mod, method_flts.call(null, local_vects[0].i_to_f(),   local_vects[1].floatValue))).value;
		const nat_int: binaryen.ExpressionRef = new BinValue(this, BinVect.asBool(mod, method_nats.call(null, local_vects[0].natValue,   local_vects[1].i_to_n())))  .value;
		const nat_nat: binaryen.ExpressionRef = new BinValue(this, BinVect.asBool(mod, method_nats.call(null, local_vects[0].natValue,   local_vects[1].natValue)))  .value;
		const nat_flt: binaryen.ExpressionRef = new BinValue(this, BinVect.asBool(mod, method_flts.call(null, local_vects[0].n_to_f(),   local_vects[1].floatValue))).value;
		const flt_int: binaryen.ExpressionRef = new BinValue(this, BinVect.asBool(mod, method_flts.call(null, local_vects[0].floatValue, local_vects[1].i_to_f())))  .value;
		const flt_nat: binaryen.ExpressionRef = new BinValue(this, BinVect.asBool(mod, method_flts.call(null, local_vects[0].floatValue, local_vects[1].n_to_f())))  .value;
		const flt_flt: binaryen.ExpressionRef = new BinValue(this, BinVect.asBool(mod, method_flts.call(null, local_vects[0].floatValue, local_vects[1].floatValue))).value;

		return mod.addFunction(name, binaryen.createType([rt_value, rt_value]), rt_value, [], mod.if(
			local_vects[0].isInt,
			mod.if(
				local_vects[1].isInt,
				int_int,
				mod.if(
					local_vects[1].isNat,
					int_nat,
					mod.if(
						local_vects[1].isFloat,
						int_flt,
						mod.unreachable(),
					),
				),
			),
			mod.if(
				local_vects[0].isNat,
				mod.if(
					local_vects[1].isInt,
					nat_int,
					mod.if(
						local_vects[1].isNat,
						nat_nat,
						mod.if(
							local_vects[1].isFloat,
							nat_flt,
							mod.unreachable(),
						),
					),
				),
				mod.if(
					local_vects[0].isFloat,
					mod.if(
						local_vects[1].isInt,
						flt_int,
						mod.if(
							local_vects[1].isNat,
							flt_nat,
							mod.if(
								local_vects[1].isFloat,
								flt_flt,
								mod.unreachable(),
							),
						),
					),
					mod.unreachable(),
				),
			),
		));
	};

	#setupFunctions(): void {
		const mod: binaryen.Module = this.module;
		const local_vects = [
			new BinVect(mod, mod.local.get(0, binaryen.v128)),
			new BinVect(mod, mod.local.get(1, binaryen.v128)),
		] as const;
		mod.addFunction(
			'isnull',
			binaryen.v128,
			binaryen.v128,
			[],
			BinVect.asBool(mod, local_vects[0].isSpecial(null)),
		);
		mod.addFunction(
			'vnot',
			binaryen.v128,
			binaryen.v128,
			[],
			BinVect.asBool(mod, mod.i32.or(local_vects[0].isSpecial(null), local_vects[0].isSpecial(false))),
		);
		mod.addFunction('vemp', binaryen.v128, binaryen.v128, [], mod.if(
			local_vects[0].isSpecial(),
			mod.call('vnot', [local_vects[0].vect], binaryen.v128),
			mod.if(
				local_vects[0].isInt,
				BinVect.asBool(mod, mod.i64.eqz(local_vects[0].intValue)),
				mod.if(
					local_vects[0].isNat,
					BinVect.asBool(mod, mod.i64.eqz(local_vects[0].natValue)),
					mod.if(
						local_vects[0].isFloat,
						BinVect.asBool(mod, mod.f64.eq(local_vects[0].floatValue, mod.f64.const(0.0))), // also takes care of -0.0
						BinVect.asBool(mod, mod.i32.and(local_vects[0].isAddr, mod.i64.eqz(local_vects[0].addrValue))),
					),
				),
			),
		));
		mod.addFunction('vneg', binaryen.v128, binaryen.v128, [], mod.if(
			local_vects[0].isInt,
			// `-n` in two’s complement is `(n xor -1) + 1`
			new BinVect(mod, mod.i64.add(mod.i64.xor(local_vects[0].intValue, bigint_to_i64(mod, -1n)), bigint_to_i64(mod, 1n))).vect,
			mod.if(
				local_vects[0].isFloat,
				new BinVect(mod, mod.f64.neg(local_vects[0].floatValue)).vect,
				mod.unreachable(),
			),
		));
		mod.addFunction('vtoi', binaryen.v128, binaryen.v128, [], mod.if(
			local_vects[0].isInt,
			local_vects[0].vect,
			mod.if(
				local_vects[0].isNat,
				new BinVect(mod, local_vects[0].n_to_i(), {unsigned: false}).vect,
				mod.if(
					local_vects[0].isFloat,
					new BinVect(mod, local_vects[0].f_to_i()).vect,
					mod.unreachable(),
				),
			),
		));
		mod.addFunction('vton', binaryen.v128, binaryen.v128, [], mod.if(
			local_vects[0].isInt,
			new BinVect(mod, local_vects[0].i_to_n(), {unsigned: true}).vect,
			mod.if(
				local_vects[0].isNat,
				local_vects[0].vect,
				mod.if(
					local_vects[0].isFloat,
					new BinVect(mod, local_vects[0].f_to_n()).vect,
					mod.unreachable(),
				),
			),
		));
		mod.addFunction('vtof', binaryen.v128, binaryen.v128, [], mod.if(
			local_vects[0].isInt,
			new BinVect(mod, local_vects[0].i_to_f()).vect,
			mod.if(
				local_vects[0].isNat,
				new BinVect(mod, local_vects[0].n_to_f()).vect,
				mod.if(
					local_vects[0].isFloat,
					local_vects[0].vect,
					mod.unreachable(),
				),
			),
		));

		this.#binOpArithmetic('viexp',   (num0, num1) => mod.call('iexp', [num0, num1], binaryen.i64), 'intValue');
		this.#binOpArithmetic('vimul',   mod.i64.mul  .bind(null), 'intValue');
		this.#binOpArithmetic('vfmul',   mod.f64.mul  .bind(null), 'floatValue');
		this.#binOpArithmetic('vidiv_s', mod.i64.div_s.bind(null), 'intValue');
		this.#binOpArithmetic('vidiv_u', mod.i64.div_u.bind(null), 'natValue');
		this.#binOpArithmetic('vfdiv',   mod.f64.div  .bind(null), 'floatValue');
		this.#binOpArithmetic('viadd',   mod.i64.add  .bind(null), 'intValue');
		this.#binOpArithmetic('vfadd',   mod.f64.add  .bind(null), 'floatValue');
		this.#binOpArithmetic('visub_s', mod.i64.sub  .bind(null), 'intValue');
		this.#binOpArithmetic('visub_u', (num0, num1) => mod.call('isub_u', [num0, num1], binaryen.i64), 'natValue');
		this.#binOpArithmetic('vfsub',   mod.f64.sub  .bind(null), 'floatValue');

		this.#binOpComparative('vlt', mod.i64.lt_s.bind(null), mod.i64.lt_u.bind(null), mod.f64.lt.bind(null));
		this.#binOpComparative('vgt', mod.i64.gt_s.bind(null), mod.i64.gt_u.bind(null), mod.f64.gt.bind(null));
		this.#binOpComparative('vle', mod.i64.le_s.bind(null), mod.i64.le_u.bind(null), mod.f64.le.bind(null));
		this.#binOpComparative('vge', mod.i64.ge_s.bind(null), mod.i64.ge_u.bind(null), mod.f64.ge.bind(null));

		mod.addFunction('vid', binaryen.createType([binaryen.v128, binaryen.v128]), binaryen.v128, [], mod.if(
			mod.i32.and(local_vects[0].isSpecial(), local_vects[1].isSpecial()),
			BinVect.asBool(mod, mod.i32.eq(local_vects[0].specialValue, local_vects[1].specialValue)),
			mod.if(
				mod.i32.and(local_vects[0].isInt, local_vects[1].isInt),
				BinVect.asBool(mod, mod.i64.eq(local_vects[0].intValue, local_vects[1].intValue)), // `i64.eq` for ints gives the same result as `ID` operator
				mod.if(
					mod.i32.and(local_vects[0].isNat, local_vects[1].isNat),
					BinVect.asBool(mod, mod.i64.eq(local_vects[0].natValue, local_vects[1].natValue)),
					mod.if(
						mod.i32.and(local_vects[0].isFloat, local_vects[1].isFloat),
						BinVect.asBool(mod, mod.call('fid', [local_vects[0].floatValue, local_vects[1].floatValue], binaryen.i32)),
						new BinVect(mod, false).vect,
					),
				),
			),
		));

		this.#binOpComparative('veq', mod.i64.eq.bind(null), mod.i64.eq.bind(null), mod.f64.eq.bind(null));
	}

	#setupFunctions2(): void {
		const mod:      BinaryenModuleUpdates = this.module;
		const rt_value: binaryen.Type         = this.getReftype('(ref $Value)')!;
		const local_vals = [
			new BinValue(this, mod.local.get(0, rt_value)),
			new BinValue(this, mod.local.get(1, rt_value)),
		] as const;
		const local_vects = local_vals.map((binval) => new BinVect(mod, binval.primitiveValue));

		mod.addFunction('isnull_', rt_value, rt_value, [], new BinValue(this, BinVect.asBool(mod, mod.i32.and(
			local_vals[0].isPrimitive,
			local_vects[0].isSpecial(null),
		))).value);
		mod.addFunction('vnot_', rt_value, rt_value, [], new BinValue(this, BinVect.asBool(mod, mod.i32.and(
			local_vals[0].isPrimitive,
			mod.i32.or(local_vects[0].isSpecial(null), local_vects[0].isSpecial(false)),
		))).value);
		mod.addFunction('vemp_', rt_value, rt_value, [], mod.if(
			local_vals[0].isPrimitive,
			mod.if(
				local_vects[0].isSpecial(),
				mod.call('vnot_', [local_vals[0].value], rt_value),
				new BinValue(this, mod.if(
					local_vects[0].isInt,
					BinVect.asBool(mod, mod.i64.eqz(local_vects[0].intValue)),
					mod.if(
						local_vects[0].isNat,
						BinVect.asBool(mod, mod.i64.eqz(local_vects[0].natValue)),
						mod.if(
							local_vects[0].isFloat,
							BinVect.asBool(mod, mod.f64.eq(local_vects[0].floatValue, mod.f64.const(0.0))), // also takes care of -0.0
							BinVect.asBool(mod, mod.i32.and(local_vects[0].isAddr, mod.i64.eqz(local_vects[0].addrValue))),
						),
					),
				)).value,
			),
			mod.unreachable(), // TODO: EMP operator on composites
		));
		mod.addFunction('vneg_', rt_value, rt_value, [], new BinValue(this, mod.if( // assume operand is primitive
			local_vects[0].isInt,
			// `-n` in two’s complement is `(n xor -1) + 1`
			new BinVect(mod, mod.i64.add(mod.i64.xor(local_vects[0].intValue, bigint_to_i64(mod, -1n)), bigint_to_i64(mod, 1n))).vect,
			mod.if(
				local_vects[0].isFloat,
				new BinVect(mod, mod.f64.neg(local_vects[0].floatValue)).vect,
				mod.unreachable(), // cannot call NEG on other primitives
			),
		)).value);
		mod.addFunction('vtoi_', rt_value, rt_value, [], mod.if( // assume operand is primitive
			local_vects[0].isInt,
			new BinValue(this, local_vects[0].vect).value,
			mod.if(
				local_vects[0].isNat,
				new BinValue(this, new BinVect(mod, local_vects[0].n_to_i(), {unsigned: false}).vect).value,
				mod.if(
					local_vects[0].isFloat,
					new BinValue(this, new BinVect(mod, local_vects[0].f_to_i()).vect).value,
					mod.unreachable(),
				),
			),
		));
		mod.addFunction('vton_', rt_value, rt_value, [], mod.if( // assume operand is primitive
			local_vects[0].isInt,
			new BinValue(this, new BinVect(mod, local_vects[0].i_to_n(), {unsigned: true}).vect).value,
			mod.if(
				local_vects[0].isNat,
				new BinValue(this, local_vects[0].vect).value,
				mod.if(
					local_vects[0].isFloat,
					new BinValue(this, new BinVect(mod, local_vects[0].f_to_n()).vect).value,
					mod.unreachable(),
				),
			),
		));
		mod.addFunction('vtof_', rt_value, rt_value, [], mod.if( // assume operand is primitive
			local_vects[0].isInt,
			new BinValue(this, new BinVect(mod, local_vects[0].i_to_f()).vect).value,
			mod.if(
				local_vects[0].isNat,
				new BinValue(this, new BinVect(mod, local_vects[0].n_to_f()).vect).value,
				mod.if(
					local_vects[0].isFloat,
					new BinValue(this, local_vects[0].vect).value,
					mod.unreachable(),
				),
			),
		));

		this.#setupBinopArithmetic('viadd_',   mod.i64.add  .bind(null), 'intValue');
		this.#setupBinopArithmetic('vfadd_',   mod.f64.add  .bind(null), 'floatValue');
		this.#setupBinopArithmetic('visub_s_', mod.i64.sub  .bind(null), 'intValue');
		this.#setupBinopArithmetic('visub_u_', (num0, num1) => mod.call('isub_u', [num0, num1], binaryen.i64), 'natValue');
		this.#setupBinopArithmetic('vfsub_',   mod.f64.sub  .bind(null), 'floatValue');
		this.#setupBinopArithmetic('vimul_',   mod.i64.mul  .bind(null), 'intValue');
		this.#setupBinopArithmetic('vfmul_',   mod.f64.mul  .bind(null), 'floatValue');
		this.#setupBinopArithmetic('vidiv_s_', mod.i64.div_s.bind(null), 'intValue');
		this.#setupBinopArithmetic('vidiv_u_', mod.i64.div_u.bind(null), 'natValue');
		this.#setupBinopArithmetic('vfdiv_',   mod.f64.div  .bind(null), 'floatValue');
		this.#setupBinopArithmetic('viexp_',   (num0, num1) => mod.call('iexp', [num0, num1], binaryen.i64), 'intValue');

		this.#setupBinopComparative('vlt_', mod.i64.lt_s.bind(null), mod.i64.lt_u.bind(null), mod.f64.lt.bind(null));
		this.#setupBinopComparative('vgt_', mod.i64.gt_s.bind(null), mod.i64.gt_u.bind(null), mod.f64.gt.bind(null));
		this.#setupBinopComparative('vle_', mod.i64.le_s.bind(null), mod.i64.le_u.bind(null), mod.f64.le.bind(null));
		this.#setupBinopComparative('vge_', mod.i64.ge_s.bind(null), mod.i64.ge_u.bind(null), mod.f64.ge.bind(null));
		this.#setupBinopComparative('veqn', mod.i64.eq  .bind(null), mod.i64.eq  .bind(null), mod.f64.eq.bind(null));

		this.module.addFunction('vid_', binaryen.createType([rt_value, rt_value]), rt_value, [], new BinValue(this, mod.if(
			mod.i32.and(local_vals[0].isPrimitive, local_vals[1].isPrimitive),
			mod.if(
				mod.i32.and(local_vects[0].isSpecial(), local_vects[1].isSpecial()),
				BinVect.asBool(mod, mod.i32.eq(local_vects[0].specialValue, local_vects[1].specialValue)),
				mod.if(
					mod.i32.and(local_vects[0].isInt, local_vects[1].isInt),
					BinVect.asBool(mod, mod.i64.eq(local_vects[0].intValue, local_vects[1].intValue)), // `i64.eq` for ints gives the same result as `ID` operator
					mod.if(
						mod.i32.and(local_vects[0].isFloat, local_vects[1].isFloat),
						BinVect.asBool(mod, mod.call('fid', [local_vects[0].floatValue, local_vects[1].floatValue], binaryen.i32)),
						new BinVect(mod, false).vect,
					),
				),
			),
			BinVect.asBool(mod, mod.ref.eq(local_vals[0].compositeValue, local_vals[1].compositeValue)), // TODO: handle identity of tuples/records
		)).value);

		this.module.addFunction('veq_', binaryen.createType([rt_value, rt_value]), rt_value, [], mod.if(
			mod.i32.and(local_vals[0].isPrimitive, local_vals[1].isPrimitive),
			mod.if(
				mod.i32.or(local_vects[0].isSpecial(), local_vects[1].isSpecial()),
				mod.call('vid_', [local_vals[0].value, local_vals[1].value], rt_value),
				mod.call('veqn', [local_vals[0].value, local_vals[1].value], rt_value),
			),
			mod.call('vid_', [local_vals[0].value, local_vals[1].value], rt_value), // TODO: handle equality of all composites
		));
	}

	/**
	 * Prepare this builder’s module, with optional additional actions/modifications.
	 * @param main a callback to run after setup but before validation
	 */
	public setupModule(main?: (mod: binaryen.Module) => void): void {
		this.module.setFeatures(( // NOTE: features are bit tags; to add them we must use bit-wise disjunction
			/* eslint-disable @stylistic/operator-linebreak */
			binaryen.Features.NontrappingFPToInt |
			binaryen.Features.SIMD128 |
			binaryen.Features.ReferenceTypes |
			binaryen.Features.Multivalue |
			binaryen.Features.GC
			/* eslint-enable @stylistic/operator-linebreak */
		));
		this.#setupFunctions();
		this.#setupFunctions2();
		main?.call(null, this.module);
		if (!this.module.validate()) {
			throw new Error('Invalid WebAssembly module.');
		}
	}
}

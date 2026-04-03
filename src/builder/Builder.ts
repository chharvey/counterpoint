import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import binaryen from 'binaryen';
import type {SymbolSchemaVar} from '../validator/index.ts';
import type {Temp} from '../optimizer/index.ts';
import {
	STRUCT_FIELD,
	Global,
	BinValue,
} from '../code-generator/index.ts';
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
	| '$Case'
	| '$Tuple'
	| '$Record'
	| '$ListInternal'
	| '$DictInternal'
	| '$MapInternal'
	| '$Object'
	| '$List'
	| '$Dict'
	| '$Map'
);
type ReftypeKey = `(ref ${ HeaptypeKey | `null ${ '$Value' | '$Property' | '$Case' }` })`;

export enum BinConst {
	NULL,
	FALSE,
	TRUE,
}



/** stub for v0.5 */
export function bigint_to_i64(mod: binaryen.Module, value: bigint, u: boolean = false): binaryen.ExpressionRef {
	u;
	return mod.i64.const(Number(value), 0);
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

	private static readonly IMPORTS: readonly string[] = [
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/types.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/stubs.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/builder/exp.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/builder/fid.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/mod.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/capacity-needed.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/tombstones.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/hash.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/Tuple.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/Record.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/List.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/Dict.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/Map.wat'), 'utf8'),
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
			packedType: binaryen[packedType],
			mutable,
		};
	}


	/** A lookup table for heap types created by a Binaryen TypeBuilder. */
	readonly #heaptypeRegistry = new Map<HeaptypeKey, binaryen.Type>();

	/** A registry of reference (and reference-null) types. */
	readonly #reftypeRegistry = new Map<ReftypeKey, binaryen.Type>();

	/** A registry of constant WASM expressions. */
	readonly #constRegistry: ReadonlyMap<BinConst, binaryen.ExpressionRef>;

	/** A set containing data of WASM local variables. */
	readonly #locals = new Set<Local>();

	/** A map containing data of WASM local variables, indexed by their name. */
	readonly #globals = new Map<string, Global>();

	/** The Binaryen module to build upon building. */
	public readonly module: BinaryenModuleUpdates = binaryen.parseText(`
		(module
			${ Builder.IMPORTS.join('') }
		)
	`) as BinaryenModuleUpdates;

	public constructor() {
		this.module.setFeatures(( // NOTE: features are bit tags; to add them we must use bit-wise disjunction
			/* eslint-disable @stylistic/operator-linebreak */
			binaryen.Features.SIMD128 |
			binaryen.Features.ReferenceTypes |
			binaryen.Features.Multivalue |
			binaryen.Features.GC
			/* eslint-enable @stylistic/operator-linebreak */
		));

		this.#setupTypes();
		this.#setupGlobals();
		this.#setupFunctions();

		this.#constRegistry = new Map([
			[BinConst.NULL,  new BinValue(this, new BinVect(this.module))       .value],
			[BinConst.FALSE, new BinValue(this, new BinVect(this.module, false)).value],
			[BinConst.TRUE,  new BinValue(this, new BinVect(this.module, true)) .value],
		]);
	}

	public getHeaptype(key: HeaptypeKey): binaryen.Type {
		assert.ok(this.#heaptypeRegistry.has(key), `Expected type registry to have type \`${ key }\`.`);
		return this.#heaptypeRegistry.get(key)!;
	}

	public getReftype(key: ReftypeKey): binaryen.Type {
		assert.ok(this.#reftypeRegistry.has(key), `Expected type registry to have type \`${ key }\`.`);
		return this.#reftypeRegistry.get(key)!;
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
	 * Get the local with the given id in this Builder’s list, if it’s been added; else, return `undefined`.
	 * @param  id the schema of the local to get
	 * @return    the local or `undefined`
	 */
	public getLocal(schema: SymbolSchemaVar | Temp): Local | undefined {
		return [...this.#locals].find((local) => local.schema === schema);
	}

	/**
	 * Set and then return a local variable.
	 * @param schema the symbol schema of the variable to set
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
	 * Return a new `$Tuple` from items.
	 * @param items items in the array; must be of type `(ref $Value)`
	 * @return      `(array.new_fixed $Tuple <...items>)`
	 */
	public codegenTuple(items: readonly binaryen.ExpressionRef[] = []): binaryen.ExpressionRef {
		return this.module.array.new_fixed(this.getHeaptype('$Tuple'), items);
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
		return this.module.array.new_fixed(this.getHeaptype('$Record'), entries as binaryen.ExpressionRef[]);
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
			(_, i) => items[i] ?? this.module.ref.null(this.getReftype('(ref null $Value)')),
		);
		return this.module.struct.new([
			this.#globals.get('obj-ctr')!.plusPlus(),
			this.module.i32.const(items.length),
			this.module.array.new_fixed(this.getHeaptype('$ListInternal'), entries),
		], this.getHeaptype('$List'));
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
				this.getHeaptype('$DictInternal'),
				entries.map((entry) => entry ?? this.module.ref.null(this.getReftype('(ref null $Property)'))),
			),
		], this.getHeaptype('$Dict'));
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
		const rt_map: binaryen.Type = this.getReftype('(ref $Map)');
		const map_obj = this.module.struct.new([
			this.#globals.get('obj-ctr')!.plusPlus(),
			this.module.i32.const(cases.size),
			this.module.array.new_default(this.getHeaptype('$MapInternal'), this.module.i32.const(capacity)),
		], this.getHeaptype('$Map'));
		if (!cases.size) {
			return map_obj;
		}
		const local: Local = this.newLocal(map_obj, rt_map);
		return this.module.block(null, [
			local.set(),
			...[...cases].map(([ant, con]) => this.module.call('Map.set', [local.get(), ant, con], binaryen.none)),
			local.get(),
		], rt_map);
	}

	/** @return `(struct.get $List $internal <list>)` */
	public getListInternal(list: binaryen.ExpressionRef): binaryen.ExpressionRef {
		return this.module.struct.get(STRUCT_FIELD.LIST_INTERNAL, list, this.getReftype('(ref $ListInternal)'));
	}

	/** @return `(struct.get $Dict $internal <dict>)` */
	public getDictInternal(dict: binaryen.ExpressionRef): binaryen.ExpressionRef {
		return this.module.struct.get(STRUCT_FIELD.DICT_INTERNAL, dict, this.getReftype('(ref $DictInternal)'));
	}

	/** @return `(struct.get $Map $internal <map>)` */
	public getMapInternal(map: binaryen.ExpressionRef): binaryen.ExpressionRef {
		return this.module.struct.get(STRUCT_FIELD.MAP_INTERNAL, map, this.getReftype('(ref $MapInternal)'));
	}

	/**
	 * Set up common types.
	 * We’ve defined these in a static `types.wat` file,
	 * but there’s currently no way to access them dynamically with Binaryen,
	 * so we repeat them here.
	 */
	#setupTypes(): void {
		// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
		const tb: TypeBuilder = new binaryen.TypeBuilder();

		let type_count: number = 0;

		/* (type $Value ...) */
		const i_value: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_value, [
			/* $tag */       Builder.newField(binaryen.i32, 'i8'),
			/* $primitive */ Builder.newField(binaryen.v128),
			/* $composite */ Builder.newField(binaryen.eqref),
		]);

		/* (type $Property ...) */
		const i_property: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_property, [
			/* $key */ Builder.newField(binaryen.i64),
			/* $val */ Builder.newField(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
		]);

		/* (type $Case ...) */
		const i_case: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_case, [
			/* $ant */ Builder.newField(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
			/* $con */ Builder.newField(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
		]);

		/* (type $Tuple ...) */
		const i_tuple: number = type_count++;
		tb.grow(1);
		tb.setArrayType(
			i_tuple,
			tb.getTempRefType(tb.getTempHeapType(i_value), false),
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
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
			binaryen.notPacked,
			true,
		);

		/* (type $MapInternal ...) */
		const i_map_internal: number = type_count++;
		tb.grow(1);
		tb.setArrayType(
			i_map_internal,
			tb.getTempRefType(tb.getTempHeapType(i_case), true),
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			binaryen.notPacked,
			true,
		);

		/* (type $Object ...) */
		const i_object: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_object, [
			/* $id */ Builder.newField(binaryen.i64),
		]);
		tb.setOpen(i_object);

		/* (type $List ...) */
		const i_list: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_list, [
			/* $id */       Builder.newField(binaryen.i64),
			/* $size */     Builder.newField(binaryen.i32, 'notPacked', true),
			/* $internal */ Builder.newField(tb.getTempRefType(tb.getTempHeapType(i_list_internal), false), 'notPacked', true),
		]);
		tb.setSubType(i_list, tb.getTempHeapType(i_object));
		tb.setOpen(i_list);

		/* (type $Dict ...) */
		const i_dict: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_dict, [
			/* $id */       Builder.newField(binaryen.i64),
			/* $size */     Builder.newField(binaryen.i32, 'notPacked', true),
			/* $internal */ Builder.newField(tb.getTempRefType(tb.getTempHeapType(i_dict_internal), false), 'notPacked', true),
		]);
		tb.setSubType(i_dict, tb.getTempHeapType(i_object));
		tb.setOpen(i_dict);

		/* (type $Map ...) */
		const i_map: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_map, [
			/* $id */       Builder.newField(binaryen.i64),
			/* $size */     Builder.newField(binaryen.i32, 'notPacked', true),
			/* $internal */ Builder.newField(tb.getTempRefType(tb.getTempHeapType(i_map_internal), false), 'notPacked', true),
		]);
		tb.setSubType(i_map, tb.getTempHeapType(i_object));
		tb.setOpen(i_map);

		const heaptypes: readonly binaryen.Type[] = tb.buildAndDispose();

		this.#heaptypeRegistry.set('$Value',        heaptypes[i_value]);
		this.#heaptypeRegistry.set('$Property',     heaptypes[i_property]);
		this.#heaptypeRegistry.set('$Case',         heaptypes[i_case]);
		this.#heaptypeRegistry.set('$Tuple',        heaptypes[i_tuple]);
		this.#heaptypeRegistry.set('$Record',       heaptypes[i_record]);
		this.#heaptypeRegistry.set('$ListInternal', heaptypes[i_list_internal]);
		this.#heaptypeRegistry.set('$DictInternal', heaptypes[i_dict_internal]);
		this.#heaptypeRegistry.set('$MapInternal',  heaptypes[i_map_internal]);
		this.#heaptypeRegistry.set('$Object',       heaptypes[i_object]);
		this.#heaptypeRegistry.set('$List',         heaptypes[i_list]);
		this.#heaptypeRegistry.set('$Dict',         heaptypes[i_dict]);
		this.#heaptypeRegistry.set('$Map',          heaptypes[i_map]);

		// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
		const {getTypeFromHeapType} = binaryen;

		this.#reftypeRegistry.set('(ref $Value)',        getTypeFromHeapType(heaptypes[i_value],         false));
		this.#reftypeRegistry.set('(ref $Property)',     getTypeFromHeapType(heaptypes[i_property],      false));
		this.#reftypeRegistry.set('(ref $Case)',         getTypeFromHeapType(heaptypes[i_case],          false));
		this.#reftypeRegistry.set('(ref $Tuple)',        getTypeFromHeapType(heaptypes[i_tuple],         false));
		this.#reftypeRegistry.set('(ref $Record)',       getTypeFromHeapType(heaptypes[i_record],        false));
		this.#reftypeRegistry.set('(ref $ListInternal)', getTypeFromHeapType(heaptypes[i_list_internal], false));
		this.#reftypeRegistry.set('(ref $DictInternal)', getTypeFromHeapType(heaptypes[i_dict_internal], false));
		this.#reftypeRegistry.set('(ref $MapInternal)',  getTypeFromHeapType(heaptypes[i_map_internal],  false));
		this.#reftypeRegistry.set('(ref $Object)',       getTypeFromHeapType(heaptypes[i_object],        false));
		this.#reftypeRegistry.set('(ref $List)',         getTypeFromHeapType(heaptypes[i_list],          false));
		this.#reftypeRegistry.set('(ref $Dict)',         getTypeFromHeapType(heaptypes[i_dict],          false));
		this.#reftypeRegistry.set('(ref $Map)',          getTypeFromHeapType(heaptypes[i_map],           false));

		this.#reftypeRegistry.set('(ref null $Value)',    getTypeFromHeapType(heaptypes[i_value],    true)); // only used as the fields of `$ListInternal`
		this.#reftypeRegistry.set('(ref null $Property)', getTypeFromHeapType(heaptypes[i_property], true)); // only used as the fields of `$DictInternal`
		this.#reftypeRegistry.set('(ref null $Case)',     getTypeFromHeapType(heaptypes[i_case],     true)); // only used as the fields of `$MapInternal`
	}

	/** assumes both operands are primitive */
	#setupBinopPrimitive(
		name:        string,
		method_ints: (int0: binaryen.ExpressionRef,   int1: binaryen.ExpressionRef)   => binaryen.ExpressionRef,
		method_flts: (float0: binaryen.ExpressionRef, float1: binaryen.ExpressionRef) => binaryen.ExpressionRef,
		comparative: boolean = false, // if true, expects method calls to return `i32`; otherwise, expects any argument to BinVect
	): binaryen.FunctionRef {
		const mod:      BinaryenModuleUpdates = this.module;
		const rt_value: binaryen.Type         = this.getReftype('(ref $Value)');
		const local_vals = [
			new BinValue(this, mod.local.get(0, rt_value)),
			new BinValue(this, mod.local.get(1, rt_value)),
		] as const;
		const local_vects = local_vals.map((binval) => new BinVect(mod, binval.primitiveValue));

		let int_int: binaryen.ExpressionRef = method_ints.call(null,                       local_vects[0].intValue,                         local_vects[1].intValue);
		let int_flt: binaryen.ExpressionRef = method_flts.call(null, mod.f64.convert_u.i32(local_vects[0].intValue),                        local_vects[1].floatValue);
		let flt_int: binaryen.ExpressionRef = method_flts.call(null,                       local_vects[0].floatValue, mod.f64.convert_u.i32(local_vects[1].intValue));
		let flt_flt: binaryen.ExpressionRef = method_flts.call(null,                       local_vects[0].floatValue,                       local_vects[1].floatValue);
		if (comparative) {
			int_int = BinVect.asBool(mod, int_int);
			int_flt = BinVect.asBool(mod, int_flt);
			flt_int = BinVect.asBool(mod, flt_int);
			flt_flt = BinVect.asBool(mod, flt_flt);
		} else {
			int_int = new BinVect(mod, int_int).vect;
			int_flt = new BinVect(mod, int_flt).vect;
			flt_int = new BinVect(mod, flt_int).vect;
			flt_flt = new BinVect(mod, flt_flt).vect;
		}
		int_int = new BinValue(this, int_int).value;
		int_flt = new BinValue(this, int_flt).value;
		flt_int = new BinValue(this, flt_int).value;
		flt_flt = new BinValue(this, flt_flt).value;

		return mod.addFunction(name, binaryen.createType([rt_value, rt_value]), rt_value, [], mod.if(
			local_vects[0].isInt,
			mod.if(
				local_vects[1].isInt,
				int_int,
				mod.if(
					local_vects[1].isFloat,
					int_flt,
					mod.unreachable(),
				),
			),
			mod.if(
				local_vects[0].isFloat,
				mod.if(
					local_vects[1].isInt,
					flt_int,
					mod.if(
						local_vects[1].isFloat,
						flt_flt,
						mod.unreachable(),
					),
				),
				mod.unreachable(),
			),
		));
	};

	#setupGlobals(): void {
		const global = new Global(this.module, 'obj-ctr', bigint_to_i64(this.module, 0n, true), binaryen.i64, true);
		this.#globals.set(global.name, global);
		global.init();
	}

	#setupFunctions(): void {
		const mod:       BinaryenModuleUpdates = this.module;
		const rt_value:  binaryen.Type         = this.getReftype('(ref $Value)');
		const rt_tuple:  binaryen.Type         = this.getReftype('(ref $Tuple)');
		const rt_record: binaryen.Type         = this.getReftype('(ref $Record)');
		const rt_list:   binaryen.Type         = this.getReftype('(ref $List)');
		const rt_dict:   binaryen.Type         = this.getReftype('(ref $Dict)');
		const rt_map:    binaryen.Type         = this.getReftype('(ref $Map)');
		const local_vals = [
			new BinValue(this, mod.local.get(0, rt_value)),
			new BinValue(this, mod.local.get(1, rt_value)),
		] as const;
		const local_vects = local_vals.map((binval) => new BinVect(mod, binval.primitiveValue));

		/* Unary Operators */
		mod.addFunction('isnull', rt_value, rt_value, [], new BinValue(this, BinVect.asBool(mod, mod.i32.and(
			local_vals[0].isPrimitive,
			local_vects[0].isSpecial(null),
		))).value);
		mod.addFunction('vnot', rt_value, rt_value, [], new BinValue(this, BinVect.asBool(mod, mod.i32.and(
			local_vals[0].isPrimitive,
			mod.i32.or(local_vects[0].isSpecial(null), local_vects[0].isSpecial(false)),
		))).value);
		mod.addFunction('vemp', rt_value, rt_value, [], mod.if(
			local_vals[0].isPrimitive,
			mod.if(
				local_vects[0].isSpecial(),
				mod.call('vnot', [local_vals[0].value], rt_value),
				/* eslint-disable @stylistic/indent */
				new BinValue(this, mod.if(
					local_vects[0].isInt,
					BinVect.asBool(mod, mod.i32.eqz(local_vects[0].intValue)), // TODO: v0.5: use i64.eqz
					// mod.if(
					// 	local_vects[0].isNat,
					// 	BinVect.asBool(mod, mod.i64.eqz(local_vects[0].natValue)),
						mod.if(
							local_vects[0].isFloat,
							BinVect.asBool(mod, mod.f64.eq(local_vects[0].floatValue, mod.f64.const(0.0))), // also takes care of -0.0
							BinVect.asBool(mod, mod.i32.and(local_vects[0].isAddr, mod.i32.eqz(local_vects[0].addrValue))), // TODO: v0.5: use i64.eqz
						),
					// ),
				)).value,
				/* eslint-enable @stylistic/indent */
			),
			mod.unreachable(), // TODO: EMP operator on composites
		));
		mod.addFunction('vneg', rt_value, rt_value, [], new BinValue(this, mod.if( // assume operand is primitive
			local_vects[0].isInt,
			// `-n` in two’s complement is `(n xor -1) + 1`
			new BinVect(mod, mod.i32.add(mod.i32.xor(local_vects[0].intValue, mod.i32.const(-1)), mod.i32.const(1))).vect,
			mod.if(
				local_vects[0].isFloat,
				new BinVect(mod, mod.f64.neg(local_vects[0].floatValue)).vect,
				mod.unreachable(), // cannot call NEG on other primitives
			),
		)).value);

		/* Binary Operators */
		mod.addFunction('vexp', binaryen.createType([rt_value, rt_value]), rt_value, [], mod.if( // TODO: v0.5: will be fixed in 'viexp'
			mod.i32.and(local_vects[0].isInt, local_vects[1].isInt),
			new BinValue(this, new BinVect(mod, mod.call('exp', [local_vects[0].intValue, local_vects[1].intValue], binaryen.i32))).value,
			mod.unreachable(),
		));

		this.#setupBinopPrimitive('vmul', mod.i32.mul  .bind(null), mod.f64.mul.bind(null));
		this.#setupBinopPrimitive('vdiv', mod.i32.div_s.bind(null), mod.f64.div.bind(null));
		this.#setupBinopPrimitive('vadd', mod.i32.add  .bind(null), mod.f64.add.bind(null));
		this.#setupBinopPrimitive('vlt',  mod.i32.lt_s .bind(null), mod.f64.lt .bind(null), true);
		this.#setupBinopPrimitive('vgt',  mod.i32.gt_s .bind(null), mod.f64.gt .bind(null), true);
		this.#setupBinopPrimitive('vle',  mod.i32.le_s .bind(null), mod.f64.le .bind(null), true);
		this.#setupBinopPrimitive('vge',  mod.i32.ge_s .bind(null), mod.f64.ge .bind(null), true);
		this.#setupBinopPrimitive('veqn', mod.i32.eq   .bind(null), mod.f64.eq .bind(null), true);

		mod.removeFunction('vid'); // removes stub defined in `stubs.wat`
		this.module.addFunction('vid', binaryen.createType([rt_value, rt_value]), rt_value, [], new BinValue(this, mod.if(
			mod.i32.and(local_vals[0].isPrimitive, local_vals[1].isPrimitive),
			mod.if(
				mod.i32.and(local_vects[0].isSpecial(), local_vects[1].isSpecial()),
				BinVect.asBool(mod, mod.i32.eq(
					mod.i16x8.extract_lane_s(local_vects[0].vect, 3), // TODO: v0.5: `.specialValue`/`.asSpecial`
					mod.i16x8.extract_lane_s(local_vects[1].vect, 3), // TODO: v0.5: `.specialValue`/`.asSpecial`
				)),
				mod.if(
					mod.i32.and(local_vects[0].isInt, local_vects[1].isInt),
					BinVect.asBool(mod, mod.i32.eq(local_vects[0].intValue, local_vects[1].intValue)), // `i32.eq` for ints gives the same result as `ID` operator
					mod.if(
						mod.i32.and(local_vects[0].isFloat, local_vects[1].isFloat),
						BinVect.asBool(mod, mod.call('fid', [local_vects[0].floatValue, local_vects[1].floatValue], binaryen.i32)),
						new BinVect(mod, false).vect,
					),
				),
			),
			mod.if(
				mod.i32.and(
					mod.ref.test(local_vals[0].compositeValue, rt_tuple),
					mod.ref.test(local_vals[1].compositeValue, rt_tuple),
				),
				BinVect.asBool(mod, mod.call('Tuple.identical', [
					mod.ref.cast(local_vals[0].compositeValue, rt_tuple),
					mod.ref.cast(local_vals[1].compositeValue, rt_tuple),
				], binaryen.i32)),
				mod.if(
					mod.i32.and(
						mod.ref.test(local_vals[0].compositeValue, rt_record),
						mod.ref.test(local_vals[1].compositeValue, rt_record),
					),
					BinVect.asBool(mod, mod.call('Record.identical', [
						mod.ref.cast(local_vals[0].compositeValue, rt_record),
						mod.ref.cast(local_vals[1].compositeValue, rt_record),
					], binaryen.i32)),
					BinVect.asBool(mod, mod.ref.eq(local_vals[0].compositeValue, local_vals[1].compositeValue)),
				),
			),
		)).value);

		mod.removeFunction('veq'); // removes stub defined in `stubs.wat`
		this.module.addFunction('veq', binaryen.createType([rt_value, rt_value]), rt_value, [], mod.if(
			mod.i32.and(local_vals[0].isPrimitive, local_vals[1].isPrimitive),
			mod.if(
				mod.i32.or(local_vects[0].isSpecial(), local_vects[1].isSpecial()),
				mod.call('vid',  [local_vals[0].value, local_vals[1].value], rt_value),
				mod.call('veqn', [local_vals[0].value, local_vals[1].value], rt_value),
			),
			mod.if(
				mod.i32.and(
					mod.ref.test(local_vals[0].compositeValue, rt_tuple),
					mod.ref.test(local_vals[1].compositeValue, rt_tuple),
				),
				new BinValue(this, BinVect.asBool(mod, mod.call('Tuple.equal', [
					mod.ref.cast(local_vals[0].compositeValue, rt_tuple),
					mod.ref.cast(local_vals[1].compositeValue, rt_tuple),
				], binaryen.i32))).value,
				mod.if(
					mod.i32.and(
						mod.ref.test(local_vals[0].compositeValue, rt_record),
						mod.ref.test(local_vals[1].compositeValue, rt_record),
					),
					new BinValue(this, BinVect.asBool(mod, mod.call('Record.equal', [
						mod.ref.cast(local_vals[0].compositeValue, rt_record),
						mod.ref.cast(local_vals[1].compositeValue, rt_record),
					], binaryen.i32))).value,
					mod.if(
						mod.i32.and(
							mod.ref.test(local_vals[0].compositeValue, rt_list),
							mod.ref.test(local_vals[1].compositeValue, rt_list),
						),
						new BinValue(this, BinVect.asBool(mod, mod.call('List.equal', [
							mod.ref.cast(local_vals[0].compositeValue, rt_list),
							mod.ref.cast(local_vals[1].compositeValue, rt_list),
						], binaryen.i32))).value,
						mod.if(
							mod.i32.and(
								mod.ref.test(local_vals[0].compositeValue, rt_dict),
								mod.ref.test(local_vals[1].compositeValue, rt_dict),
							),
							new BinValue(this, BinVect.asBool(mod, mod.call('Dict.equal', [
								mod.ref.cast(local_vals[0].compositeValue, rt_dict),
								mod.ref.cast(local_vals[1].compositeValue, rt_dict),
							], binaryen.i32))).value,
							mod.if(
								mod.i32.and(
									mod.ref.test(local_vals[0].compositeValue, rt_map),
									mod.ref.test(local_vals[1].compositeValue, rt_map),
								),
								new BinValue(this, BinVect.asBool(mod, mod.call('Map.equal', [
									mod.ref.cast(local_vals[0].compositeValue, rt_map),
									mod.ref.cast(local_vals[1].compositeValue, rt_map),
								], binaryen.i32))).value,
								mod.call('vid', [local_vals[0].value, local_vals[1].value], rt_value),
							),
						),
					),
				),
			),
		));


		/* Utilities */
		mod.removeFunction('bool-to-i32'); // removes stub defined in `stubs.wat`
		mod.addFunction('bool-to-i32', rt_value, binaryen.i32, [], new BinVect(mod, local_vals[0].primitiveValue).isSpecial(true));
	}

	/**
	 * Prepare the main function in this binaryen Module, then performs validation.
	 * The main function should contain generated code for a program.
	 * @param main a callback to run before validation
	 */
	public setupMain(main?: (mod: binaryen.Module) => void): void {
		main?.call(null, this.module);
		if (!this.module.validate()) {
			throw new Error('Invalid WebAssembly module.');
		}
	}
}

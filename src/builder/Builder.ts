import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import binaryen from 'binaryen';
import type {SymbolSchemaVar} from '../validator/index.ts';
import type {Temp} from '../optimizer/index.ts';
import {
	Global,
	BinValue,
} from '../code-generator/index.ts';
import {bigint_to_i64} from './utils-public.ts';
import {Local} from './Local.ts';
import {BinVect} from './BinVect.ts';
import type {
	BinaryenModuleUpdates,
	Field,
	TypeBuilder,
} from './-types.d.ts';



type TypeKey = (
	| 'Value'
	| 'Property'
	| 'Case'
	| 'String'
	| 'Tuple'
	| 'Record'
	| 'ListInternal'
	| 'DictInternal'
	| 'MapInternal'
	| 'Object'
	| 'List'
	| 'Dict'
	| 'Map'
);

type HeaptypeRegistry = Record<TypeKey, binaryen.Type>;
type ReftypeRegistry  = Record<TypeKey, binaryen.Type>;

type ReftypeNullRegistry = Record<TypeKey & ('Value' | 'Property' | 'Case'), binaryen.Type>;

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



/** Struct field constant indices. */
const STRUCT = {
	VALUE: {
		/** `$Value.$tag` */
		TAG:       0,
		/** `$Value.$primitive` */
		PRIMITIVE: 1,
		/** `$Value.$composite` */
		COMPOSITE: 2,
	},
	PROPERTY: {
		/** `$Property.$key` */
		KEY: 0,
		/** `$Property.$val` */
		VAL: 1,
	},
	CASE: {
		/** `$Case.$ant` */
		ANT: 0,
		/** `$Case.$con` */
		CON: 1,
	},
	OBJECT: {
		/** `$Object.$id` */
		ID: 0,
	},
	LIST: {
		/** `$List.$size` */
		SIZE:     1,
		/** `$List.$internal` */
		INTERNAL: 2,
	},
	DICT: {
		/** `$Dict.$size` */
		SIZE:     1,
		/** `$Dict.$internal` */
		INTERNAL: 2,
	},
	MAP: {
		/** `$Map.$size` */
		SIZE:     1,
		/** `$Map.$internal` */
		INTERNAL: 2,
	},
} as const;



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
		fs.readFileSync(path.join(import.meta.dirname, '../../src/builder/iexp.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/builder/isub_u.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/builder/fid.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/cemp.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/mod.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/capacity-needed.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/tombstones.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/hash.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/stringify.wat'), 'utf8'),
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
	readonly #heaptypeRegistry: Partial<HeaptypeRegistry> = {};

	/** A registry of reference types. */
	readonly #reftypeRegistry: Partial<ReftypeRegistry> = {};

	/** A registry of reference-null types. */
	readonly #reftypeNullRegistry: Partial<ReftypeNullRegistry> = {};

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

	/** Utilities for getting fields of WASM structs. */
	public readonly structGet = {
		value: {
			/** @return `(struct.get $Value $tag       <ref>)` */
			tag:       (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.module.struct.get(STRUCT.VALUE.TAG,       ref, binaryen.i32, false),
			/** @return `(struct.get $Value $primitive <ref>)` */
			primitive: (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.module.struct.get(STRUCT.VALUE.PRIMITIVE, ref, binaryen.v128),
			/** @return `(struct.get $Value $primitive <ref>)` */
			composite: (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.module.struct.get(STRUCT.VALUE.COMPOSITE, ref, binaryen.eqref),
		},
		property: {
			/** @return `(struct.get $Property $key <ref>)` */
			key: (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.module.struct.get(STRUCT.PROPERTY.KEY, ref, binaryen.i64),
			/** @return `(struct.get $Property $val <ref>)` */
			val: (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.module.struct.get(STRUCT.PROPERTY.VAL, ref, this.reftype.Value),
		},
		case: {
			/** @return `(struct.get $Case $ant <ref>)` */
			ant: (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.module.struct.get(STRUCT.CASE.ANT, ref, this.reftype.Value),
			/** @return `(struct.get $Case $con <ref>)` */
			con: (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.module.struct.get(STRUCT.CASE.CON, ref, this.reftype.Value),
		},
		object: {
			/** @return `(struct.get $Object $id <ref>)` */
			id: (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.module.struct.get(STRUCT.OBJECT.ID, ref, binaryen.i64),
		},
		list: {
			/** @return `(struct.get $List $size     <ref>)` */
			size:     (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.module.struct.get(STRUCT.LIST.SIZE,     ref, binaryen.i32),
			/** @return `(struct.get $List $internal <ref>)` */
			internal: (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.module.struct.get(STRUCT.LIST.INTERNAL, ref, this.reftype.ListInternal),
		},
		dict: {
			/** @return `(struct.get $Dict $size     <ref>)` */
			size:     (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.module.struct.get(STRUCT.DICT.SIZE,     ref, binaryen.i32),
			/** @return `(struct.get $Dict $internal <ref>)` */
			internal: (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.module.struct.get(STRUCT.DICT.INTERNAL, ref, this.reftype.DictInternal),
		},
		map: {
			/** @return `(struct.get $Map $size     <ref>)` */
			size:     (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.module.struct.get(STRUCT.MAP.SIZE,     ref, binaryen.i32),
			/** @return `(struct.get $Map $internal <ref>)` */
			internal: (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.module.struct.get(STRUCT.MAP.INTERNAL, ref, this.reftype.MapInternal),
		},
	} as const;


	public constructor() {
		this.module.setFeatures(( // NOTE: features are bit tags; to add them we must use bit-wise disjunction
			/* eslint-disable @stylistic/operator-linebreak */
			binaryen.Features.NontrappingFPToInt |
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

	public get heaptype():    Readonly<HeaptypeRegistry>    { return this.#heaptypeRegistry    as HeaptypeRegistry; }
	public get reftype():     Readonly<ReftypeRegistry>     { return this.#reftypeRegistry     as ReftypeRegistry; }
	public get reftypeNull(): Readonly<ReftypeNullRegistry> { return this.#reftypeNullRegistry as ReftypeNullRegistry; }

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

		/* (type $String ...) */
		const i_string: number = type_count++;
		tb.grow(1);
		tb.setArrayType(
			i_string,
			binaryen.i32,
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			binaryen.i8,
			true,
		);

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

		this.#heaptypeRegistry.Value        = heaptypes[i_value];
		this.#heaptypeRegistry.Property     = heaptypes[i_property];
		this.#heaptypeRegistry.Case         = heaptypes[i_case];
		this.#heaptypeRegistry.String       = heaptypes[i_string];
		this.#heaptypeRegistry.Tuple        = heaptypes[i_tuple];
		this.#heaptypeRegistry.Record       = heaptypes[i_record];
		this.#heaptypeRegistry.ListInternal = heaptypes[i_list_internal];
		this.#heaptypeRegistry.DictInternal = heaptypes[i_dict_internal];
		this.#heaptypeRegistry.MapInternal  = heaptypes[i_map_internal];
		this.#heaptypeRegistry.Object       = heaptypes[i_object];
		this.#heaptypeRegistry.List         = heaptypes[i_list];
		this.#heaptypeRegistry.Dict         = heaptypes[i_dict];
		this.#heaptypeRegistry.Map          = heaptypes[i_map];

		// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
		const {getTypeFromHeapType} = binaryen;

		this.#reftypeRegistry.Value        = getTypeFromHeapType(heaptypes[i_value],         false);
		this.#reftypeRegistry.Property     = getTypeFromHeapType(heaptypes[i_property],      false);
		this.#reftypeRegistry.Case         = getTypeFromHeapType(heaptypes[i_case],          false);
		this.#reftypeRegistry.String       = getTypeFromHeapType(heaptypes[i_string],        false);
		this.#reftypeRegistry.Tuple        = getTypeFromHeapType(heaptypes[i_tuple],         false);
		this.#reftypeRegistry.Record       = getTypeFromHeapType(heaptypes[i_record],        false);
		this.#reftypeRegistry.ListInternal = getTypeFromHeapType(heaptypes[i_list_internal], false);
		this.#reftypeRegistry.DictInternal = getTypeFromHeapType(heaptypes[i_dict_internal], false);
		this.#reftypeRegistry.MapInternal  = getTypeFromHeapType(heaptypes[i_map_internal],  false);
		this.#reftypeRegistry.Object       = getTypeFromHeapType(heaptypes[i_object],        false);
		this.#reftypeRegistry.List         = getTypeFromHeapType(heaptypes[i_list],          false);
		this.#reftypeRegistry.Dict         = getTypeFromHeapType(heaptypes[i_dict],          false);
		this.#reftypeRegistry.Map          = getTypeFromHeapType(heaptypes[i_map],           false);

		this.#reftypeNullRegistry.Value    = getTypeFromHeapType(heaptypes[i_value],    true); // only used as the fields of `$ListInternal`
		this.#reftypeNullRegistry.Property = getTypeFromHeapType(heaptypes[i_property], true); // only used as the fields of `$DictInternal`
		this.#reftypeNullRegistry.Case     = getTypeFromHeapType(heaptypes[i_case],     true); // only used as the fields of `$MapInternal`
	}

	/** assumes both operands are primitive */
	#setupBinopArithmetic(
		name:    string,
		method:  (num0: binaryen.ExpressionRef, num1: binaryen.ExpressionRef) => binaryen.ExpressionRef,
		typekey: 'asInt' | 'asNat' | 'asFloat',
	): binaryen.FunctionRef {
		const mod: BinaryenModuleUpdates = this.module;
		const local_vects = [
			new BinValue(this, mod.local.get(0, this.reftype.Value)),
			new BinValue(this, mod.local.get(1, this.reftype.Value)),
		].map((binval) => new BinVect(mod, binval.asPrimitive));
		return mod.addFunction(
			name,
			binaryen.createType([this.reftype.Value, this.reftype.Value]),
			this.reftype.Value,
			[],
			new BinValue(this, new BinVect(mod, method.call(null, local_vects[0][typekey], local_vects[1][typekey])).vect).value,
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
		const local_vects = [
			new BinValue(this, mod.local.get(0, this.reftype.Value)),
			new BinValue(this, mod.local.get(1, this.reftype.Value)),
		].map((binval) => new BinVect(mod, binval.asPrimitive));

		const int_int: binaryen.ExpressionRef = method_ints.call(null, local_vects[0].asInt,    local_vects[1].asInt);
		const int_nat: binaryen.ExpressionRef = method_nats.call(null, local_vects[0].i_to_n(), local_vects[1].asNat);
		const int_flt: binaryen.ExpressionRef = method_flts.call(null, local_vects[0].i_to_f(), local_vects[1].asFloat);
		const nat_int: binaryen.ExpressionRef = method_nats.call(null, local_vects[0].asNat,    local_vects[1].i_to_n());
		const nat_nat: binaryen.ExpressionRef = method_nats.call(null, local_vects[0].asNat,    local_vects[1].asNat);
		const nat_flt: binaryen.ExpressionRef = method_flts.call(null, local_vects[0].n_to_f(), local_vects[1].asFloat);
		const flt_int: binaryen.ExpressionRef = method_flts.call(null, local_vects[0].asFloat,  local_vects[1].i_to_f());
		const flt_nat: binaryen.ExpressionRef = method_flts.call(null, local_vects[0].asFloat,  local_vects[1].n_to_f());
		const flt_flt: binaryen.ExpressionRef = method_flts.call(null, local_vects[0].asFloat,  local_vects[1].asFloat);

		return mod.addFunction(name, binaryen.createType([this.reftype.Value, this.reftype.Value]), this.reftype.Value, [], new BinValue(this, BinVect.boolOf(mod, mod.if(
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
		))).value);
	}

	#setupGlobals(): void {
		const global = new Global(this.module, 'obj-ctr', bigint_to_i64(this.module, 0n, true), binaryen.i64, true);
		this.#globals.set(global.name, global);
		global.init();
	}

	#setupFunctions(): void {
		const mod:       BinaryenModuleUpdates = this.module;
		const rt_value:  binaryen.Type         = this.reftype.Value;
		const rt_tuple:  binaryen.Type         = this.reftype.Tuple;
		const rt_record: binaryen.Type         = this.reftype.Record;
		const rt_list:   binaryen.Type         = this.reftype.List;
		const rt_dict:   binaryen.Type         = this.reftype.Dict;
		const rt_map:    binaryen.Type         = this.reftype.Map;
		const local_vals = [
			new BinValue(this, mod.local.get(0, rt_value)),
			new BinValue(this, mod.local.get(1, rt_value)),
		] as const;
		const local_vects = local_vals.map((binval) => new BinVect(mod, binval.asPrimitive));

		/* Unary Operators */
		mod.addFunction('isnull', rt_value, rt_value, [], new BinValue(this, BinVect.boolOf(mod, mod.i32.and(
			local_vals[0].isPrimitive,
			local_vects[0].isSpecial(null),
		))).value);
		mod.addFunction('vnot', rt_value, rt_value, [], new BinValue(this, BinVect.boolOf(mod, mod.i32.and(
			local_vals[0].isPrimitive,
			mod.i32.or(local_vects[0].isSpecial(null), local_vects[0].isSpecial(false)),
		))).value);
		mod.addFunction('vemp', rt_value, rt_value, [], mod.if(
			local_vals[0].isPrimitive,
			mod.if(
				local_vects[0].isSpecial(),
				mod.call('vnot', [local_vals[0].value], rt_value),
				new BinValue(this, BinVect.boolOf(mod, mod.if(
					local_vects[0].isInt,
					mod.i64.eqz(local_vects[0].asInt),
					mod.if(
						local_vects[0].isNat,
						mod.i64.eqz(local_vects[0].asNat),
						mod.if(
							local_vects[0].isFloat,
							mod.f64.eq(local_vects[0].asFloat, mod.f64.const(0.0)), // also takes care of -0.0
							mod.unreachable(),
						),
					),
				))).value,
			),
			new BinValue(this, BinVect.boolOf(mod, mod.call('cemp', [mod.ref.as_non_null(local_vals[0].asComposite)], binaryen.i32))).value,
		));
		mod.addFunction('vneg', rt_value, rt_value, [], new BinValue(this, mod.if( // assume operand is primitive
			local_vects[0].isInt,
			// `-n` in two’s complement is `(n xor -1) + 1`
			new BinVect(mod, mod.i64.add(mod.i64.xor(local_vects[0].asInt, bigint_to_i64(mod, -1n)), bigint_to_i64(mod, 1n))).vect,
			mod.if(
				local_vects[0].isFloat,
				new BinVect(mod, mod.f64.neg(local_vects[0].asFloat)).vect,
				mod.unreachable(), // cannot call NEG on other primitives
			),
		)).value);
		mod.addFunction('vtoi', rt_value, rt_value, [], mod.if( // assume operand is primitive
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
		mod.addFunction('vton', rt_value, rt_value, [], mod.if( // assume operand is primitive
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
		mod.addFunction('vtof', rt_value, rt_value, [], mod.if( // assume operand is primitive
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

		/* Binary Operators */
		this.#setupBinopArithmetic('viadd',   mod.i64.add  .bind(null), 'asInt');
		this.#setupBinopArithmetic('vfadd',   mod.f64.add  .bind(null), 'asFloat');
		this.#setupBinopArithmetic('visub_s', mod.i64.sub  .bind(null), 'asInt');
		this.#setupBinopArithmetic('visub_u', (num0, num1) => mod.call('isub_u', [num0, num1], binaryen.i64), 'asNat');
		this.#setupBinopArithmetic('vfsub',   mod.f64.sub  .bind(null), 'asFloat');
		this.#setupBinopArithmetic('vimul',   mod.i64.mul  .bind(null), 'asInt');
		this.#setupBinopArithmetic('vfmul',   mod.f64.mul  .bind(null), 'asFloat');
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
		mod.addFunction('vid', binaryen.createType([rt_value, rt_value]), rt_value, [], new BinValue(this, BinVect.boolOf(mod, mod.if(
			mod.i32.and(local_vals[0].isPrimitive, local_vals[1].isPrimitive),
			mod.if(
				mod.i32.and(local_vects[0].isSpecial(), local_vects[1].isSpecial()),
				mod.i32.eq(local_vects[0].asSpecial, local_vects[1].asSpecial),
				mod.if(
					mod.i32.and(local_vects[0].isInt, local_vects[1].isInt),
					mod.i64.eq(local_vects[0].asInt, local_vects[1].asInt), // `i64.eq` for ints gives the same result as `ID` operator
					mod.if(
						mod.i32.and(local_vects[0].isNat, local_vects[1].isNat),
						mod.i64.eq(local_vects[0].asNat, local_vects[1].asNat), // `i64.eq` for nats gives the same result as `ID` operator
						mod.if(
							mod.i32.and(local_vects[0].isFloat, local_vects[1].isFloat),
							mod.call('fid', [local_vects[0].asFloat, local_vects[1].asFloat], binaryen.i32),
							mod.i32.const(0),
						),
					),
				),
			),
			mod.if(
				mod.i32.and(
					mod.ref.test(local_vals[0].asComposite, rt_tuple),
					mod.ref.test(local_vals[1].asComposite, rt_tuple),
				),
				mod.call('Tuple.identical', [
					mod.ref.cast(local_vals[0].asComposite, rt_tuple),
					mod.ref.cast(local_vals[1].asComposite, rt_tuple),
				], binaryen.i32),
				mod.if(
					mod.i32.and(
						mod.ref.test(local_vals[0].asComposite, rt_record),
						mod.ref.test(local_vals[1].asComposite, rt_record),
					),
					mod.call('Record.identical', [
						mod.ref.cast(local_vals[0].asComposite, rt_record),
						mod.ref.cast(local_vals[1].asComposite, rt_record),
					], binaryen.i32),
					mod.ref.eq(local_vals[0].asComposite, local_vals[1].asComposite),
				),
			),
		))).value);

		mod.removeFunction('veq'); // removes stub defined in `stubs.wat`
		mod.addFunction('veq', binaryen.createType([rt_value, rt_value]), rt_value, [], mod.if(
			mod.i32.and(local_vals[0].isPrimitive, local_vals[1].isPrimitive),
			mod.if(
				mod.i32.or(local_vects[0].isSpecial(), local_vects[1].isSpecial()),
				mod.call('vid',  [local_vals[0].value, local_vals[1].value], rt_value),
				mod.call('veqn', [local_vals[0].value, local_vals[1].value], rt_value),
			),
			mod.if(
				mod.i32.and(
					mod.ref.test(local_vals[0].asComposite, rt_tuple),
					mod.ref.test(local_vals[1].asComposite, rt_tuple),
				),
				new BinValue(this, BinVect.boolOf(mod, mod.call('Tuple.equal', [
					mod.ref.cast(local_vals[0].asComposite, rt_tuple),
					mod.ref.cast(local_vals[1].asComposite, rt_tuple),
				], binaryen.i32))).value,
				mod.if(
					mod.i32.and(
						mod.ref.test(local_vals[0].asComposite, rt_record),
						mod.ref.test(local_vals[1].asComposite, rt_record),
					),
					new BinValue(this, BinVect.boolOf(mod, mod.call('Record.equal', [
						mod.ref.cast(local_vals[0].asComposite, rt_record),
						mod.ref.cast(local_vals[1].asComposite, rt_record),
					], binaryen.i32))).value,
					mod.if(
						mod.i32.and(
							mod.ref.test(local_vals[0].asComposite, rt_list),
							mod.ref.test(local_vals[1].asComposite, rt_list),
						),
						new BinValue(this, BinVect.boolOf(mod, mod.call('List.equal', [
							mod.ref.cast(local_vals[0].asComposite, rt_list),
							mod.ref.cast(local_vals[1].asComposite, rt_list),
						], binaryen.i32))).value,
						mod.if(
							mod.i32.and(
								mod.ref.test(local_vals[0].asComposite, rt_dict),
								mod.ref.test(local_vals[1].asComposite, rt_dict),
							),
							new BinValue(this, BinVect.boolOf(mod, mod.call('Dict.equal', [
								mod.ref.cast(local_vals[0].asComposite, rt_dict),
								mod.ref.cast(local_vals[1].asComposite, rt_dict),
							], binaryen.i32))).value,
							mod.if(
								mod.i32.and(
									mod.ref.test(local_vals[0].asComposite, rt_map),
									mod.ref.test(local_vals[1].asComposite, rt_map),
								),
								new BinValue(this, BinVect.boolOf(mod, mod.call('Map.equal', [
									mod.ref.cast(local_vals[0].asComposite, rt_map),
									mod.ref.cast(local_vals[1].asComposite, rt_map),
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
		mod.addFunction('bool-to-i32', rt_value, binaryen.i32, [], new BinVect(mod, local_vals[0].asPrimitive).isSpecial(true));
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

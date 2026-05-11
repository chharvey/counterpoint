import * as fs from 'node:fs';
import * as path from 'node:path';
import binaryen from 'binaryen';
import {runOnceMethod} from '../lib/decorators.ts';
import type {
	BinaryenModuleUpdates,
	Field,
	TypeBuilder,
} from '../builder/-types.d.ts';
import {Vect} from './classes/Vect.ts';
import {Value} from './classes/Value.ts';
import {Property} from './classes/Property.ts';
import {Case} from './classes/Case.ts';



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



type HeaptypeRegistry = Readonly<Record<TypeKey, binaryen.Type>>;
type ReftypeRegistry  = Readonly<Record<TypeKey, binaryen.Type>>;

type ReftypeNullRegistry = Readonly<Record<TypeKey & ('Value' | 'Property' | 'Case'), binaryen.Type>>;



/**
 * Create a new struct field for a `TypeBuilder`.
 * @param typ        the field type
 * @param packedType one of `'notPacked' | 'i8' | 'i16'` @default `'notPacked'`
 * @param mutable    Can the field be reassigned?        @default `false`
 */
function TypeBuilder_makeField(typ: binaryen.Type, packedType: 'notPacked' | 'i8' | 'i16' = 'notPacked', mutable: boolean = false): Field {
	return {
		type:       typ,
		// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
		packedType: binaryen[packedType],
		mutable,
	};
}



const IMPORTS: readonly string[] = [
	fs.readFileSync(path.join(import.meta.dirname, './wat/types.wat'),                 'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/stubs.wat'),                 'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/ops/fid.wat'),               'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/ops/mod.wat'),               'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/ops.wat'),                   'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/utils/capacity-needed.wat'), 'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/utils/hash.wat'),            'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/utils/stringify.wat'),       'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/Vect.wat'),          'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/Value.wat'),         'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/Property.wat'),      'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/Case.wat'),          'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/Tuple.wat'),         'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/Record.wat'),        'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/List.wat'),          'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/Dict.wat'),          'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/Map.wat'),           'utf8'),
];

/** Struct field constant indices. */
const STRUCT = {
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



export class VirtualMachine {
	/** A lookup table for heap types created by a Binaryen TypeBuilder. */
	#heaptypeRegistry!: HeaptypeRegistry;

	/** A registry of reference types. */
	#reftypeRegistry!: ReftypeRegistry;

	/** A registry of reference-null types. */
	#reftypeNullRegistry!: ReftypeNullRegistry;

	/** The Binaryen module that holds static types and functions, independent of any source program. */
	public readonly mod = binaryen.parseText(`
		(module
			${ IMPORTS.join('') }
		)
	`) as BinaryenModuleUpdates;

	/** Utilities for getting fields of WASM structs. */
	public readonly structGet = {
		object: {
			/** @return `(struct.get $Object $id <ref>)` */
			id: (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.mod.struct.get(STRUCT.OBJECT.ID, ref, binaryen.i64),
		},
		list: {
			/** @return `(struct.get $List $size     <ref>)` */ size:     (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.mod.struct.get(STRUCT.LIST.SIZE,     ref, binaryen.i32),
			/** @return `(struct.get $List $internal <ref>)` */ internal: (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.mod.struct.get(STRUCT.LIST.INTERNAL, ref, this.reftype.ListInternal),
		},
		dict: {
			/** @return `(struct.get $Dict $size     <ref>)` */ size:     (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.mod.struct.get(STRUCT.DICT.SIZE,     ref, binaryen.i32),
			/** @return `(struct.get $Dict $internal <ref>)` */ internal: (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.mod.struct.get(STRUCT.DICT.INTERNAL, ref, this.reftype.DictInternal),
		},
		map: {
			/** @return `(struct.get $Map $size     <ref>)` */ size:     (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.mod.struct.get(STRUCT.MAP.SIZE,     ref, binaryen.i32),
			/** @return `(struct.get $Map $internal <ref>)` */ internal: (ref: binaryen.ExpressionRef): binaryen.ExpressionRef => this.mod.struct.get(STRUCT.MAP.INTERNAL, ref, this.reftype.MapInternal),
		},
	} as const;

	/** Utilities for setting fields of WASM structs. */
	public readonly structSet = {
		object: {
			/** @return `(struct.get $Object $id <ref> <val>)` */
			id: (ref: binaryen.ExpressionRef, val: binaryen.ExpressionRef): binaryen.ExpressionRef => this.mod.struct.set(STRUCT.OBJECT.ID, ref, val),
		},
		list: {
			/** @return `(struct.get $List $size     <ref> <val>)` */ size:     (ref: binaryen.ExpressionRef, val: binaryen.ExpressionRef): binaryen.ExpressionRef => this.mod.struct.set(STRUCT.LIST.SIZE,     ref, val),
			/** @return `(struct.get $List $internal <ref> <val>)` */ internal: (ref: binaryen.ExpressionRef, val: binaryen.ExpressionRef): binaryen.ExpressionRef => this.mod.struct.set(STRUCT.LIST.INTERNAL, ref, val),
		},
		dict: {
			/** @return `(struct.get $Dict $size     <ref> <val>)` */ size:     (ref: binaryen.ExpressionRef, val: binaryen.ExpressionRef): binaryen.ExpressionRef => this.mod.struct.set(STRUCT.DICT.SIZE,     ref, val),
			/** @return `(struct.get $Dict $internal <ref> <val>)` */ internal: (ref: binaryen.ExpressionRef, val: binaryen.ExpressionRef): binaryen.ExpressionRef => this.mod.struct.set(STRUCT.DICT.INTERNAL, ref, val),
		},
		map: {
			/** @return `(struct.get $Map $size     <ref> <val>)` */ size:     (ref: binaryen.ExpressionRef, val: binaryen.ExpressionRef): binaryen.ExpressionRef => this.mod.struct.set(STRUCT.MAP.SIZE,     ref, val),
			/** @return `(struct.get $Map $internal <ref> <val>)` */ internal: (ref: binaryen.ExpressionRef, val: binaryen.ExpressionRef): binaryen.ExpressionRef => this.mod.struct.set(STRUCT.MAP.INTERNAL, ref, val),
		},
	} as const;

	public Vect     = new Vect(this);
	public Value    = new Value(this);
	public Property = new Property(this);
	public Case     = new Case(this);


	public constructor() {
		this.mod.setFeatures(( // NOTE: features are bit tags; to add them we must use bit-wise disjunction
			/* eslint-disable @stylistic/operator-linebreak */
			binaryen.Features.NontrappingFPToInt |
			binaryen.Features.SIMD128 |
			binaryen.Features.ReferenceTypes |
			binaryen.Features.Multivalue |
			binaryen.Features.GC
			/* eslint-enable @stylistic/operator-linebreak */
		));

		this.#setupTypes();
	}


	public get heaptype():    HeaptypeRegistry    { return this.#heaptypeRegistry; }
	public get reftype():     ReftypeRegistry     { return this.#reftypeRegistry; }
	public get reftypeNull(): ReftypeNullRegistry { return this.#reftypeNullRegistry; }


	/**
	 * Set up common types.
	 * We’ve defined these in a static `types.wat` file,
	 * but there’s currently no way to access them dynamically with Binaryen,
	 * so we repeat them here.
	 */
	@runOnceMethod
	#setupTypes(): void {
		// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
		const tb: TypeBuilder = new binaryen.TypeBuilder();

		let type_count: number = 0;

		/* (type $Value ...) */
		const i_value: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_value, [
			/* $tag */       TypeBuilder_makeField(binaryen.i32, 'i8'),
			/* $primitive */ TypeBuilder_makeField(binaryen.v128),
			/* $composite */ TypeBuilder_makeField(binaryen.eqref),
		]);

		/* (type $Property ...) */
		const i_property: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_property, [
			/* $key */ TypeBuilder_makeField(binaryen.i64),
			/* $val */ TypeBuilder_makeField(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
		]);

		/* (type $Case ...) */
		const i_case: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_case, [
			/* $ant */ TypeBuilder_makeField(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
			/* $con */ TypeBuilder_makeField(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
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
			/* $id */ TypeBuilder_makeField(binaryen.i64),
		]);
		tb.setOpen(i_object);

		/* (type $List ...) */
		const i_list: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_list, [
			/* $id */       TypeBuilder_makeField(binaryen.i64),
			/* $size */     TypeBuilder_makeField(binaryen.i32, 'notPacked', true),
			/* $internal */ TypeBuilder_makeField(tb.getTempRefType(tb.getTempHeapType(i_list_internal), false), 'notPacked', true),
		]);
		tb.setSubType(i_list, tb.getTempHeapType(i_object));
		tb.setOpen(i_list);

		/* (type $Dict ...) */
		const i_dict: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_dict, [
			/* $id */       TypeBuilder_makeField(binaryen.i64),
			/* $size */     TypeBuilder_makeField(binaryen.i32, 'notPacked', true),
			/* $internal */ TypeBuilder_makeField(tb.getTempRefType(tb.getTempHeapType(i_dict_internal), false), 'notPacked', true),
		]);
		tb.setSubType(i_dict, tb.getTempHeapType(i_object));
		tb.setOpen(i_dict);

		/* (type $Map ...) */
		const i_map: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_map, [
			/* $id */       TypeBuilder_makeField(binaryen.i64),
			/* $size */     TypeBuilder_makeField(binaryen.i32, 'notPacked', true),
			/* $internal */ TypeBuilder_makeField(tb.getTempRefType(tb.getTempHeapType(i_map_internal), false), 'notPacked', true),
		]);
		tb.setSubType(i_map, tb.getTempHeapType(i_object));
		tb.setOpen(i_map);

		const heaptypes: readonly binaryen.Type[] = tb.buildAndDispose();

		this.#heaptypeRegistry = {
			Value:        heaptypes[i_value],
			Property:     heaptypes[i_property],
			Case:         heaptypes[i_case],
			String:       heaptypes[i_string],
			Tuple:        heaptypes[i_tuple],
			Record:       heaptypes[i_record],
			ListInternal: heaptypes[i_list_internal],
			DictInternal: heaptypes[i_dict_internal],
			MapInternal:  heaptypes[i_map_internal],
			Object:       heaptypes[i_object],
			List:         heaptypes[i_list],
			Dict:         heaptypes[i_dict],
			Map:          heaptypes[i_map],
		};

		// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
		const {getTypeFromHeapType} = binaryen;

		this.#reftypeRegistry = {
			Value:        getTypeFromHeapType(heaptypes[i_value],         false),
			Property:     getTypeFromHeapType(heaptypes[i_property],      false),
			Case:         getTypeFromHeapType(heaptypes[i_case],          false),
			String:       getTypeFromHeapType(heaptypes[i_string],        false),
			Tuple:        getTypeFromHeapType(heaptypes[i_tuple],         false),
			Record:       getTypeFromHeapType(heaptypes[i_record],        false),
			ListInternal: getTypeFromHeapType(heaptypes[i_list_internal], false),
			DictInternal: getTypeFromHeapType(heaptypes[i_dict_internal], false),
			MapInternal:  getTypeFromHeapType(heaptypes[i_map_internal],  false),
			Object:       getTypeFromHeapType(heaptypes[i_object],        false),
			List:         getTypeFromHeapType(heaptypes[i_list],          false),
			Dict:         getTypeFromHeapType(heaptypes[i_dict],          false),
			Map:          getTypeFromHeapType(heaptypes[i_map],           false),
		};

		this.#reftypeNullRegistry = {
			Value:    getTypeFromHeapType(heaptypes[i_value],    true), // only used as the fields of `$ListInternal`
			Property: getTypeFromHeapType(heaptypes[i_property], true), // only used as the fields of `$DictInternal`
			Case:     getTypeFromHeapType(heaptypes[i_case],     true), // only used as the fields of `$MapInternal`
		};
	}

	public readonly op = {
		/** Is the value equal to the counterpoint value `null`? */
		isNull: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:is-null', [param0], this.reftype.Value)
		),

		/** Is the value falsy? */
		not: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:not', [param0], this.reftype.Value)
		),

		/** Is the value empty? */
		isEmpty: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:is-empty', [param0], this.reftype.Value)
		),

		/** Returns the mathematical negation. */
		negate: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:negate', [param0], this.reftype.Value)
		),

		/** Cast the argument to type `int`. */
		toInt: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:to-int', [param0], this.reftype.Value)
		),

		/** Cast the argument to type `nat`. */
		toNat: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:to-nat', [param0], this.reftype.Value)
		),

		/** Cast the argument to type `float`. */
		toFloat: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:to-float', [param0], this.reftype.Value)
		),

		/** Adds two `int`s. */
		intAdd: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:int-add', [param0, param1], this.reftype.Value)
		),

		/** Adds two `nat`s. */
		natAdd: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:nat-add', [param0, param1], this.reftype.Value)
		),

		/** Adds two `float`s. */
		floatAdd: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:float-add', [param0, param1], this.reftype.Value)
		),

		/** Subtracts two `int`s. */
		intSub: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:int-sub', [param0, param1], this.reftype.Value)
		),

		/** Subtracts two `nat`s. */
		natSub: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:nat-sub', [param0, param1], this.reftype.Value)
		),

		/** Subtracts two `float`s. */
		floatSub: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:float-sub', [param0, param1], this.reftype.Value)
		),

		/** Multiplies two `int`s. */
		intMul: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:int-mul', [param0, param1], this.reftype.Value)
		),

		/** Multiplies two `nat`s. */
		natMul: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:nat-mul', [param0, param1], this.reftype.Value)
		),

		/** Multiplies two `float`s. */
		floatMul: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:float-mul', [param0, param1], this.reftype.Value)
		),

		/** Divides two `int`s. */
		intDiv: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:int-div', [param0, param1], this.reftype.Value)
		),

		/** Divides two `nat`s. */
		natDiv: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:nat-div', [param0, param1], this.reftype.Value)
		),

		/** Divides two `float`s. */
		floatDiv: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:float-div', [param0, param1], this.reftype.Value)
		),

		/** Exponentiates two `int`s. */
		intExp: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:int-exp', [param0, param1], this.reftype.Value)
		),

		/** Exponentiates two `nat`s. */
		natExp: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:nat-exp', [param0, param1], this.reftype.Value)
		),

		/** Exponentiates two `float`s. */
		floatExp: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			this.mod.call('cpl:float-exp', [param0, param1], this.reftype.Value)
		),
	} as const;
}

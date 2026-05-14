import * as fs from 'node:fs';
import * as path from 'node:path';
import binaryen from 'binaryen';
import {memoizeMethod} from '../lib/decorators.ts';
import type {
	BinaryenModuleUpdates,
	Field,
	TypeBuilder,
} from '../builder/-types.d.ts';
import {Vect} from './classes/Vect.ts';
import {Value} from './classes/Value.ts';
import {Property} from './classes/Property.ts';
import {Case} from './classes/Case.ts';
import {Record as VmRecord} from './classes/Record.ts';
import {List} from './classes/List.ts';
import {Dict} from './classes/Dict.ts';
import {Map as VmMap} from './classes/Map.ts';
import {utils} from './ad-hoc/utils.ts';
import {ops} from './ad-hoc/ops.ts';



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
	fs.readFileSync(path.join(import.meta.dirname, './wat/types.wat'),                    'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/utils/mod.wat'),                'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/utils/capacity-needed.wat'),    'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/utils/compare-primitives.wat'), 'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/utils/stringify.wat'),          'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/utils/hash.wat'),               'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/ops.wat'),                      'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/Vect.wat'),             'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/Value.wat'),            'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/Property.wat'),         'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/Case.wat'),             'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/Record.wat'),           'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/List.wat'),             'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/Dict.wat'),             'utf8'),
	fs.readFileSync(path.join(import.meta.dirname, './wat/classes/Map.wat'),              'utf8'),
];



export class VirtualMachine {
	/** A lookup table for heap types created by a Binaryen TypeBuilder. */
	public readonly heaptype: HeaptypeRegistry;

	/** A registry of reference types. */
	public readonly reftype: ReftypeRegistry;

	/** A registry of reference-null types. */
	public readonly reftypeNull: ReftypeNullRegistry;

	/** The Binaryen module that holds static types and functions, independent of any source program. */
	public readonly mod = binaryen.parseText(`
		(module
			${ IMPORTS.join('') }
		)
	`) as BinaryenModuleUpdates;

	public readonly Vect     = new Vect(this);
	public readonly Value    = new Value(this);
	public readonly Property = new Property(this);
	public readonly Case     = new Case(this);
	public readonly Record   = new VmRecord(this);
	public readonly List     = new List(this);
	public readonly Dict     = new Dict(this);
	public readonly Map      = new VmMap(this);

	public readonly util = utils(this);
	public readonly op   = ops(this);


	public constructor() {
		this.mod.setFeatures(( // NOTE: features are bit tags; to add them we must use bit-wise disjunction
			/* eslint-disable @stylistic/operator-linebreak */
			binaryen.Features.NontrappingFPToInt |
			binaryen.Features.SIMD128 |
			binaryen.Features.TailCall |
			binaryen.Features.ReferenceTypes |
			binaryen.Features.Multivalue |
			binaryen.Features.GC
			/* eslint-enable @stylistic/operator-linebreak */
		));

		({
			heaptypeRegistry:    this.heaptype,
			reftypeRegistry:     this.reftype,
			reftypeNullRegistry: this.reftypeNull,
		} = this.#setupTypes());
	}


	/**
	 * Set up common types.
	 * We’ve defined these in a static `types.wat` file,
	 * but there’s currently no way to access them dynamically with Binaryen,
	 * so we repeat them here.
	 */
	@memoizeMethod
	#setupTypes(): {
		heaptypeRegistry:    HeaptypeRegistry,
		reftypeRegistry:     ReftypeRegistry,
		reftypeNullRegistry: ReftypeNullRegistry,
	} {
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

		// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
		const {getTypeFromHeapType} = binaryen;

		return {
			heaptypeRegistry: {
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
			},

			reftypeRegistry: {
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
			},

			reftypeNullRegistry: {
				Value:    getTypeFromHeapType(heaptypes[i_value],    true), // only used as the fields of `$ListInternal`
				Property: getTypeFromHeapType(heaptypes[i_property], true), // only used as the fields of `$DictInternal`
				Case:     getTypeFromHeapType(heaptypes[i_case],     true), // only used as the fields of `$MapInternal`
			},
		};
	}
}

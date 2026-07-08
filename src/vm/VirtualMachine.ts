import * as fs from 'node:fs';
import * as path from 'node:path';
import * as binaryen from 'binaryen.ts';
import {Vect} from './classes/Vect.ts';
import {Value} from './classes/Value.ts';
import {Property} from './classes/Property.ts';
import {Case} from './classes/Case.ts';
import {Record as VmRecord} from './classes/Record.ts';
import {Object as VmObject} from './classes/Object.ts';
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



type HeaptypeRegistry = Readonly<Record<TypeKey, binaryen.HeapType>>;
type ReftypeRegistry  = Readonly<Record<TypeKey, binaryen.Type>>;

type ReftypeNullRegistry = Readonly<Record<TypeKey & ('Value' | 'Property' | 'Case'), binaryen.Type>>;



/**
 * Create a new struct field for a `TypeBuilder`.
 * @param typ        the field type
 * @param packedType one of `'notPacked' | 'i8' | 'i16'` @default `'notPacked'`
 * @param mutable    Can the field be reassigned?        @default `false`
 */
function TypeBuilder_makeField(typ: binaryen.Type, packedType: 'notPacked' | 'i8' | 'i16' = 'notPacked', mutable: boolean = false): {
	type:       binaryen.Type,
	packedType: binaryen.PackedType,
	mutable:    boolean,
} {
	return {
		type:       typ,
		packedType: binaryen[packedType],
		mutable,
	};
}



const IMPORTS = await Promise.all([
	'./wat/types.wat',
	'./wat/utils/mod.wat',
	'./wat/utils/capacity-needed.wat',
	'./wat/utils/compare-numbers.wat',
	'./wat/utils/stringify.wat',
	'./wat/utils/hash.wat',
	'./wat/ops.wat',
	'./wat/classes/Vect.wat',
	'./wat/classes/Value.wat',
	'./wat/classes/Property.wat',
	'./wat/classes/Case.wat',
	'./wat/classes/Record.wat',
	'./wat/classes/Object.wat',
	'./wat/classes/List.wat',
	'./wat/classes/Dict.wat',
	'./wat/classes/Map.wat',
].map((filename) => fs.promises.readFile(path.join(import.meta.dirname, filename), 'utf8')));

/**
 * An object of registries for all the common types.
 * We’ve defined these in a static `types.wat` file,
 * but there’s currently no way to access them dynamically with Binaryen,
 * so we repeat them here.
 */
const TYPES: {
	readonly heaptypeRegistry:    HeaptypeRegistry,
	readonly reftypeRegistry:     ReftypeRegistry,
	readonly reftypeNullRegistry: ReftypeNullRegistry,
} = (() => {
	const tb = new binaryen.TypeBuilder();

	/* (type $Value ...) */
	const i_value: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_value, [
		/* $tag */       TypeBuilder_makeField(binaryen.i32, 'i8'),
		/* $primitive */ TypeBuilder_makeField(binaryen.v128),
		/* $composite */ TypeBuilder_makeField(binaryen.eqref),
	]);

	/* (type $Property ...) */
	const i_property: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_property, [
		/* $key */ TypeBuilder_makeField(binaryen.i64),
		/* $val */ TypeBuilder_makeField(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
	]);

	/* (type $Case ...) */
	const i_case: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_case, [
		/* $ant */ TypeBuilder_makeField(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
		/* $con */ TypeBuilder_makeField(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
	]);

	/* (type $String ...) */
	const i_string: number = tb.getSize();
	tb.grow(1);
	tb.setArrayType(
		i_string,
		binaryen.i32,
		binaryen.i8,
		true,
	);

	/* (type $Tuple ...) */
	const i_tuple: number = tb.getSize();
	tb.grow(1);
	tb.setArrayType(
		i_tuple,
		tb.getTempRefType(tb.getTempHeapType(i_value), false),
		binaryen.notPacked,
		false,
	);

	/* (type $Record ...) */
	const i_record: number = tb.getSize();
	tb.grow(1);
	tb.setArrayType(
		i_record,
		tb.getTempRefType(tb.getTempHeapType(i_property), false),
		binaryen.notPacked,
		false,
	);

	/* (type $ListInternal ...) */
	const i_list_internal: number = tb.getSize();
	tb.grow(1);
	tb.setArrayType(
		i_list_internal,
		tb.getTempRefType(tb.getTempHeapType(i_value), true),
		binaryen.notPacked,
		true,
	);

	/* (type $DictInternal ...) */
	const i_dict_internal: number = tb.getSize();
	tb.grow(1);
	tb.setArrayType(
		i_dict_internal,
		tb.getTempRefType(tb.getTempHeapType(i_property), true),
		binaryen.notPacked,
		true,
	);

	/* (type $MapInternal ...) */
	const i_map_internal: number = tb.getSize();
	tb.grow(1);
	tb.setArrayType(
		i_map_internal,
		tb.getTempRefType(tb.getTempHeapType(i_case), true),
		binaryen.notPacked,
		true,
	);

	/* (type $Object ...) */
	const i_object: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_object, [
		/* $id */ TypeBuilder_makeField(binaryen.i64),
	]);
	tb.setOpen(i_object);

	/* (type $List ...) */
	const i_list: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_list, [
		/* $id */       TypeBuilder_makeField(binaryen.i64),
		/* $size */     TypeBuilder_makeField(binaryen.i32, 'notPacked', true),
		/* $internal */ TypeBuilder_makeField(tb.getTempRefType(tb.getTempHeapType(i_list_internal), false), 'notPacked', true),
	]);
	tb.setSubType(i_list, tb.getTempHeapType(i_object));
	tb.setOpen(i_list);

	/* (type $Dict ...) */
	const i_dict: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_dict, [
		/* $id */       TypeBuilder_makeField(binaryen.i64),
		/* $size */     TypeBuilder_makeField(binaryen.i32, 'notPacked', true),
		/* $internal */ TypeBuilder_makeField(tb.getTempRefType(tb.getTempHeapType(i_dict_internal), false), 'notPacked', true),
	]);
	tb.setSubType(i_dict, tb.getTempHeapType(i_object));
	tb.setOpen(i_dict);

	/* (type $Map ...) */
	const i_map: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_map, [
		/* $id */       TypeBuilder_makeField(binaryen.i64),
		/* $size */     TypeBuilder_makeField(binaryen.i32, 'notPacked', true),
		/* $internal */ TypeBuilder_makeField(tb.getTempRefType(tb.getTempHeapType(i_map_internal), false), 'notPacked', true),
	]);
	tb.setSubType(i_map, tb.getTempHeapType(i_object));
	tb.setOpen(i_map);

	const heaptypes: readonly binaryen.HeapType[] = tb.buildAndDispose();

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
			Value:        binaryen.getTypeFromHeapType(heaptypes[i_value],         false),
			Property:     binaryen.getTypeFromHeapType(heaptypes[i_property],      false),
			Case:         binaryen.getTypeFromHeapType(heaptypes[i_case],          false),
			String:       binaryen.getTypeFromHeapType(heaptypes[i_string],        false),
			Tuple:        binaryen.getTypeFromHeapType(heaptypes[i_tuple],         false),
			Record:       binaryen.getTypeFromHeapType(heaptypes[i_record],        false),
			ListInternal: binaryen.getTypeFromHeapType(heaptypes[i_list_internal], false),
			DictInternal: binaryen.getTypeFromHeapType(heaptypes[i_dict_internal], false),
			MapInternal:  binaryen.getTypeFromHeapType(heaptypes[i_map_internal],  false),
			Object:       binaryen.getTypeFromHeapType(heaptypes[i_object],        false),
			List:         binaryen.getTypeFromHeapType(heaptypes[i_list],          false),
			Dict:         binaryen.getTypeFromHeapType(heaptypes[i_dict],          false),
			Map:          binaryen.getTypeFromHeapType(heaptypes[i_map],           false),
		},

		reftypeNullRegistry: {
			Value:    binaryen.getTypeFromHeapType(heaptypes[i_value],    true), // only used as the fields of `$ListInternal`
			Property: binaryen.getTypeFromHeapType(heaptypes[i_property], true), // only used as the fields of `$DictInternal`
			Case:     binaryen.getTypeFromHeapType(heaptypes[i_case],     true), // only used as the fields of `$MapInternal`
		},
	};
})();



export class VirtualMachine {
	/** A lookup table for heap types created by a Binaryen TypeBuilder. */
	public readonly heaptype: HeaptypeRegistry;

	/** A registry of reference types. */
	public readonly reftype: ReftypeRegistry;

	/** A registry of reference-null types. */
	public readonly reftypeNull: ReftypeNullRegistry;

	/** The Binaryen module that holds static types and functions, independent of any source program. */
	public readonly mod: binaryen.Module = binaryen.parseText(`
		(module $wat
			${ IMPORTS.join('') }
		)
	`);

	public readonly globalImportDataMap: ReadonlyMap<string, {readonly name: string, readonly type: binaryen.Type}> = new Map([
		['Vect#NULL',  {name: 'Vect.NULL',  type: binaryen.v128}],
		['Vect#FALSE', {name: 'Vect.FALSE', type: binaryen.v128}],
		['Vect#TRUE',  {name: 'Vect.TRUE',  type: binaryen.v128}],
	]);

	public readonly util = utils(this);
	public readonly op   = ops(this);

	public readonly Vect     = new Vect(this);
	public readonly Value    = new Value(this);
	public readonly Property = new Property(this);
	public readonly Case     = new Case(this);
	public readonly Record   = new VmRecord(this);
	public readonly Object   = new VmObject(this);
	public readonly List     = new List(this);
	public readonly Dict     = new Dict(this);
	public readonly Map      = new VmMap(this);


	public constructor() {
		this.mod.features = (
			/* eslint-disable @stylistic/operator-linebreak */
			binaryen.Feature.NontrappingFPToInt |
			binaryen.Feature.SIMD128 |
			binaryen.Feature.TailCall |
			binaryen.Feature.ReferenceTypes |
			binaryen.Feature.Multivalue |
			binaryen.Feature.GC
			/* eslint-enable @stylistic/operator-linebreak */
		);
		if (!this.mod.validate()) {
			throw new Error('Invalid WebAssembly module in VirtualMachine.');
		}

		({
			heaptypeRegistry:    this.heaptype,
			reftypeRegistry:     this.reftype,
			reftypeNullRegistry: this.reftypeNull,
		} = TYPES);
	}
}

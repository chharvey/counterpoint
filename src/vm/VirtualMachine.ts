import * as fs from 'node:fs';
import * as path from 'node:path';
import * as binaryen from 'binaryen.ts';
import {utils} from './ad-hoc/utils.ts';
import {ops} from './ad-hoc/ops.ts';
import {Vect} from './classes/Vect.ts';
import {Property} from './classes/Property.ts';
import {Case} from './classes/Case.ts';
import {Record as VmRecord} from './classes/Record.ts';
import {List} from './classes/List.ts';
import {Dict} from './classes/Dict.ts';
import {Map as VmMap} from './classes/Map.ts';
import {Value} from './classes/Value.ts';
import {Object as VmObject} from './classes/Object.ts';
import {Class as VmClass} from './classes/Class.ts';



type TypeKey = (
	| 'Property'
	| 'Case'
	| 'String'
	| 'Tuple'
	| 'Record'
	| 'ListInternal'
	| 'DictInternal'
	| 'MapInternal'
	| 'List'
	| 'Dict'
	| 'Map'
	| 'Composite'
	| 'Value'
	| 'Data'
	| 'Object'
	| 'Class'
	| 'CplString'
	| 'CplTuple'
	| 'CplRecord'
	| 'Exception'
	| 'Maybe'
	| 'Result'
	| 'Function'
);



type HeaptypeRegistry = Readonly<Record<TypeKey, binaryen.HeapType>>;
type ReftypeRegistry  = Readonly<Record<TypeKey, binaryen.Type>>;

type ReftypeNullRegistry = Readonly<Record<TypeKey & ('Property' | 'Case' | 'Composite' | 'Value' | 'Class' | 'Exception'), binaryen.Type>>;



/**
 * Create a new struct field for a `TypeBuilder`.
 * @param type_        the field type
 * @param mutable    Can the field be reassigned? @default `false`
 * @param packedType whether the type is packed   @default `binaryen.PackedType.notPacked`
 */
function make_struct_field(
	type_:      binaryen.Type,
	mutable:    boolean = false,
	packedType: binaryen.PackedType = binaryen.PackedType.notPacked,
): {
	type:       binaryen.Type,
	mutable:    boolean,
	packedType: binaryen.PackedType,
} {
	return {
		mutable,
		packedType,
		type: type_,
	};
}



const MODULE_TEXT: string = await fs.promises.readFile(path.join(import.meta.dirname, '../../dist/vm/module.wat'), 'utf8');

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

	const i_property:      number = tb.getSize(); tb.grow(1);
	const i_case:          number = tb.getSize(); tb.grow(1);
	const i_string:        number = tb.getSize(); tb.grow(1);
	const i_tuple:         number = tb.getSize(); tb.grow(1);
	const i_record:        number = tb.getSize(); tb.grow(1);
	const i_list_internal: number = tb.getSize(); tb.grow(1);
	const i_dict_internal: number = tb.getSize(); tb.grow(1);
	const i_map_internal:  number = tb.getSize(); tb.grow(1);
	const i_list:          number = tb.getSize(); tb.grow(1);
	const i_dict:          number = tb.getSize(); tb.grow(1);
	const i_map:           number = tb.getSize(); tb.grow(1);
	const i_composite:     number = tb.getSize(); tb.grow(1);
	const i_value:         number = tb.getSize(); tb.grow(1);
	const i_data:          number = tb.getSize(); tb.grow(1);
	const i_object:        number = tb.getSize(); tb.grow(1);
	const i_class:         number = tb.getSize(); tb.grow(1);
	const i_cpl_string:    number = tb.getSize(); tb.grow(1);
	const i_cpl_tuple:     number = tb.getSize(); tb.grow(1);
	const i_cpl_record:    number = tb.getSize(); tb.grow(1);
	const i_cpl_list:      number = tb.getSize(); tb.grow(1);
	const i_cpl_dict:      number = tb.getSize(); tb.grow(1);
	const i_cpl_map:       number = tb.getSize(); tb.grow(1);
	const i_exception:     number = tb.getSize(); tb.grow(1);
	const i_maybe:         number = tb.getSize(); tb.grow(1);
	const i_result:        number = tb.getSize(); tb.grow(1);
	const i_function:      number = tb.getSize(); tb.grow(1);

	/* (type $Property ...) */
	tb.setStructType(i_property, [
		/* $key */ make_struct_field(binaryen.Type.i64),
		/* $val */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
	]);

	/* (type $Case ...) */
	tb.setStructType(i_case, [
		/* $ant */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
		/* $con */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
	]);

	/* (type $String ...) */
	tb.setArrayType(
		i_string,
		binaryen.Type.i32,
		binaryen.PackedType.i8,
		true,
	);

	/* (type $Tuple ...) */
	tb.setArrayType(
		i_tuple,
		tb.getTempRefType(tb.getTempHeapType(i_value), false),
		binaryen.PackedType.notPacked,
		false,
	);

	/* (type $Record ...) */
	tb.setArrayType(
		i_record,
		tb.getTempRefType(tb.getTempHeapType(i_property), false),
		binaryen.PackedType.notPacked,
		false,
	);

	/* (type $ListInternal ...) */
	tb.setArrayType(
		i_list_internal,
		tb.getTempRefType(tb.getTempHeapType(i_value), true),
		binaryen.PackedType.notPacked,
		true,
	);

	/* (type $DictInternal ...) */
	tb.setArrayType(
		i_dict_internal,
		tb.getTempRefType(tb.getTempHeapType(i_property), true),
		binaryen.PackedType.notPacked,
		true,
	);

	/* (type $MapInternal ...) */
	tb.setArrayType(
		i_map_internal,
		tb.getTempRefType(tb.getTempHeapType(i_case), true),
		binaryen.PackedType.notPacked,
		true,
	);

	/* (type $List ...) */
	tb.setStructType(i_list, [
		/* $size */     make_struct_field(binaryen.Type.i32, true),
		/* $internal */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_list_internal), false), true),
	]);

	/* (type $Dict ...) */
	tb.setStructType(i_dict, [
		/* $size */     make_struct_field(binaryen.Type.i32, true),
		/* $internal */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_dict_internal), false), true),
	]);

	/* (type $Map ...) */
	tb.setStructType(i_map, [
		/* $size */     make_struct_field(binaryen.Type.i32, true),
		/* $internal */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_map_internal), false), true),
	]);

	/* (type $Composite ...) */
	tb.setStructType(i_composite, []);
	tb.setOpen(i_composite);

	/* (type $Value ...) */
	tb.setStructType(i_value, [
		/* $tag */       make_struct_field(binaryen.Type.i32, false, binaryen.PackedType.i8),
		/* $primitive */ make_struct_field(binaryen.Type.v128),
		/* $composite */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_composite), true)),
	]);

	/* (type $Data ...) */
	tb.setStructType(i_data, [
		/* $class */  make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_class), false)),
		/* $fields */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_dict),  false)),
	]);
	tb.setSubType(i_data, tb.getTempHeapType(i_composite));

	const fields_object = [
		/* $id */     make_struct_field(binaryen.Type.i64),
		/* $class */  make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_class), true)),
		/* $fields */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_dict),  false)),
	];

	/* (type $Object ...) */
	tb.setStructType(i_object, fields_object);
	tb.setSubType(i_object, tb.getTempHeapType(i_composite));
	tb.setOpen(i_object);

	/* (type $Class ...) */
	tb.setStructType(i_class, [
		...fields_object,
	]);
	tb.setSubType(i_class, tb.getTempHeapType(i_object));

	/* (type $Cpl-String ...) */
	tb.setStructType(i_cpl_string, [
		/* $internal */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_string), false)),
	]);
	tb.setSubType(i_cpl_string, tb.getTempHeapType(i_composite));

	/* (type $Cpl-Tuple ...) */
	tb.setStructType(i_cpl_tuple, [
		/* $internal */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_tuple), false)),
	]);
	tb.setSubType(i_cpl_tuple, tb.getTempHeapType(i_composite));

	/* (type $Cpl-Record ...) */
	tb.setStructType(i_cpl_record, [
		/* $internal */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_record), false)),
	]);
	tb.setSubType(i_cpl_record, tb.getTempHeapType(i_composite));

	/* (type $CplList ...) */
	tb.setStructType(i_cpl_list, [
		...fields_object,
		/* $list */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_list), false)),
	]);
	tb.setSubType(i_cpl_list, tb.getTempHeapType(i_object));

	/* (type $CplDict ...) */
	tb.setStructType(i_cpl_dict, [
		...fields_object,
		/* $dict */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_dict), false)),
	]);
	tb.setSubType(i_cpl_dict, tb.getTempHeapType(i_object));

	/* (type $CplMap ...) */
	tb.setStructType(i_cpl_map, [
		...fields_object,
		/* $map */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_map), false)),
	]);
	tb.setSubType(i_cpl_map, tb.getTempHeapType(i_object));

	/* (type $Exception ...) */
	tb.setStructType(i_exception, [
		...fields_object,
		/* $message */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_cpl_string), false)),
		/* $cause */   make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_exception),  true)),
	]);
	tb.setSubType(i_exception, tb.getTempHeapType(i_object));

	/* (type $Maybe ...) */
	tb.setStructType(i_maybe, [
		...fields_object,
		/* $value */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_value), true)),
	]);
	tb.setSubType(i_maybe, tb.getTempHeapType(i_object));

	/* (type $Result ...) */
	tb.setStructType(i_result, [
		...fields_object,
		/* $value */  make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_value),     true)),
		/* $reason */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_exception), true)),
	]);
	tb.setSubType(i_result, tb.getTempHeapType(i_object));

	/* (type $Function ...) */
	tb.setStructType(i_function, [
		...fields_object,
		/* $arity */ make_struct_field(binaryen.Type.i32, true),
	]);
	tb.setSubType(i_function, tb.getTempHeapType(i_object));

	tb.createRecGroup(0, tb.getSize());
	const heaptypes: readonly binaryen.HeapType[] = tb.buildAndDispose();

	return {
		heaptypeRegistry: {
			Property:     heaptypes[i_property],
			Case:         heaptypes[i_case],
			String:       heaptypes[i_string],
			Tuple:        heaptypes[i_tuple],
			Record:       heaptypes[i_record],
			ListInternal: heaptypes[i_list_internal],
			DictInternal: heaptypes[i_dict_internal],
			MapInternal:  heaptypes[i_map_internal],
			List:         heaptypes[i_list],
			Dict:         heaptypes[i_dict],
			Map:          heaptypes[i_map],
			Composite:    heaptypes[i_composite],
			Value:        heaptypes[i_value],
			Data:         heaptypes[i_data],
			Object:       heaptypes[i_object],
			Class:        heaptypes[i_class],
			CplString:    heaptypes[i_cpl_string],
			CplTuple:     heaptypes[i_cpl_tuple],
			CplRecord:    heaptypes[i_cpl_record],
			Exception:    heaptypes[i_exception],
			Maybe:        heaptypes[i_maybe],
			Result:       heaptypes[i_result],
			Function:     heaptypes[i_function],
		},

		reftypeRegistry: {
			Property:     binaryen.getTypeFromHeapType(heaptypes[i_property],      false),
			Case:         binaryen.getTypeFromHeapType(heaptypes[i_case],          false),
			String:       binaryen.getTypeFromHeapType(heaptypes[i_string],        false),
			Tuple:        binaryen.getTypeFromHeapType(heaptypes[i_tuple],         false),
			Record:       binaryen.getTypeFromHeapType(heaptypes[i_record],        false),
			ListInternal: binaryen.getTypeFromHeapType(heaptypes[i_list_internal], false),
			DictInternal: binaryen.getTypeFromHeapType(heaptypes[i_dict_internal], false),
			MapInternal:  binaryen.getTypeFromHeapType(heaptypes[i_map_internal],  false),
			List:         binaryen.getTypeFromHeapType(heaptypes[i_list],          false),
			Dict:         binaryen.getTypeFromHeapType(heaptypes[i_dict],          false),
			Map:          binaryen.getTypeFromHeapType(heaptypes[i_map],           false),
			Composite:    binaryen.getTypeFromHeapType(heaptypes[i_composite],     false),
			Value:        binaryen.getTypeFromHeapType(heaptypes[i_value],         false),
			Data:         binaryen.getTypeFromHeapType(heaptypes[i_data],          false),
			Object:       binaryen.getTypeFromHeapType(heaptypes[i_object],        false),
			Class:        binaryen.getTypeFromHeapType(heaptypes[i_class],         false),
			CplString:    binaryen.getTypeFromHeapType(heaptypes[i_cpl_string],    false),
			CplTuple:     binaryen.getTypeFromHeapType(heaptypes[i_cpl_tuple],     false),
			CplRecord:    binaryen.getTypeFromHeapType(heaptypes[i_cpl_record],    false),
			Exception:    binaryen.getTypeFromHeapType(heaptypes[i_exception],     false),
			Maybe:        binaryen.getTypeFromHeapType(heaptypes[i_maybe],         false),
			Result:       binaryen.getTypeFromHeapType(heaptypes[i_result],        false),
			Function:     binaryen.getTypeFromHeapType(heaptypes[i_function],      false),
		},

		reftypeNullRegistry: {
			Property:  binaryen.getTypeFromHeapType(heaptypes[i_property],  true), // only used as the fields of `$DictInternal`
			Case:      binaryen.getTypeFromHeapType(heaptypes[i_case],      true), // only used as the fields of `$MapInternal`
			Composite: binaryen.getTypeFromHeapType(heaptypes[i_composite], true), // only used as the fields of `$Value`
			Value:     binaryen.getTypeFromHeapType(heaptypes[i_value],     true), // only used as the fields of `$ListInternal` and `$Maybe`
			Class:     binaryen.getTypeFromHeapType(heaptypes[i_class],     true), // only used as the fields of `$Class`
			Exception: binaryen.getTypeFromHeapType(heaptypes[i_exception], true), // only used as the fields of `$Exception` and `$Result`
		},
	};
})();



export class VirtualMachine {
	/** The Binaryen module that holds static types and functions, independent of any source program. */
	public readonly mod: binaryen.Module = binaryen.parseText(MODULE_TEXT, (0
		| binaryen.Feature.NontrappingFPToInt
		| binaryen.Feature.SIMD128
		| binaryen.Feature.TailCall
		| binaryen.Feature.ReferenceTypes
		| binaryen.Feature.Multivalue
		| binaryen.Feature.GC
	));

	/** A lookup table for heap types created by a Binaryen TypeBuilder. */
	public readonly heaptype: HeaptypeRegistry;

	/** A registry of reference types. */
	public readonly reftype: ReftypeRegistry;

	/** A registry of reference-null types. */
	public readonly reftypeNull: ReftypeNullRegistry;

	public readonly globalImportDataMap: ReadonlyMap<string, {readonly name: string, readonly type: binaryen.Type}>;

	public readonly util = utils(this);
	public readonly op   = ops(this);

	public readonly Vect     = new Vect(this);
	public readonly Property = new Property(this);
	public readonly Case     = new Case(this);
	public readonly Record   = new VmRecord(this);
	public readonly List     = new List(this);
	public readonly Dict     = new Dict(this);
	public readonly Map      = new VmMap(this);
	public readonly Value    = new Value(this);
	public readonly Object   = new VmObject(this);
	public readonly Class    = new VmClass(this);


	public constructor() {
		if (!this.mod.validate()) {
			throw new Error('Invalid WebAssembly module in VirtualMachine.');
		}

		({
			heaptypeRegistry:    this.heaptype,
			reftypeRegistry:     this.reftype,
			reftypeNullRegistry: this.reftypeNull,
		} = TYPES);

		this.globalImportDataMap = new Map([
			['Property#TOMBSTONE', {name: 'Property.TOMBSTONE', type: this.reftype.Property}],
			['Case#TOMBSTONE',     {name: 'Case.TOMBSTONE',     type: this.reftype.Case}],

			['Value#NULL',  {name: 'Value.NULL',  type: this.reftype.Value}],
			['Value#FALSE', {name: 'Value.FALSE', type: this.reftype.Value}],
			['Value#TRUE',  {name: 'Value.TRUE',  type: this.reftype.Value}],

			['Class#CLASS',     {name: 'Class.CLASS',     type: this.reftype.Class}],
			['Class#NULL',      {name: 'Class.NULL',      type: this.reftype.Class}],
			['Class#BOOLEAN',   {name: 'Class.BOOLEAN',   type: this.reftype.Class}],
			['Class#SYMBOL',    {name: 'Class.SYMBOL',    type: this.reftype.Class}],
			['Class#INTEGER',   {name: 'Class.INTEGER',   type: this.reftype.Class}],
			['Class#NATURAL',   {name: 'Class.NATURAL',   type: this.reftype.Class}],
			['Class#FLOAT',     {name: 'Class.FLOAT',     type: this.reftype.Class}],
			['Class#STRING',    {name: 'Class.STRING',    type: this.reftype.Class}],
			['Class#OBJECT',    {name: 'Class.OBJECT',    type: this.reftype.Class}],
			['Class#LIST',      {name: 'Class.LIST',      type: this.reftype.Class}],
			['Class#DICT',      {name: 'Class.DICT',      type: this.reftype.Class}],
			['Class#SET',       {name: 'Class.SET',       type: this.reftype.Class}],
			['Class#MAP',       {name: 'Class.MAP',       type: this.reftype.Class}],
			['Class#EXCEPTION', {name: 'Class.EXCEPTION', type: this.reftype.Class}],
			['Class#MAYBE',     {name: 'Class.MAYBE',     type: this.reftype.Class}],
			['Class#NONE',      {name: 'Class.NONE',      type: this.reftype.Class}],
			['Class#SOME',      {name: 'Class.SOME',      type: this.reftype.Class}],
			['Class#RESULT',    {name: 'Class.RESULT',    type: this.reftype.Class}],
			['Class#FAIL',      {name: 'Class.FAIL',      type: this.reftype.Class}],
			['Class#OK',        {name: 'Class.OK',        type: this.reftype.Class}],
			['Class#FUNCTION',  {name: 'Class.FUNCTION',  type: this.reftype.Class}],
		]);
	}
}

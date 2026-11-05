import * as fs from 'node:fs';
import * as path from 'node:path';
import * as binaryen from 'binaryen.ts';
import {Vect} from './classes/Vect.ts';
import {Value} from './classes/Value.ts';
import {Property} from './classes/Property.ts';
import {Case} from './classes/Case.ts';
import {List} from './classes/List.ts';
import {Dict} from './classes/Dict.ts';
import {Map as VmMap} from './classes/Map.ts';
import {String as VmString} from './classes/String.ts';
import {Tuple as VmTuple} from './classes/Tuple.ts';
import {Record as VmRecord} from './classes/Record.ts';
import {Object as VmObject} from './classes/Object.ts';
import {utils} from './ad-hoc/utils.ts';
import {ops} from './ad-hoc/ops.ts';



type TypeKey = (
	| 'Value'
	| 'Property'
	| 'Case'
	| 'ListInternal'
	| 'DictInternal'
	| 'MapInternal'
	| 'List'
	| 'Dict'
	| 'Map'
	| 'Composite'
	| 'StringInternal'
	| 'TupleInternal'
	| 'RecordInternal'
	| 'String'
	| 'Tuple'
	| 'Record'
	| 'Data'
	| 'Object'
	| 'Class'
	| 'Exception'
	| 'Maybe'
	| 'Result'
	| 'Function'
);



type HeaptypeRegistry = Readonly<Record<TypeKey, binaryen.HeapType>>;
type ReftypeRegistry  = Readonly<Record<TypeKey, binaryen.Type>>;

type ReftypeNullRegistry = Readonly<Record<TypeKey & ('Value' | 'Property' | 'Case' | 'Composite' | 'Class' | 'Exception'), binaryen.Type>>;



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

	// allocates first due to subtype and field order
	const i_composite: number = tb.getSize();
	tb.grow(1);
	const i_object: number = tb.getSize();
	tb.grow(1);
	const i_class: number = tb.getSize();
	tb.grow(1);

	/* (type $Value ...) */
	const i_value: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_value, [
		/* $tag */       make_struct_field(binaryen.Type.i32, false, binaryen.PackedType.i8),
		/* $primitive */ make_struct_field(binaryen.Type.v128),
		/* $composite */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_composite), true)),
	]);

	/* (type $Property ...) */
	const i_property: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_property, [
		/* $key */ make_struct_field(binaryen.Type.i64),
		/* $val */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
	]);

	/* (type $Case ...) */
	const i_case: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_case, [
		/* $ant */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
		/* $con */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
	]);

	/* (type $ListInternal ...) */
	const i_list_internal: number = tb.getSize();
	tb.grow(1);
	tb.setArrayType(
		i_list_internal,
		tb.getTempRefType(tb.getTempHeapType(i_value), true),
		binaryen.PackedType.notPacked,
		true,
	);

	/* (type $DictInternal ...) */
	const i_dict_internal: number = tb.getSize();
	tb.grow(1);
	tb.setArrayType(
		i_dict_internal,
		tb.getTempRefType(tb.getTempHeapType(i_property), true),
		binaryen.PackedType.notPacked,
		true,
	);

	/* (type $MapInternal ...) */
	const i_map_internal: number = tb.getSize();
	tb.grow(1);
	tb.setArrayType(
		i_map_internal,
		tb.getTempRefType(tb.getTempHeapType(i_case), true),
		binaryen.PackedType.notPacked,
		true,
	);

	/* (type $List ...) */
	const i_list: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_list, [
		/* $size */     make_struct_field(binaryen.Type.i32, true),
		/* $internal */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_list_internal), false), true),
	]);

	/* (type $Dict ...) */
	const i_dict: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_dict, [
		/* $size */     make_struct_field(binaryen.Type.i32, true),
		/* $internal */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_dict_internal), false), true),
	]);

	/* (type $Map ...) */
	const i_map: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_map, [
		/* $size */     make_struct_field(binaryen.Type.i32, true),
		/* $internal */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_map_internal), false), true),
	]);

	/* (type $Composite ...) */
	tb.setStructType(i_composite, []);
	tb.setOpen(i_composite);

	/* (type $StringInternal ...) */
	const i_string_internal: number = tb.getSize();
	tb.grow(1);
	tb.setArrayType(
		i_string_internal,
		binaryen.Type.i32,
		binaryen.PackedType.i8,
		true,
	);

	/* (type $TupleInternal ...) */
	const i_tuple_internal: number = tb.getSize();
	tb.grow(1);
	tb.setArrayType(
		i_tuple_internal,
		tb.getTempRefType(tb.getTempHeapType(i_value), false),
		binaryen.PackedType.notPacked,
		false,
	);

	/* (type $RecordInternal ...) */
	const i_record_internal: number = tb.getSize();
	tb.grow(1);
	tb.setArrayType(
		i_record_internal,
		tb.getTempRefType(tb.getTempHeapType(i_property), false),
		binaryen.PackedType.notPacked,
		false,
	);

	/* (type $String ...) */
	const i_string: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_string, [
		/* $internal */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_string_internal), false)),
	]);
	tb.setSubType(i_string, tb.getTempHeapType(i_composite));

	/* (type $Tuple ...) */
	const i_tuple: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_tuple, [
		/* $internal */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_tuple_internal), false)),
	]);
	tb.setSubType(i_tuple, tb.getTempHeapType(i_composite));

	/* (type $Record ...) */
	const i_record: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_record, [
		/* $internal */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_record_internal), false)),
	]);
	tb.setSubType(i_record, tb.getTempHeapType(i_composite));

	/* (type $Data ...) */
	const i_data: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_data, [
		/* $class */  make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_class), true), true),
		/* $fields */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_dict), false)),
	]);
	tb.setSubType(i_data, tb.getTempHeapType(i_composite));

	const fields_object = [
		/* $id */     make_struct_field(binaryen.Type.i64),
		/* $class */  make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_class), true), true),
		/* $fields */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_dict), false)),
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

	/* (type $CplList ...) */
	const i_cpl_list: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_cpl_list, [
		...fields_object,
		/* $list */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_list), false)),
	]);
	tb.setSubType(i_cpl_list, tb.getTempHeapType(i_object));

	/* (type $CplDict ...) */
	const i_cpl_dict: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_cpl_dict, [
		...fields_object,
		/* $dict */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_dict), false)),
	]);
	tb.setSubType(i_cpl_dict, tb.getTempHeapType(i_object));

	/* (type $CplMap ...) */
	const i_cpl_map: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_cpl_map, [
		...fields_object,
		/* $map */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_map), false)),
	]);
	tb.setSubType(i_cpl_map, tb.getTempHeapType(i_object));

	/* (type $Exception ...) */
	const i_exception: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_exception, [
		...fields_object,
		/* $message */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_string),    false)),
		/* $cause */   make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_exception), true)),
	]);
	tb.setSubType(i_exception, tb.getTempHeapType(i_object));

	/* (type $Maybe ...) */
	const i_maybe: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_maybe, [
		...fields_object,
		/* $value */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_value), true)),
	]);
	tb.setSubType(i_maybe, tb.getTempHeapType(i_object));

	/* (type $Result ...) */
	const i_result: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_result, [
		...fields_object,
		/* $value */  make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_value),     true)),
		/* $reason */ make_struct_field(tb.getTempRefType(tb.getTempHeapType(i_exception), true)),
	]);
	tb.setSubType(i_result, tb.getTempHeapType(i_object));

	/* (type $Function ...) */
	const i_function: number = tb.getSize();
	tb.grow(1);
	tb.setStructType(i_function, [
		...fields_object,
		/* $arity */ make_struct_field(binaryen.Type.i32, true),
	]);
	tb.setSubType(i_function, tb.getTempHeapType(i_object));

	tb.createRecGroup(0, tb.getSize());
	const heaptypes: readonly binaryen.HeapType[] = tb.buildAndDispose();

	return {
		heaptypeRegistry: {
			Value:          heaptypes[i_value],
			Property:       heaptypes[i_property],
			Case:           heaptypes[i_case],
			ListInternal:   heaptypes[i_list_internal],
			DictInternal:   heaptypes[i_dict_internal],
			MapInternal:    heaptypes[i_map_internal],
			List:           heaptypes[i_list],
			Dict:           heaptypes[i_dict],
			Map:            heaptypes[i_map],
			Composite:      heaptypes[i_composite],
			StringInternal: heaptypes[i_string_internal],
			TupleInternal:  heaptypes[i_tuple_internal],
			RecordInternal: heaptypes[i_record_internal],
			String:         heaptypes[i_string],
			Tuple:          heaptypes[i_tuple],
			Record:         heaptypes[i_record],
			Data:           heaptypes[i_data],
			Object:         heaptypes[i_object],
			Class:          heaptypes[i_class],
			Exception:      heaptypes[i_exception],
			Maybe:          heaptypes[i_maybe],
			Result:         heaptypes[i_result],
			Function:       heaptypes[i_function],
		},

		reftypeRegistry: {
			Value:          binaryen.getTypeFromHeapType(heaptypes[i_value],           false),
			Property:       binaryen.getTypeFromHeapType(heaptypes[i_property],        false),
			Case:           binaryen.getTypeFromHeapType(heaptypes[i_case],            false),
			ListInternal:   binaryen.getTypeFromHeapType(heaptypes[i_list_internal],   false),
			DictInternal:   binaryen.getTypeFromHeapType(heaptypes[i_dict_internal],   false),
			MapInternal:    binaryen.getTypeFromHeapType(heaptypes[i_map_internal],    false),
			List:           binaryen.getTypeFromHeapType(heaptypes[i_list],            false),
			Dict:           binaryen.getTypeFromHeapType(heaptypes[i_dict],            false),
			Map:            binaryen.getTypeFromHeapType(heaptypes[i_map],             false),
			Composite:      binaryen.getTypeFromHeapType(heaptypes[i_composite],       false),
			StringInternal: binaryen.getTypeFromHeapType(heaptypes[i_string_internal], false),
			TupleInternal:  binaryen.getTypeFromHeapType(heaptypes[i_tuple_internal],  false),
			RecordInternal: binaryen.getTypeFromHeapType(heaptypes[i_record_internal], false),
			String:         binaryen.getTypeFromHeapType(heaptypes[i_string],          false),
			Tuple:          binaryen.getTypeFromHeapType(heaptypes[i_tuple],           false),
			Record:         binaryen.getTypeFromHeapType(heaptypes[i_record],          false),
			Data:           binaryen.getTypeFromHeapType(heaptypes[i_data],            false),
			Object:         binaryen.getTypeFromHeapType(heaptypes[i_object],          false),
			Class:          binaryen.getTypeFromHeapType(heaptypes[i_class],           false),
			Exception:      binaryen.getTypeFromHeapType(heaptypes[i_exception],       false),
			Maybe:          binaryen.getTypeFromHeapType(heaptypes[i_maybe],           false),
			Result:         binaryen.getTypeFromHeapType(heaptypes[i_result],          false),
			Function:       binaryen.getTypeFromHeapType(heaptypes[i_function],        false),
		},

		reftypeNullRegistry: {
			Value:     binaryen.getTypeFromHeapType(heaptypes[i_value],     true), // only used as the fields of `$ListInternal` and `$Maybe`
			Property:  binaryen.getTypeFromHeapType(heaptypes[i_property],  true), // only used as the fields of `$DictInternal`
			Case:      binaryen.getTypeFromHeapType(heaptypes[i_case],      true), // only used as the fields of `$MapInternal`
			Composite: binaryen.getTypeFromHeapType(heaptypes[i_composite], true), // only used as the fields of `$Value`
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

	public readonly Vect      = new Vect(this);
	public readonly Value     = new Value(this);
	public readonly Property  = new Property(this);
	public readonly Case      = new Case(this);
	public readonly List      = new List(this);
	public readonly Dict      = new Dict(this);
	public readonly Map       = new VmMap(this);
	public readonly String    = new VmString(this);
	public readonly Tuple     = new VmTuple(this);
	public readonly Record    = new VmRecord(this);
	public readonly Object    = new VmObject(this);


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
			['Value#NULL',  {name: 'Value.NULL',  type: this.reftype.Value}],
			['Value#FALSE', {name: 'Value.FALSE', type: this.reftype.Value}],
			['Value#TRUE',  {name: 'Value.TRUE',  type: this.reftype.Value}],
		]);
	}
}

import * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Struct field constant indices. */
const FIELD = {
	/** `$Value.$tag` */       TAG:       0,
	/** `$Value.$primitive` */ PRIMITIVE: 1,
	/** `$Value.$composite` */ COMPOSITE: 2,
} as const;



/** WASM representation of a Counterpoint value. */
export class Value implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		const {reftype} = this.vm;
		return new Map<string, FuncImportData>([
			['Value#newComposite', {name: 'Value.new-composite', param: reftype.Composite,   result: reftype.Value}],
			['Value#isPrimitive',  {name: 'Value.is-primitive',  param: reftype.Value,       result: binaryen.Type.i32}],
			['Value#isComposite',  {name: 'Value.is-composite',  param: reftype.Value,       result: binaryen.Type.i32}],
			['Value#boolToI32',    {name: 'Value.bool-to-i32',   param: reftype.Value,       result: binaryen.Type.i32}],
			['Value#boolFromI32',  {name: 'Value.bool-from-i32', param: binaryen.Type.i32,   result: reftype.Value}],
			['Value#fromInt',      {name: 'Value.from-int',      param: binaryen.Type.v128,  result: reftype.Value}],
			['Value#fromNat',      {name: 'Value.from-nat',      param: binaryen.Type.v128,  result: reftype.Value}],
			['Value#fromFloat',    {name: 'Value.from-float',    param: binaryen.Type.v128,  result: reftype.Value}],
			['Value#fromString',   {name: 'Value.from-string',   param: reftype.String,      result: reftype.Value}],
			['Value#fromTuple',    {name: 'Value.from-tuple',    param: reftype.Tuple,       result: reftype.Value}],
			['Value#fromRecord',   {name: 'Value.from-record',   param: reftype.Record,      result: reftype.Value}],
			['Value#fromList',     {name: 'Value.from-list',     param: reftype.List,        result: reftype.Value}],
			['Value#fromDict',     {name: 'Value.from-dict',     param: reftype.Dict,        result: reftype.Value}],
			['Value#fromMap',      {name: 'Value.from-map',      param: reftype.Map,         result: reftype.Value}],
			['Value#asPrimitive',  {name: 'Value.as-primitive',  param: reftype.Value,       result: binaryen.Type.v128}],
			['Value#asString',     {name: 'Value.as-string',     param: reftype.Value,       result: reftype.String}],
			['Value#asTuple',      {name: 'Value.as-tuple',      param: reftype.Value,       result: reftype.Tuple}],
			['Value#asRecord',     {name: 'Value.as-record',     param: reftype.Value,       result: reftype.Record}],
			['Value#asList',       {name: 'Value.as-list',       param: reftype.Value,       result: reftype.List}],
			['Value#asDict',       {name: 'Value.as-dict',       param: reftype.Value,       result: reftype.Dict}],
			['Value#asMap',        {name: 'Value.as-map',        param: reftype.Value,       result: reftype.Map}],
			['Value#asData',       {name: 'Value.as-data',       param: reftype.Value,       result: reftype.Data}],
			['Value#asObject',     {name: 'Value.as-object',     param: reftype.Value,       result: reftype.Object}],
			['Value#asClass',      {name: 'Value.as-class',      param: reftype.Value,       result: reftype.Class}],
		]);
	}

	/** The Counterpoint `null`  value. */ public get NULL():  binaryen.ExpressionRef /* (ref $Value) */ { return this.vm.mod.wasm.global.get('Value.NULL',  this.vm.reftype.Value); }
	/** The Counterpoint `false` value. */ public get FALSE(): binaryen.ExpressionRef /* (ref $Value) */ { return this.vm.mod.wasm.global.get('Value.FALSE', this.vm.reftype.Value); }
	/** The Counterpoint `true`  value. */ public get TRUE():  binaryen.ExpressionRef /* (ref $Value) */ { return this.vm.mod.wasm.global.get('Value.TRUE',  this.vm.reftype.Value); }


	/** @deprecated */
	private field(ref: binaryen.ExpressionRef /* (ref null $Value) */): {
		/** @return `(struct.get $Value $tag       <ref>)` */ readonly tag:       binaryen.ExpressionRef /* i32 */,
		/** @return `(struct.get $Value $primitive <ref>)` */ readonly primitive: binaryen.ExpressionRef /* v128 */,
		/** @return `(struct.get $Value $composite <ref>)` */ readonly composite: binaryen.ExpressionRef /* (ref null $Composite) */,
	} {
		const {mod: {wasm}, reftypeNull} = this.vm;
		return {
			get tag()       { return wasm.struct.get_u (FIELD.TAG,       ref, binaryen.Type.i32); },
			get primitive() { return wasm.struct.get   (FIELD.PRIMITIVE, ref, binaryen.Type.v128); },
			get composite() { return wasm.struct.get   (FIELD.COMPOSITE, ref, reftypeNull.Composite); },
		};
	}

	/**
	 * Extracts a `$Value`’s `$composite` field and returns a `(ref.cast)` to the given reference type.
	 * This method does not test the value’s `$tag` field — it assumes its `$composite` field is filled.
	 * @param value   the expression to cast
	 * @param reftype the type to cast to
	 * @return        `(ref.cast (struct.get $Value $composite <value>) <reftype>)`
	 * @deprecated    use `Value#as*` or `wasm.ref.cast()`
	 */
	public cast(value: binaryen.ExpressionRef /* (ref $Value) */, reftype: binaryen.Type): binaryen.ExpressionRef /* <reftype> */ {
		return this.vm.mod.wasm.ref.cast(this.field(value).composite, reftype);
	}

	/** Creates a new Value struct storing the given reference in its composite slot. @deprecated TODO: after untagging $Value, use `(struct.new $Value)` (or a subtype) directly */
	public newComposite(composite: binaryen.ExpressionRef /* (ref $Composite) */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Value.new-composite', [composite], this.vm.reftype.Value);
	}

	/** Whether the value is primitive (tag == 1). */
	public isPrimitive(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call('Value.is-primitive', [value], binaryen.Type.i32);
	}

	/** Whether the value is composite (tag == 2). */
	public isComposite(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call('Value.is-composite', [value], binaryen.Type.i32);
	}

	/** Converts this value (assuming it’s primitive and boolean) to i32. */
	public boolToI32(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call('Value.bool-to-i32', [value], binaryen.Type.i32);
	}

	/** Converts an i32 value to a $Value with a boolean primitive. */
	public boolFromI32(bool: binaryen.ExpressionRef /* i32 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Value.bool-from-i32', [bool], this.vm.reftype.Value);
	}

	/** Creates a new value holding the given v128 as an Integer. */
	public fromInt(vect: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Value.from-int', [vect], this.vm.reftype.Value);
	}

	/** Creates a new value holding the given v128 as a Natural. */
	public fromNat(vect: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Value.from-nat', [vect], this.vm.reftype.Value);
	}

	/** Creates a new value holding the given v128 as a Float. */
	public fromFloat(vect: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Value.from-float', [vect], this.vm.reftype.Value);
	}

	/** Creates a new value holding the given String. */
	public fromString(list: binaryen.ExpressionRef /* (ref $String) */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Value.from-string', [list], this.vm.reftype.Value);
	}

	/** Creates a new value holding the given Tuple. */
	public fromTuple(list: binaryen.ExpressionRef /* (ref $Tuple) */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Value.from-tuple', [list], this.vm.reftype.Value);
	}

	/** Creates a new value holding the given Record. */
	public fromRecord(list: binaryen.ExpressionRef /* (ref $Record) */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Value.from-record', [list], this.vm.reftype.Value);
	}

	/** Creates a new value holding the given List. */
	public fromList(list: binaryen.ExpressionRef /* (ref $List) */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Value.from-list', [list], this.vm.reftype.Value);
	}

	/** Creates a new value holding the given Dict. */
	public fromDict(list: binaryen.ExpressionRef /* (ref $Dict) */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Value.from-dict', [list], this.vm.reftype.Value);
	}

	/** Creates a new value holding the given Map. */
	public fromMap(list: binaryen.ExpressionRef /* (ref $Map) */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Value.from-map', [list], this.vm.reftype.Value);
	}

	/** Casts the value to a v128. */
	public asPrimitive(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* v128 */ {
		return this.vm.mod.wasm.call('Value.as-primitive', [value], binaryen.Type.v128);
	}

	/** Casts the value to a String. */
	public asString(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $String) */ {
		return this.vm.mod.wasm.call('Value.as-string', [value], this.vm.reftype.String);
	}

	/** Casts the value to a Tuple. */
	public asTuple(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Tuple) */ {
		return this.vm.mod.wasm.call('Value.as-tuple', [value], this.vm.reftype.Tuple);
	}

	/** Casts the value to a Record. */
	public asRecord(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Record) */ {
		return this.vm.mod.wasm.call('Value.as-record', [value], this.vm.reftype.Record);
	}

	/** Returns the value as a List. */
	public asList(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $List) */ {
		return this.vm.mod.wasm.call('Value.as-list', [value], this.vm.reftype.List);
	}

	/** Returns the value as a Dict. */
	public asDict(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Dict) */ {
		return this.vm.mod.wasm.call('Value.as-dict', [value], this.vm.reftype.Dict);
	}

	/** Returns the value as a Map. */
	public asMap(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Map) */ {
		return this.vm.mod.wasm.call('Value.as-map', [value], this.vm.reftype.Map);
	}

	/** Returns the value as a Data. */
	public asData(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Data) */ {
		return this.vm.mod.wasm.call('Value.as-data', [value], this.vm.reftype.Data);
	}

	/** Returns the value as an Object. */
	public asObject(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Object) */ {
		return this.vm.mod.wasm.call('Value.as-object', [value], this.vm.reftype.Object);
	}

	/** Returns the value as a Class. */
	public asClass(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Class) */ {
		return this.vm.mod.wasm.call('Value.as-class', [value], this.vm.reftype.Class);
	}
}

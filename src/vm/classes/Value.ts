import * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Namespace for fields and methods of `$Value`. */
export class Value implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		const {reftype} = this.vm;
		return new Map<string, FuncImportData>([
			['Value#boolToI32',   {name: 'Value.bool-to-i32',   param: reftype.Value,      result: binaryen.Type.i32}],
			['Value#boolFromI32', {name: 'Value.bool-from-i32', param: binaryen.Type.i32,  result: reftype.Value}],
			['Value#fromInt',     {name: 'Value.from-int',      param: binaryen.Type.v128, result: reftype.CplPrimitive}],
			['Value#fromNat',     {name: 'Value.from-nat',      param: binaryen.Type.v128, result: reftype.CplPrimitive}],
			['Value#fromFloat',   {name: 'Value.from-float',    param: binaryen.Type.v128, result: reftype.CplPrimitive}],
			['Value#fromString',  {name: 'Value.from-string',   param: reftype.String,     result: reftype.CplString}],
			['Value#fromTuple',   {name: 'Value.from-tuple',    param: reftype.Tuple,      result: reftype.CplTuple}],
			['Value#fromRecord',  {name: 'Value.from-record',   param: reftype.Record,     result: reftype.CplRecord}],
			['Value#fromList',    {name: 'Value.from-list',     param: reftype.List,       result: reftype.CplList}],
			['Value#fromDict',    {name: 'Value.from-dict',     param: reftype.Dict,       result: reftype.CplDict}],
			['Value#fromMap',     {name: 'Value.from-map',      param: reftype.Map,        result: reftype.CplMap}],
			['Value#fromClosure', {name: 'Value.from-closure',  param: reftype.Closure,    result: reftype.CplFunction}],
			['Value#asPrimitive', {name: 'Value.as-primitive',  param: reftype.Value,      result: binaryen.Type.v128}],
			['Value#asString',    {name: 'Value.as-string',     param: reftype.Value,      result: reftype.String}],
			['Value#asTuple',     {name: 'Value.as-tuple',      param: reftype.Value,      result: reftype.Tuple}],
			['Value#asRecord',    {name: 'Value.as-record',     param: reftype.Value,      result: reftype.Record}],
			['Value#asList',      {name: 'Value.as-list',       param: reftype.Value,      result: reftype.List}],
			['Value#asDict',      {name: 'Value.as-dict',       param: reftype.Value,      result: reftype.Dict}],
			['Value#asMap',       {name: 'Value.as-map',        param: reftype.Value,      result: reftype.Map}],
			['Value#asClosure',   {name: 'Value.as-closure',    param: reftype.Value,      result: reftype.Closure}],
		]);
	}

	/**
	 * A value in the VM representing the return of a void function.
	 * Not an actual Counterpoint value.
	 */                                    public get VOID():  binaryen.ExpressionRef /* (ref $Value) */ { return this.vm.mod.wasm.global.get('Value.VOID',  this.vm.reftype.Value); }
	/** The Counterpoint `null`  value. */ public get NULL():  binaryen.ExpressionRef /* (ref $Value) */ { return this.vm.mod.wasm.global.get('Value.NULL',  this.vm.reftype.Value); }
	/** The Counterpoint `false` value. */ public get FALSE(): binaryen.ExpressionRef /* (ref $Value) */ { return this.vm.mod.wasm.global.get('Value.FALSE', this.vm.reftype.Value); }
	/** The Counterpoint `true`  value. */ public get TRUE():  binaryen.ExpressionRef /* (ref $Value) */ { return this.vm.mod.wasm.global.get('Value.TRUE',  this.vm.reftype.Value); }


	/** Converts this value (assuming it’s primitive and boolean) to i32. */
	public boolToI32(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call('Value.bool-to-i32', [value], binaryen.Type.i32);
	}

	/** Converts an i32 value to a $Value with a boolean primitive. */
	public boolFromI32(bool: binaryen.ExpressionRef /* i32 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Value.bool-from-i32', [bool], this.vm.reftype.Value);
	}

	/** Creates a new value holding the given v128 as an Integer. */
	public fromInt(vect: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* (ref $Cpl-Primitive) */ {
		return this.vm.mod.wasm.call('Value.from-int', [vect], this.vm.reftype.CplPrimitive);
	}

	/** Creates a new value holding the given v128 as a Natural. */
	public fromNat(vect: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* (ref $Cpl-Primitive) */ {
		return this.vm.mod.wasm.call('Value.from-nat', [vect], this.vm.reftype.CplPrimitive);
	}

	/** Creates a new value holding the given v128 as a Float. */
	public fromFloat(vect: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* (ref $Cpl-Primitive) */ {
		return this.vm.mod.wasm.call('Value.from-float', [vect], this.vm.reftype.CplPrimitive);
	}

	/** Creates a new value holding the given String. */
	public fromString(str: binaryen.ExpressionRef /* (ref $String) */): binaryen.ExpressionRef /* (ref $Cpl-String) */ {
		return this.vm.mod.wasm.call('Value.from-string', [str], this.vm.reftype.CplString);
	}

	/** Creates a new value holding the given Tuple. */
	public fromTuple(tup: binaryen.ExpressionRef /* (ref $Tuple) */): binaryen.ExpressionRef /* (ref $Cpl-Tuple) */ {
		return this.vm.mod.wasm.call('Value.from-tuple', [tup], this.vm.reftype.CplTuple);
	}

	/** Creates a new value holding the given Record. */
	public fromRecord(rec: binaryen.ExpressionRef /* (ref $Record) */): binaryen.ExpressionRef /* (ref $Cpl-Record) */ {
		return this.vm.mod.wasm.call('Value.from-record', [rec], this.vm.reftype.CplRecord);
	}

	/** Creates a new value holding the given List. */
	public fromList(list: binaryen.ExpressionRef /* (ref $List) */): binaryen.ExpressionRef /* (ref $Cpl-List) */ {
		return this.vm.mod.wasm.call('Value.from-list', [list], this.vm.reftype.CplList);
	}

	/** Creates a new value holding the given Dict. */
	public fromDict(dict: binaryen.ExpressionRef /* (ref $Dict) */): binaryen.ExpressionRef /* (ref $Cpl-Dict) */ {
		return this.vm.mod.wasm.call('Value.from-dict', [dict], this.vm.reftype.CplDict);
	}

	/** Creates a new value holding the given Map. */
	public fromMap(map: binaryen.ExpressionRef /* (ref $Map) */): binaryen.ExpressionRef /* (ref $Cpl-Map) */ {
		return this.vm.mod.wasm.call('Value.from-map', [map], this.vm.reftype.CplMap);
	}

	/** Creates a new value holding the given Closure. */
	public fromClosure(closure: binaryen.ExpressionRef /* (ref $Closure) */): binaryen.ExpressionRef /* (ref $Cpl-Function) */ {
		return this.vm.mod.wasm.call('Value.from-closure', [closure], this.vm.reftype.CplFunction);
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

	/** Returns the value as a Closure. */
	public asClosure(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Closure) */ {
		return this.vm.mod.wasm.call('Value.as-closure', [value], this.vm.reftype.Closure);
	}
}

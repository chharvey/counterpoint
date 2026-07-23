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
			['Value#newPrimitive', {name: 'Value.new-primitive', param: binaryen.v128,  result: reftype.Value}],
			['Value#newComposite', {name: 'Value.new-composite', param: binaryen.eqref, result: reftype.Value}], // TODO: `(ref eq)` (non-null)
			['Value#isPrimitive',  {name: 'Value.is-primitive',  param: reftype.Value,  result: binaryen.i32}],
			['Value#isComposite',  {name: 'Value.is-composite',  param: reftype.Value,  result: binaryen.i32}],
			['Value#boolToI32',    {name: 'Value.bool-to-i32',   param: reftype.Value,  result: binaryen.i32}],
			['Value#boolFromI32',  {name: 'Value.bool-from-i32', param: binaryen.i32,   result: reftype.Value}],
			['Value#stringify',    {name: 'Value.stringify',     param: reftype.Value,  result: reftype.String}],
		]);
	}


	public field(ref: binaryen.ExpressionRef /* (ref null $Value) */): {
		/** @return `(struct.get $Value $tag       <ref>)` */ readonly tag:       binaryen.ExpressionRef /* i32 */,
		/** @return `(struct.get $Value $primitive <ref>)` */ readonly primitive: binaryen.ExpressionRef /* v128 */,
		/** @return `(struct.get $Value $primitive <ref>)` */ readonly composite: binaryen.ExpressionRef /* eqref */,
	} {
		const {wasm} = this.vm.mod;
		return {
			get tag()       { return wasm.struct.get(FIELD.TAG,       ref, binaryen.i32, false); },
			get primitive() { return wasm.struct.get(FIELD.PRIMITIVE, ref, binaryen.v128); },
			get composite() { return wasm.struct.get(FIELD.COMPOSITE, ref, binaryen.eqref); },
		};
	}

	/**
	 * Extracts a `$Value`’s `$composite` field and returns a `(ref.cast)` to the given reference type.
	 * This method does not test the value’s `$tag` field — it assumes its `$composite` field is filled.
	 * @param value   the expression to cast
	 * @param reftype the type to cast to
	 * @return        `(ref.cast (struct.get $Value $composite <value>) <reftype>)`
	 */
	public cast(value: binaryen.ExpressionRef /* (ref $Value) */, reftype: binaryen.Type): binaryen.ExpressionRef /* <reftype> */ {
		return this.vm.mod.wasm.ref.cast(this.field(value).composite, reftype);
	}

	/** Returns `(struct.new_default $Value)`, for deleting variables/parameters/fields. */
	public newDefault(): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.struct.new_default(this.vm.heaptype.Value);
	}

	/** Creates a new Value struct storing the given v128 in its primitive slot. */
	public newPrimitive(primitive: binaryen.ExpressionRef /* v128 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Value.new-primitive', [primitive], this.vm.reftype.Value);
	}

	/** Creates a new Value struct storing the given reference in its composite slot. */
	public newComposite(composite: binaryen.ExpressionRef /* (ref eq) */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Value.new-composite', [composite], this.vm.reftype.Value);
	}

	/** Whether the value is primitive (tag == 1). */
	public isPrimitive(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call('Value.is-primitive', [value], binaryen.i32);
	}

	/** Whether the value is composite (tag == 2). */
	public isComposite(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call('Value.is-composite', [value], binaryen.i32);
	}

	/** Converts this value (assuming it’s primitive and boolean) to i32. */
	public boolToI32(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call('Value.bool-to-i32', [value], binaryen.i32);
	}

	/** Converts an i32 value to a $Value with a boolean primitive. */
	public boolFromI32(bool: binaryen.ExpressionRef /* i32 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Value.bool-from-i32', [bool], this.vm.reftype.Value);
	}

	/** Return a string representation of the value. */
	public stringify(value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $String) */ {
		return this.vm.mod.wasm.call('Value.stringify', [value], this.vm.reftype.String);
	}
}

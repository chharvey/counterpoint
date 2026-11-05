import * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Precursor to the Counterpoint `Object` class. */
class VmObject implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		const {reftype, reftypeNull} = this.vm;
		return new Map<string, FuncImportData>([
			['Object#ctrPlusPlus', {name: 'Object.ctr-plus-plus', param: binaryen.Type.none, result: binaryen.Type.i64}],

			['Object#getField', {
				name:   'Object.get-field',
				param:  binaryen.createType([reftype.Object, binaryen.Type.i64]),
				result: reftype.Value,
			}],
			['Object#setField', {
				name:   'Object.set-field',
				param:  binaryen.createType([reftype.Object, binaryen.Type.i64, reftype.Value]),
				result: binaryen.Type.none,
			}],
			['Dict#deleteField', {
				name:   'Object.delete-field',
				param:  binaryen.createType([reftype.Object, binaryen.Type.i64]),
				result: reftypeNull.Value,
			}],
		]);
	}


	/**
	 * Increments the value of `$Object.ctr`, but then returns its pre-incremented value.
	 * Equivalent to `ctr++` in most imperative languages.
	 */
	public ctrPlusPlus(): binaryen.ExpressionRef /* i64 */ {
		return this.vm.mod.wasm.call('Object.ctr-plus-plus', [], binaryen.Type.i64);
	}

	/**
	 * Get the value of a field on the Object.
	 * If there is no value at the given key, a trap occurs.
	 */
	public getField(obj: binaryen.ExpressionRef /* (ref $Object) */, field_id: binaryen.ExpressionRef /* i64 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('$Object.get-field', [obj, field_id], this.vm.reftype.Value);
	}

	/**
	 * Set the value of a field on the Object.
	 */
	public setField(obj: binaryen.ExpressionRef /* (ref $Object) */, field_id: binaryen.ExpressionRef /* i64 */, value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* void */ {
		return this.vm.mod.wasm.call('$Object.set-field', [obj, field_id, value], binaryen.Type.none);
	}

	/**
	 * Delete a field on the Object.
	 * If a field with the given id exists, it is deleted and its value is returned;
	 * otherwise `(ref.null $Value)` is returned and the Object’s fields are not mutated.
	 */
	public delete(obj: binaryen.ExpressionRef /* (ref $Object) */, field_id: binaryen.ExpressionRef /* i64 */): binaryen.ExpressionRef /* (ref null $Value) */ {
		return this.vm.mod.wasm.call('Object.delete-field', [obj, field_id], this.vm.reftypeNull.Value);
	}
}
export {VmObject as Object};

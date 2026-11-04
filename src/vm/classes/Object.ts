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
		return new Map<string, FuncImportData>([
			['Object#ctrPlusPlus', {name: 'Object.ctr-plus-plus', param: binaryen.Type.none, result: binaryen.Type.i64}],
		]);
	}

	/** Global counter for `$Object` structs. Used for values of field `$Object.$id`. */
	public get ctr(): binaryen.ExpressionRef /* i64 */ {
		return this.vm.mod.wasm.global.get('Object.ctr', binaryen.Type.i64);
	}


	/**
	 * Increments the value of `$Object.ctr`, but then returns its pre-incremented value.
	 * Equivalent to `ctr++` in most imperative languages.
	 */
	public ctrPlusPlus(): binaryen.ExpressionRef /* i64 */ {
		return this.vm.mod.wasm.call('Object.ctr-plus-plus', [], binaryen.Type.i64);
	}
}
export {VmObject as Object};

import * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



class VmRecord implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		return new Map<string, FuncImportData>([
			['Record#get', {
				name:   'Record.get',
				param:  binaryen.createType([this.vm.reftype.Record, binaryen.i64]),
				result: this.vm.reftype.Value,
			}],
		]);
	}


	/** Get the value in a record at the given key. */
	public get(record: binaryen.ExpressionRef /* (ref $Record) */, key: binaryen.ExpressionRef /* i64 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Record.get', [record, key], this.vm.reftype.Value);
	}
}
export {VmRecord as Record};

import * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Namespace for fields and methods of `$Closure`. */
export class Closure implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		const {reftype, reftypeNull} = this.vm;
		return new Map<string, FuncImportData>([
			['Closure#call', {
				name:   'Closure.call',
				param:  binaryen.createType([reftype.Closure, reftype.Tuple, reftypeNull.Tuple]),
				result: binaryen.createType([reftypeNull.Value, reftypeNull.Exception]),
			}],
		]);
	}


	/** Calls the given closure with the provided arguments. */
	public call(
		closure: binaryen.ExpressionRef /* (ref $Closure) */,
		env:     binaryen.ExpressionRef /* (ref $Tuple) */,
		args:    binaryen.ExpressionRef /* (ref null $Tuple) */,
	): binaryen.ExpressionRef /* (ref null $Value) (ref null $Exception) */ {
		return this.vm.mod.wasm.call('Closure.call', [closure, env, args], binaryen.createType([this.vm.reftypeNull.Value, this.vm.reftypeNull.Exception]));
	}
}

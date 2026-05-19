import * as binaryen from 'binaryen.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {FuncImportData} from '../classes/HasFuncData.ts';



/** Code-generation utilities. */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function utils(vm: VirtualMachine) {
	let func_import_memo: ReadonlyMap<string, FuncImportData> | null = null;

	return {
		get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
			func_import_memo ??= new Map<string, FuncImportData>([
				['util::capacityNeeded', {name: 'util:capacity-needed', param: binaryen.i32, result: binaryen.i32}],
			]);
			return func_import_memo;
		},


		capacityNeeded: (param0: binaryen.ExpressionRef /* i32 */): binaryen.ExpressionRef /* i32 */ => (
			vm.mod.wasm.call('util:capacity-needed', [param0], binaryen.i32)
		),
	} as const;
}

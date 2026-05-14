import binaryen from 'binaryen';
import type {VirtualMachine} from '../VirtualMachine.ts';



/** Code-generation utilities. */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function utils(vm: VirtualMachine) {
	return {
		capacityNeeded: (param0: binaryen.ExpressionRef /* i32 */): binaryen.ExpressionRef /* i32 */ => (
			vm.mod.call('util:capacity-needed', [param0], binaryen.i32)
		),
	} as const;
}

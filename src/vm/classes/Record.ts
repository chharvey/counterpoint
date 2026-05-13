import type binaryen from 'binaryen';
import type {VirtualMachine} from '../VirtualMachine.ts';



class VmRecord {
	public constructor(private readonly vm: VirtualMachine) {}


	/** Get the value in a record at the given key. */
	public get(param0: binaryen.ExpressionRef /* (ref $Record) */, param1: binaryen.ExpressionRef /* i64 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.call('Record.get', [param0, param1], this.vm.reftype.Value);
	}
}
export {VmRecord as Record};

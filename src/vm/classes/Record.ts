import type * as binaryen from 'binaryen.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';



class VmRecord {
	public constructor(private readonly vm: VirtualMachine) {}


	/** Get the value in a record at the given key. */
	public get(record: binaryen.ExpressionRef /* (ref $Record) */, key: binaryen.ExpressionRef /* i64 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Record.get', [record, key], this.vm.reftype.Value);
	}
}
export {VmRecord as Record};

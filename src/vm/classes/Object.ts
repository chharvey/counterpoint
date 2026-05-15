import binaryen from 'binaryen';
import type {VirtualMachine} from '../VirtualMachine.ts';



/** Struct field constant indices. */
const FIELD = {
	/** `$Object.$id` */
	ID: 0,
} as const;



/** Precursor to the Counterpoint `Object` class. */
class VmObject {
	public constructor(private readonly vm: VirtualMachine) {}


	public field(ref: binaryen.ExpressionRef /* (ref null $Object) */): {
		/** @return `(struct.get $Object $id <ref>)` */
		readonly id: binaryen.ExpressionRef /* i64 */,
	} {
		const {mod} = this.vm;
		return {
			get id() {
				return mod.struct.get(FIELD.ID, ref, binaryen.i64);
			},
		};
	}
}
export {VmObject as Object};

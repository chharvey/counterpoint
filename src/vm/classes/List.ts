import binaryen from 'binaryen';
import type {VirtualMachine} from '../VirtualMachine.ts';



/** Struct field constant indices. */
const FIELD = {
	/** `$List.$size`     */ SIZE:     1,
	/** `$List.$internal` */ INTERNAL: 2,
} as const;



export class List {
	public constructor(private readonly vm: VirtualMachine) {}

	public field(ref: binaryen.ExpressionRef /* (ref null $List) */): {
		/** @return `(struct.get $List $size     <ref>)` */ readonly size:     binaryen.ExpressionRef /* i32 */,
		/** @return `(struct.get $List $internal <ref>)` */ readonly internal: binaryen.ExpressionRef /* (ref $ListInternal) */,

		/** @return `(struct.set $List $size     <ref> <val>)` */ setSize    (val: binaryen.ExpressionRef /* i32 */):                 binaryen.ExpressionRef /* void */,
		/** @return `(struct.set $List $internal <ref> <val>)` */ setInternal(val: binaryen.ExpressionRef /* (ref $ListInternal) */): binaryen.ExpressionRef /* void */,
	} {
		const {mod, reftype} = this.vm;
		return {
			get size()     { return mod.struct.get(FIELD.SIZE,     ref, binaryen.i32); },
			get internal() { return mod.struct.get(FIELD.INTERNAL, ref, reftype.ListInternal); },

			setSize(val)     { return mod.struct.set(FIELD.SIZE,     ref, val); },
			setInternal(val) { return mod.struct.set(FIELD.INTERNAL, ref, val); },
		};
	}

	/**
	 * Returns the number of “live” elements in the List.
	 * Since lists are contiguously front-packed and contain no tombstones,
	 * this should always be equal to the List’s size.
	 */
	public count(param0: binaryen.ExpressionRef /* (ref $List) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.call('List.count', [param0], binaryen.i32);
	}

	/**
	 * Reallocates a List’s internal array as needed, adjusting for size.
	 * The List’s items are copied over to the new array, preserving the order from the original array.
	 */
	public adjustCapacity(param0: binaryen.ExpressionRef /* (ref $List) */, param1: binaryen.ExpressionRef /* i32 */): binaryen.ExpressionRef /* void */ {
		return this.vm.mod.call('List.adjust-capacity', [param0, param1], binaryen.none);
	}

	/**
	 * Set a List value given an index.
	 * The provided index must be non-negative and less than or equal to the List’s count.
	 * (‘Equal to’ is allowed when appending to the List.)
	 * This method first reallocates if necessary, then adds the item.
	 */
	public set(param0: binaryen.ExpressionRef /* (ref $List) */, param1: binaryen.ExpressionRef /* i32 */, param2: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* void */ {
		return this.vm.mod.call('List.set', [param0, param1, param2], binaryen.none);
	}

	/**
	 * Delete a List item at the given index.
	 * The provided index must be non-negative and strictly less than the List’s count.
	 * Shifts all subsequent items to the front, and returns the deleted item.
	 * This method removes the item first, then reallocates if necessary.
	 */
	public delete(param0: binaryen.ExpressionRef /* (ref $List) */, param1: binaryen.ExpressionRef /* i32 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.call('List.delete', [param0, param1], this.vm.reftype.Value);
	}
}

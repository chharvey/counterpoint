import * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Precursor to the Counterpoint `List` class. */
export class List implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		const {reftype} = this.vm;
		return new Map<string, FuncImportData>([
			['List#count', {name: 'List.count', param: reftype.List, result: binaryen.Type.i32}],
			['List#adjustCapacity', {
				name:   'List.adjust-capacity',
				param:  binaryen.createType([reftype.List, binaryen.Type.i32]),
				result: binaryen.Type.none,
			}],
			['List#get', {
				name:   'List.get',
				param:  binaryen.createType([reftype.List, binaryen.Type.i32]),
				result: reftype.Value,
			}],
			['List#set', {
				name:   'List.set',
				param:  binaryen.createType([reftype.List, binaryen.Type.i32, reftype.Value]),
				result: binaryen.Type.none,
			}],
			['List#delete', {
				name:   'List.delete',
				param:  binaryen.createType([reftype.List, binaryen.Type.i32]),
				result: reftype.Value,
			}],
			['List#copyFromTuple', {
				name:   'List.copy-from-tuple',
				param:  binaryen.createType([reftype.List, reftype.Tuple]),
				result: binaryen.Type.none,
			}],
			['List#copyFromList', {
				name:   'List.copy-from-list',
				param:  binaryen.createType([reftype.List, reftype.List]),
				result: binaryen.Type.none,
			}],
			['List#fillFromSet', {
				name:   'List.fill-from-set',
				param:  binaryen.createType([reftype.List, reftype.Map]),
				result: binaryen.Type.none,
			}],
		]);
	}


	/**
	 * Returns the number of “live” elements in the List.
	 * Since lists are contiguously front-packed and contain no tombstones,
	 * this should always be equal to the List’s size.
	 */
	public count(list: binaryen.ExpressionRef /* (ref $List) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call('List.count', [list], binaryen.Type.i32);
	}

	/**
	 * Reallocates a List’s internal array as needed, adjusting for size.
	 * The List’s items are copied over to the new array, preserving the order from the original array.
	 */
	public adjustCapacity(list: binaryen.ExpressionRef /* (ref $List) */, capacity: binaryen.ExpressionRef /* i32 */): binaryen.ExpressionRef /* void */ {
		return this.vm.mod.wasm.call('List.adjust-capacity', [list, capacity], binaryen.Type.none);
	}

	/**
	 * Get a List item given an index.
	 * The provided index must be non-negative and strictly less than the List’s length
	 * (but may be greater than its count).
	 * If there is no item at the given index, a trap occurs.
	 */
	public get(list: binaryen.ExpressionRef /* (ref $List) */, index: binaryen.ExpressionRef /* i32 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('List.get', [list, index], this.vm.reftype.Value);
	}

	/**
	 * Set a List item given an index.
	 * The provided index must be non-negative and less than or equal to the List’s count.
	 * (‘Equal to’ is allowed when appending to the List.)
	 * This method first reallocates if necessary, then adds the item.
	 */
	public set(list: binaryen.ExpressionRef /* (ref $List) */, index: binaryen.ExpressionRef /* i32 */, value: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* void */ {
		return this.vm.mod.wasm.call('List.set', [list, index, value], binaryen.Type.none);
	}

	/**
	 * Delete a List item at the given index.
	 * The provided index must be non-negative and strictly less than the List’s count.
	 * Shifts all subsequent items to the front, and returns the deleted item.
	 * This method removes the item first, then reallocates if necessary.
	 */
	public delete(list: binaryen.ExpressionRef /* (ref $List) */, index: binaryen.ExpressionRef /* i32 */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('List.delete', [list, index], this.vm.reftype.Value);
	}

	/**
	 * Copy the items from a given source Tuple into the destination List.
	 */
	public copyFromTuple(dest: binaryen.ExpressionRef /* (ref $List) */, src: binaryen.ExpressionRef /* (ref $Tuple) */): binaryen.ExpressionRef /* void */ {
		return this.vm.mod.wasm.call('List.copy-from-tuple', [dest, src], binaryen.Type.none);
	}

	/**
	 * Copy the items from a given source List into the destination List.
	 */
	public copyFromList(dest: binaryen.ExpressionRef /* (ref $List) */, src: binaryen.ExpressionRef /* (ref $List) */): binaryen.ExpressionRef /* void */ {
		return this.vm.mod.wasm.call('List.copy-from-list', [dest, src], binaryen.Type.none);
	}

	/**
	 * Fill the destination List with items from the source Map (as a Set).
	 *
	 * NOTE: This method iterates over the Set in internal array order, and inserts them into the List in that order.
	 * The items in the resulting List do not necessarily appear in the same order as they were inserted into the Set.
	 * This may be surprising to programmers who expect the copy to preserve order;
	 * however, Set semantics explicitly state that programmers should not expect iteration to occur in any particular order.
	 */
	public fillFromSet(dest: binaryen.ExpressionRef /* (ref $List) */, src: binaryen.ExpressionRef /* (ref $Map) */): binaryen.ExpressionRef /* void */ {
		return this.vm.mod.wasm.call('List.fill-from-set', [dest, src], binaryen.Type.none);
	}
}

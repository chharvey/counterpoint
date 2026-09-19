import * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Struct field constant indices. */
const FIELD = {
	/** `$List.$size`     */ SIZE:     1,
	/** `$List.$internal` */ INTERNAL: 2,
} as const;



/** Precursor to the Counterpoint `List` class. */
export class List implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		const {reftype} = this.vm;
		return new Map<string, FuncImportData>([
			['List#count', {name: 'List.count', param: reftype.List, result: binaryen.i32}],
			['List#adjustCapacity', {
				name:   'List.adjust-capacity',
				param:  binaryen.createType([reftype.List, binaryen.i32]),
				result: binaryen.none,
			}],
			['List#get', {
				name:   'List.get',
				param:  binaryen.createType([reftype.List, binaryen.i32]),
				result: reftype.Value,
			}],
			['List#set', {
				name:   'List.set',
				param:  binaryen.createType([reftype.List, binaryen.i32, reftype.Value]),
				result: binaryen.none,
			}],
			['List#delete', {
				name:   'List.delete',
				param:  binaryen.createType([reftype.List, binaryen.i32]),
				result: reftype.Value,
			}],
		]);
	}


	public field(ref: binaryen.ExpressionRef /* (ref null $List) */): {
		/** @return `(struct.get $List $size     <ref>)` */ readonly size:     binaryen.ExpressionRef /* i32 */,
		/** @return `(struct.get $List $internal <ref>)` */ readonly internal: binaryen.ExpressionRef /* (ref $ListInternal) */,

		/** @return `(struct.set $List $size     <ref> <val>)` */ setSize    (val: binaryen.ExpressionRef /* i32 */):                 binaryen.ExpressionRef /* void */,
		/** @return `(struct.set $List $internal <ref> <val>)` */ setInternal(val: binaryen.ExpressionRef /* (ref $ListInternal) */): binaryen.ExpressionRef /* void */,
	} {
		const {mod: {wasm}, reftype} = this.vm;
		return {
			get size()     { return wasm.struct.get(FIELD.SIZE,     ref, binaryen.i32); },
			get internal() { return wasm.struct.get(FIELD.INTERNAL, ref, reftype.ListInternal); },

			setSize(val)     { return wasm.struct.set(FIELD.SIZE,     ref, val); },
			setInternal(val) { return wasm.struct.set(FIELD.INTERNAL, ref, val); },
		};
	}

	/**
	 * Returns the number of “live” elements in the List.
	 * Since lists are contiguously front-packed and contain no tombstones,
	 * this should always be equal to the List’s size.
	 */
	public count(list: binaryen.ExpressionRef /* (ref $List) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call('List.count', [list], binaryen.i32);
	}

	/**
	 * Reallocates a List’s internal array as needed, adjusting for size.
	 * The List’s items are copied over to the new array, preserving the order from the original array.
	 */
	public adjustCapacity(list: binaryen.ExpressionRef /* (ref $List) */, capacity: binaryen.ExpressionRef /* i32 */): binaryen.ExpressionRef /* void */ {
		return this.vm.mod.wasm.call('List.adjust-capacity', [list, capacity], binaryen.none);
	}

	/**
	 * Get a List item given an index.
	 * The provided index must be non-negative and strictly less than the List’s length
	 * (but may be greater than its count).
	 * If there is no item at the given index, Counterpoint’s `null` value is returned.
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
		return this.vm.mod.wasm.call('List.set', [list, index, value], binaryen.none);
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
}

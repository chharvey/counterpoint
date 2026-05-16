import * as binaryen from 'binaryen.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';



/** Struct field constant indices. */
const FIELD = {
	/** `$Dict.$size`     */ SIZE:     1,
	/** `$Dict.$internal` */ INTERNAL: 2,
} as const;



/** Precursor to the Counterpoint `Dict` class. */
export class Dict {
	public constructor(private readonly vm: VirtualMachine) {}

	public field(ref: binaryen.ExpressionRef /* (ref null $Dict) */): {
		/** @return `(struct.get $Dict $size     <ref>)` */ readonly size:     binaryen.ExpressionRef /* i32 */,
		/** @return `(struct.get $Dict $internal <ref>)` */ readonly internal: binaryen.ExpressionRef /* (ref $DictInternal) */,

		/** @return `(struct.set $Dict $size     <ref> <val>)` */ setSize    (val: binaryen.ExpressionRef /* i32 */):                 binaryen.ExpressionRef /* void */,
		/** @return `(struct.set $Dict $internal <ref> <val>)` */ setInternal(val: binaryen.ExpressionRef /* (ref $DictInternal) */): binaryen.ExpressionRef /* void */,
	} {
		const {mod, reftype} = this.vm;
		return {
			get size()     { return mod.struct.get(FIELD.SIZE,     ref, binaryen.i32); },
			get internal() { return mod.struct.get(FIELD.INTERNAL, ref, reftype.DictInternal); },

			setSize(val)     { return mod.struct.set(FIELD.SIZE,     ref, val); },
			setInternal(val) { return mod.struct.set(FIELD.INTERNAL, ref, val); },
		};
	}

	/**
	 * Returns the number of “live” elements in the Dict.
	 * “Live” elements are non-null, non-tombstone properties.
	 */
	public count(dict: binaryen.ExpressionRef /* (ref $Dict) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.call('Dict.count', [dict], binaryen.i32);
	}

	/**
	 * Find a Property in a Dict with the given key.
	 * If a Property with the key is found, returns the Property and its matching index.
	 * Else, returns a null Property or tombstone with the index that the key hashes to.
	 *
	 * Useful for get, set, and delete operations:
	 * - when getting:
	 * 	- if null or a “tombstone” is returned, no entry with the given key exists in the Dict
	 * 	- if a non-null, “live” Property is returned, its value is what you want
	 * - when setting:
	 * 	- if null is returned, it means you’re adding a new property; you should put the new entry at the returned index and increment the Dict’s size
	 * 	- if a “tombstone” or a non-null, “live” Property is returned, you should replace it with the new entry, but *do not* increment the Dict’s size
	 * - when deleting:
	 * 	- if null or a “tombstone” is returned, it means the key wasn’t found and the Dict was not mutated; *do not* change the Dict’s size
	 * 	- if a non-null, “live” Property is returned, it was deleted from the Dict and replaced with a tombstone; *do not* change the Dict’s size (as tombstones are still counted)
	 */
	public find(dict: binaryen.ExpressionRef /* (ref $Dict) */, key: binaryen.ExpressionRef /* i64 */): binaryen.ExpressionRef /* i32 (ref null $Property) */ {
		return this.vm.mod.call('Dict.find', [dict, key], binaryen.createType([binaryen.i32, this.vm.reftypeNull.Property]));
	}

	/**
	 * Reallocate a Dict’s internal array as needed, adjusting for size.
	 * Only the Dict’s “live” (non-tombstone) properties are copied over to the new array,
	 * according to the usual key hashing and linear probing technique, and its size and count are updated.
	 * There is no guarantee the entries’ positioning and/or order will be preserved.
	 */
	public adjustCapacity(dict: binaryen.ExpressionRef /* (ref $Dict) */, capacity: binaryen.ExpressionRef /* i32 */): binaryen.ExpressionRef /* void */ {
		return this.vm.mod.call('Dict.adjust-capacity', [dict, capacity], binaryen.none);
	}

	/**
	 * Set a Dict value given a key.
	 * This method first reallocates if necessary, then adds the value.
	 */
	public set(dict: binaryen.ExpressionRef /* (ref $Dict) */, key: binaryen.ExpressionRef /* i64 */, val: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* void */ {
		return this.vm.mod.call('Dict.set', [dict, key, val], binaryen.none);
	}

	/**
	 * Delete a Dict Property with the given key.
	 * If a Property with the given key exists, it is removed and its value is returned;
	 * otherwise null is returned and the Dict is not mutated.
	 * This method removes the Property first (if found), then reallocates if necessary.
	 */
	public delete(dict: binaryen.ExpressionRef /* (ref $Dict) */, key: binaryen.ExpressionRef /* i64 */): binaryen.ExpressionRef /* (ref null $Value) */ {
		return this.vm.mod.call('Dict.delete', [dict, key], this.vm.reftypeNull.Value);
	}
}

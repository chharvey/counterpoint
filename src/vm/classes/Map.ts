import * as binaryen from 'binaryen.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {
	FuncImportData,
	HasFuncData,
} from './HasFuncData.ts';



/** Struct field constant indices. */
const FIELD = {
	/** `$Map.$size`     */ SIZE:     1,
	/** `$Map.$internal` */ INTERNAL: 2,
} as const;



/** Precursor to the Counterpoint `Map` class. */
class VmMap implements HasFuncData {
	public constructor(private readonly vm: VirtualMachine) {}


	/** @implements HasFuncData */
	@memoizeGetter
	public get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
		const {reftype, reftypeNull} = this.vm;
		return new Map<string, FuncImportData>([
			['Map#count', {name: 'Map.count', param: reftype.Map, result: binaryen.i32}],
			['Map#find', {
				name:   'Map.find',
				param:  binaryen.createType([reftype.Map, reftype.Value]),
				result: binaryen.createType([binaryen.i32, reftypeNull.Case]),
			}],
			['Map#adjustCapacity', {
				name:   'Map.adjust-capacity',
				param:  binaryen.createType([reftype.Map, binaryen.i32]),
				result: binaryen.none,
			}],
			['Map#get', {
				name:   'Map.get',
				param:  binaryen.createType([reftype.Map, reftype.Value]),
				result: reftype.Value,
			}],
			['Map#set', {
				name:   'Map.set',
				param:  binaryen.createType([reftype.Map, reftype.Value, reftype.Value]),
				result: binaryen.none,
			}],
			['Map#delete', {
				name:   'Map.delete',
				param:  binaryen.createType([reftype.Map, reftype.Value]),
				result: reftypeNull.Value,
			}],
		]);
	}


	public field(ref: binaryen.ExpressionRef /* (ref null $Map) */): {
		/** @return `(struct.get $Map $size     <ref>)` */ readonly size:     binaryen.ExpressionRef /* i32 */,
		/** @return `(struct.get $Map $internal <ref>)` */ readonly internal: binaryen.ExpressionRef /* (ref $MapInternal) */,

		/** @return `(struct.set $Map $size     <ref> <val>)` */ setSize    (val: binaryen.ExpressionRef /* i32 */):                binaryen.ExpressionRef /* void */,
		/** @return `(struct.set $Map $internal <ref> <val>)` */ setInternal(val: binaryen.ExpressionRef /* (ref $MapInternal) */): binaryen.ExpressionRef /* void */,
	} {
		const {mod: {wasm}, reftype} = this.vm;
		return {
			get size()     { return wasm.struct.get(FIELD.SIZE,     ref, binaryen.i32); },
			get internal() { return wasm.struct.get(FIELD.INTERNAL, ref, reftype.MapInternal); },

			setSize(val)     { return wasm.struct.set(FIELD.SIZE,     ref, val); },
			setInternal(val) { return wasm.struct.set(FIELD.INTERNAL, ref, val); },
		};
	}

	/**
	 * Returns the number of “live” elements in the Map.
	 * “Live” elements are non-null, non-tombstone cases.
	 */
	public count(map: binaryen.ExpressionRef /* (ref $Map) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.wasm.call('Map.count', [map], binaryen.i32);
	}

	/**
	 *  Find a Case in a Map with the given antecedent.
	 *  If a Case with the ant is found, returns the Case and its matching index.
	 *  Else, returns a null Case or tombstone with the index that the ant hashes to.
	 *
	 *  Useful for get, set, and delete operations:
	 *  - when getting:
	 *  	- if null or a “tombstone” is returned, no entry with the given ant exists in the Map
	 *  	- if a non-null, “live” Case is returned, its consequent is what you want
	 *  - when setting:
	 *  	- if null is returned, it means you’re adding a new case; you should put the new entry at the returned index and increment the Map’s size
	 *  	- if a “tombstone” or a non-null, “live” Case is returned, you should replace it with the new entry, but *do not* increment the Map’s size
	 *  - when deleting:
	 *  	- if null or a “tombstone” is returned, it means the ant wasn’t found and the Map was not mutated; *do not* change the Map’s size
	 *  	- if a non-null, “live” Case is returned, it was deleted from the Map and replaced with a tombstone; *do not* change the Map’s size (as tombstones are still counted)
	 */
	public find(map: binaryen.ExpressionRef /* (ref $Map) */, ant: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* i32 (ref null $Case) */ {
		return this.vm.mod.wasm.call('Map.find', [map, ant], binaryen.createType([binaryen.i32, this.vm.reftypeNull.Case]));
	}

	/**
	 * Reallocate a Map’s internal array as needed, adjusting for size.
	 * Only the Map’s “live” (non-tombstone) cases are copied over to the new array,
	 * according to the usual key hashing and linear probing technique, and its size and count are updated.
	 * There is no guarantee the entries’ positioning and/or order will be preserved.
	 */
	public adjustCapacity(map: binaryen.ExpressionRef /* (ref $Map) */, capacity: binaryen.ExpressionRef /* i32 */): binaryen.ExpressionRef /* void */ {
		return this.vm.mod.wasm.call('Map.adjust-capacity', [map, capacity], binaryen.none);
	}

	/**
	 * Get a Map consequent given an antecedent.
	 * If there is no consequent at the given antecedent, Counterpoint’s `null` value is returned.
	 */
	public get(map: binaryen.ExpressionRef /* (ref $Map) */, ant: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.vm.mod.wasm.call('Map.get', [map, ant], this.vm.reftype.Value);
	}

	/**
	 * Set a Map consequent given an antecedent.
	 * This method first reallocates if necessary, then adds the consequent.
	 */
	public set(map: binaryen.ExpressionRef /* (ref $Map) */, ant: binaryen.ExpressionRef /* (ref $Value) */, con: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* void */ {
		return this.vm.mod.wasm.call('Map.set', [map, ant, con], binaryen.none);
	}

	/**
	 * Delete a Map Case with the given antecedent.
	 * If a Case with the given antecedent exists, it is removed and its consequent is returned;
	 * otherwise null is returned and the Map is not mutated.
	 * This method removes the Case first (if found), then reallocates if necessary.
	 */
	public delete(map: binaryen.ExpressionRef /* (ref $Map) */, ant: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref null $Value) */ {
		return this.vm.mod.wasm.call('Map.delete', [map, ant], this.vm.reftypeNull.Value);
	}
}
export {VmMap as Map};

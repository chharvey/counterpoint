import {defaultComparator} from './package.js';


/**
 * Deletes an entry from a Map if an “equivalent” key exists in it.
 * “Equivalence” is defined by the given comparator function.
 * @example
 * const my_map: Map<{id: number}, boolean> = new Map([[{id: 42}, true]]);
 * Map_deleteEq(my_map, {id: 42}, (a, b) => a.id === b.id);
 * assert.strictEqual(my_map.size, 0);
 * @typeparam K the type of keys in the map
 * @typeparam V the type of values in the map
 * @param map the map to delete from
 * @param key the key (or an equivalent one) to delete
 * @param comparator a function comparing keys in the map
 * @returns whether the delete occurred
 */
export function Map_deleteEq<K, V>(map: Map<K, V>, key: K, comparator: (a: K, b: K) => boolean = defaultComparator): boolean {
	const foundkey: K | undefined = [...map.keys()].find((k) => comparator.call(null, k, key));
	return map.delete((foundkey === void 0) ? key : foundkey);
}

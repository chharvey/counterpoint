import {defaultComparator} from '../-private.js';


/**
 * Determines whether a Map has the given key, or whether an “equivalent” key exists in it.
 * “Equivalence” is defined by the given comparator function.
 * @example
 * const my_map: Map<{id: number}, boolean> = new Map([[{id: 42}, true]]);
 * assert.ok(Map_hasEq(my_map, {id: 42}, (a, b) => a.id === b.id));
 * @typeparam K the type of keys in the map
 * @typeparam V the type of values in the map
 * @param map the map to check
 * @param key the key (or an equivalent one) to check
 * @param comparator a function comparing keys in the map
 * @returns whether the key or an equivalent one exists in the map
 */
export function Map_hasEq<K, V>(map: ReadonlyMap<K, V>, key: K, comparator: (a: K, b: K) => boolean = defaultComparator): boolean {
	return map.has(key) || [...map.keys()].some((k) => comparator.call(null, k, key));
}

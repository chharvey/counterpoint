import {defaultComparator} from './package.js';


/**
 * Gets the value of a key in a Map, or an “equivalent” key if one does not already exist in it.
 * “Equivalence” is defined by the given comparator function.
 * @example
 * const my_map: Map<{id: number}, boolean> = new Map([[{id: 42}, true]]);
 * assert.strictEqual(Map_getEq(my_map, {id: 42}, (a, b) => a.id === b.id), true);
 * @typeparam K the type of keys in the map
 * @typeparam V the type of values in the map
 * @param map the map to get from
 * @param key the key (or an equivalent one) whose value to get
 * @param comparator a function comparing keys in the map
 * @returns the value corresponding to the key
 */
export function Map_getEq<K, V>(map: ReadonlyMap<K, V>, key: K, comparator: (a: K, b: K) => boolean = defaultComparator): V | undefined {
	return map.get(key) || [...map].find(([k, _]) => comparator.call(null, k, key))?.[1];
}

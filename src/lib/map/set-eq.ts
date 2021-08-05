import {defaultComparator} from '../-private.js';


/**
 * Sets a value to a key in a Map, or an “equivalent” key if one does not already exist in it.
 * “Equivalence” is defined by the given comparator function.
 * @example
 * const my_map: Map<{id: number}, boolean> = new Map([[{id: 42}, true]]);
 * Map_setEq(my_map, {id: 42}, false, (a, b) => a.id === b.id);
 * assert.strictEqual(Map_getEq(my_map, {id: 42}, (a, b) => a.id === b.id), false);
 * @typeparam K the type of keys in the map
 * @typeparam V the type of values in the map
 * @param map the map to set to
 * @param key the key (or an equivalent one) whose value to set
 * @param comparator a function comparing keys in the map
 * @returns the map
 */
export function Map_setEq<K, V>(map: Map<K, V>, key: K, value: V, comparator: (a: K, b: K) => boolean = defaultComparator): Map<K, V> {
	const foundkey: K | undefined = [...map.keys()].find((k) => comparator.call(null, k, key));
	return map.set((foundkey === void 0) ? key : foundkey, value);
}

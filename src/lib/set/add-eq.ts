import {defaultComparator} from '../-private.js';


/**
 * Adds an element to a Set if an “equivalent” one does not already exist in it.
 * “Equivalence” is defined by the given comparator function.
 * @example
 * const my_set: Set<{id: number}> = new Set([{id: 42}]);
 * Set_addEq(my_set, {id: 42}, (a, b) => a.id === b.id);
 * assert.strictEqual(my_set.size, 1);
 * @typeparam T the type of elements in the set
 * @param set the set to add to
 * @param el the element (or an equivalent one) to add
 * @param comparator a function comparing elements in the set
 * @returns the set
 */
export function Set_addEq<T>(set: Set<T>, el: T, comparator: (a: T, b: T) => boolean = defaultComparator): Set<T> {
	const foundel: boolean = [...set].some((e) => comparator.call(null, e, el));
	return (!foundel) ? set.add(el): set;
}

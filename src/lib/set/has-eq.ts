import {defaultComparator} from './package.js';


/**
 * Determines whether a Set has the given element, or whether an “equivalent” element exists in it.
 * “Equivalence” is defined by the given comparator function.
 * @example
 * const my_set: Set<{id: number}> = new Set([{id: 42}]);
 * assert.ok(Set_hasEq(my_set, {id: 42}, (a, b) => a.id === b.id));
 * @typeparam T the type of elements in the set
 * @param set the set to check
 * @param el the element to check
 * @param comparator a function comparing elements in the set
 * @returns whether the element or an equivalent one exists in the set
 */
export function Set_hasEq<T>(set: ReadonlySet<T>, el: T, comparator: (a: T, b: T) => boolean = defaultComparator): boolean {
	return set.has(el) || [...set].some((e) => comparator.call(null, e, el));
}

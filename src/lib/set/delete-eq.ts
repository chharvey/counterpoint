import {defaultComparator} from '../-private.js';


/**
 * Deletes an element from a Set if an “equivalent” one exists in it.
 * “Equivalence” is defined by the given comparator function.
 * @example
 * const my_set: Set<{id: number}> = new Set([{id: 42}]);
 * Set_deleteEq(my_set, {id: 42}, (a, b) => a.id === b.id);
 * assert.strictEqual(my_set.size, 0);
 * @typeparam T the type of elements in the set
 * @param set the set to delete from
 * @param el the element (or an equivalent one) to delete
 * @param comparator a function comparing elements in the set
 * @returns whether the delete occurred
 */
export function Set_deleteEq<T>(set: Set<T>, el: T, comparator: (a: T, b: T) => boolean = defaultComparator): boolean {
	const foundel: T | undefined = [...set].find((e) => comparator.call(null, e, el));
	return set.delete((foundel === void 0) ? el : foundel);
}

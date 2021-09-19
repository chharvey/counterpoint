import {defaultComparator} from '../-private.js';
import {Set_addEq} from './add-eq.js';


/**
 * Return the union (disjunction) of two sets: the set of elements that are in either set (or both sets),
 * where elements are compared via the comparator function.
 * @see https://github.com/tc39/proposal-set-methods
 * @typeparam T - the type of elements in the `a`
 * @typeparam U - the type of elements in the `b`
 * @param a the first set
 * @param b the second set
 * @param comparator a function comparing elements in the set
 * @returns a new Set containing the elements present in either `a` or `b` (or both)
 */
export function Set_unionEq<T, U>(a: ReadonlySet<T>, b: ReadonlySet<U>, comparator: (a: T | U, b: T | U) => boolean = defaultComparator): Set<T | U> {
	const returned: Set<T | U> = new Set();
	[...a, ...b].forEach((el) => {
		Set_addEq(returned, el, comparator);
	});
	return returned;
}

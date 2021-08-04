import {defaultComparator} from '../-private.js';
import {
	Set_differenceEq,
	Set_intersectionEq,
	Set_unionEq,
} from './index.js';


/**
 * Return the symmetric difference (exclusive disjunction) of two sets: the set of elements either in one set, or in the other, but not both,
 * where elements are compared via the comparator function.
 *
 * Equivalent to:
 * - `difference( union(a,b) , intersection(a,b) )`
 * - `union( difference(a,b) , difference(b,a) )`
 * @see https://github.com/tc39/proposal-set-methods
 * @typeparam T - the type of elements in `a`
 * @typeparam U - the type of elements in `b`
 * @param a the first set
 * @param b the second set
 * @param comparator a function comparing elements in the set
 * @returns a new Set containing the elements present only in `a` or only in `b`, but not both
 */
export function Set_symmetricDifferenceEq<T, U>(a: ReadonlySet<T>, b: ReadonlySet<U>, comparator: (a: T | U, b: T | U) => boolean = defaultComparator): Set<T | U> {
	return Set_differenceEq(Set_unionEq(a, b, comparator), Set_intersectionEq(a, b, comparator), comparator);
}

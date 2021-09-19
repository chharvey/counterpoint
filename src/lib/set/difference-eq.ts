import {defaultComparator} from '../-private.js';
import {
	Set_addEq,
	Set_hasEq,
} from './index.js';


/**
 * Return the difference (nonimplication) of two sets: the set of elements in `a`, but not in `b`,
 * where elements are compared via the comparator function.
 * @see https://github.com/tc39/proposal-set-methods
 * @typeparam T - the type of elements in `a`
 * @typeparam U - the type of elements in `b`
 * @param a the first set
 * @param b the second set
 * @param comparator a function comparing elements in the set
 * @returns a new Set containing the elements present only in `a`
 */
export function Set_differenceEq<T, U = T>(a: ReadonlySet<T>, b: ReadonlySet<U>, comparator?: (a: T, b: T) => boolean): Set<T>;
export function Set_differenceEq<T>(a: ReadonlySet<T>, b: ReadonlySet<T>, comparator: (a: T, b: T) => boolean = defaultComparator): Set<T> {
	const returned: Set<T> = new Set();
	a.forEach((el) => {
		if (!Set_hasEq(b, el, comparator)) {
			Set_addEq(returned, el, comparator);
		}
	});
	return returned;
}

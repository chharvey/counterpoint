import {defaultComparator} from './package.js';
import {Set_hasEq} from './has-eq.js';
import {Set_addEq} from './add-eq.js';


/**
 * Return the intersection (conjunction) of two sets: the set of elements that are in both sets,
 * where elements are compared via the comparator function.
 * @see https://github.com/tc39/proposal-set-methods
 * @typeparam T - the type of elements in `a`
 * @typeparam U - the type of elements in `b`
 * @param a the first set
 * @param b the second set
 * @param comparator a function comparing elements in the set
 * @returns a new Set containing the elements present only in both `a` and `b`
 */
export function Set_intersectionEq<T, U>(a: ReadonlySet<T>, b: ReadonlySet<U>, comparator?: (a: T, b: T) => boolean): Set<T & U>;
export function Set_intersectionEq<T>(a: ReadonlySet<T>, b: ReadonlySet<T>, comparator: (a: T, b: T) => boolean = defaultComparator): Set<T> {
	const returned: Set<T> = new Set();
	[...a, ...b].forEach((el) => {
		if (Set_hasEq(a, el, comparator) && Set_hasEq(b, el, comparator)) {
			Set_addEq(returned, el, comparator);
		}
	});
	return returned;
}

import {
	Keys,
	Map_hasEq,
	Map_getEq,
	Map_setEq,
} from './package.js';
import {SolidObject} from './SolidObject.js';



/**
 * Known subclasses:
 * - CollectionIndexed
 * - CollectionKeyed
 * - SolidSet
 * - SolidMap
 */
export abstract class Collection extends SolidObject {
	private static readonly EQ_MEMO_COMPARATOR: (
		a: Keys<typeof Collection.EQ_MEMO>,
		b: Keys<typeof Collection.EQ_MEMO>,
	) => boolean = (a, b) => a[0].identical(b[0]) && a[1].identical(b[1]);

	private static readonly EQ_MEMO: Map<readonly [SolidObject, SolidObject], boolean> = new Map();

	protected static do_Equal<T extends Collection>(o1: T, o2: T, definition: () => boolean): boolean {
		const memokey: Keys<typeof Collection.EQ_MEMO> = [o1, o2];
		if (!Map_hasEq(Collection.EQ_MEMO, memokey, Collection.EQ_MEMO_COMPARATOR)) {
			Map_setEq(Collection.EQ_MEMO, memokey, false, Collection.EQ_MEMO_COMPARATOR); // use this assumption in the next step
			Map_setEq(Collection.EQ_MEMO, memokey, definition.call(null), Collection.EQ_MEMO_COMPARATOR);
		}
		return Map_getEq(Collection.EQ_MEMO, memokey, Collection.EQ_MEMO_COMPARATOR)!;
	}
}

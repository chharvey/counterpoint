import * as xjs from 'extrajs';
import type {Keys} from '../../lib/index.js';
import {Object as CPObject} from './Object.js';



/**
 * Known subclasses:
 * - CollectionIndexed
 * - CollectionKeyed
 * - Set
 * - Map
 */
export abstract class Collection extends CPObject {
	private static readonly EQ_MEMO_COMPARATOR: (
		a: Keys<typeof Collection.EQ_MEMO>,
		b: Keys<typeof Collection.EQ_MEMO>,
	) => boolean = (a, b) => a[0] === b[0] && a[1] === b[1]; // cannot test `.identical` for value objects without resulting in infinite recursion

	private static readonly EQ_MEMO = new Map<readonly [CPObject, CPObject], boolean>();

	protected static do_Equal<T extends Collection>(o1: T, o2: T, definition: () => boolean): boolean {
		const memokey: Keys<typeof Collection.EQ_MEMO> = [o1, o2];
		if (!xjs.Map.has(Collection.EQ_MEMO, memokey, Collection.EQ_MEMO_COMPARATOR)) {
			xjs.Map.set(Collection.EQ_MEMO, memokey, false, Collection.EQ_MEMO_COMPARATOR); // use this assumption in the next step
			xjs.Map.set(Collection.EQ_MEMO, memokey, definition.call(null), Collection.EQ_MEMO_COMPARATOR);
		}
		return xjs.Map.get(Collection.EQ_MEMO, memokey, Collection.EQ_MEMO_COMPARATOR)!;
	}
}

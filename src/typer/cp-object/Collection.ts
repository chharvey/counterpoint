import * as xjs from 'extrajs';
import type {
	INST,
	Keys,
	TYPE,
} from './package.js';
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
	) => boolean = (a, b) => a[0].identical(b[0]) && a[1].identical(b[1]);

	private static readonly EQ_MEMO = new Map<readonly [CPObject, CPObject], boolean>();

	protected static do_Equal<T extends Collection>(o1: T, o2: T, definition: () => boolean): boolean {
		const memokey: Keys<typeof Collection.EQ_MEMO> = [o1, o2];
		if (!xjs.Map.has(Collection.EQ_MEMO, memokey, Collection.EQ_MEMO_COMPARATOR)) {
			xjs.Map.set(Collection.EQ_MEMO, memokey, false, Collection.EQ_MEMO_COMPARATOR); // use this assumption in the next step
			xjs.Map.set(Collection.EQ_MEMO, memokey, definition.call(null), Collection.EQ_MEMO_COMPARATOR);
		}
		return xjs.Map.get(Collection.EQ_MEMO, memokey, Collection.EQ_MEMO_COMPARATOR)!;
	}


	public override build(): INST.InstructionConst {
		throw new Error('`Collection#build` not yet supported.');
	}

	/**
	 * Convert this Collection to a type.
	 * See method implementations for details.
	 * @return a compound type representing this CPObject
	 */
	public abstract toType(): TYPE.Type;
}

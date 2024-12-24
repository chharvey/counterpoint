import * as xjs from 'extrajs';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../../lib/index.js';
import {TYPE} from '../index.js';
import {languageValuesIdentical} from '../utils-private.js';
import type {Object as CPObject} from './Value.js';
import {CollectionIndexed} from './CollectionIndexed.js';



/**
 * A static ordered sequence of values.
 * @final
 */
export class Tuple<T extends CPObject = CPObject> extends CollectionIndexed<T> {
	@strictEqual
	@instanceOf(() => Tuple)
	@memoizeBinOp(true, true)
	public override identical(value: CPObject): boolean {
		return xjs.Array.is<CPObject>(this.items, (value as Tuple).items, languageValuesIdentical);
	}

	/**
	 * @inheritdoc
	 * Returns a TypeTuple whose entries are the types of this Tuple’s items.
	 */
	public override toType(): TYPE.TypeTuple {
		return TYPE.TypeTuple.fromTypes(this.items.map((it) => it.toType()));
	}
}

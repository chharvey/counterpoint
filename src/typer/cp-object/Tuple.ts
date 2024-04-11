import * as xjs from 'extrajs';
import {strictEqual} from '../../lib/index.js';
import {TYPE} from '../index.js';
import {languageValuesIdentical} from '../utils-private.js';
import {Object as CPObject} from './Object.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class Tuple<T extends CPObject = CPObject> extends CollectionIndexed<T> {
	@strictEqual
	@CPObject.memoizeIdentical
	public override identical(value: CPObject): boolean {
		return value instanceof Tuple && xjs.Array.is<CPObject>(this.items, (value as Tuple).items, languageValuesIdentical);
	}

	/**
	 * @inheritdoc
	 * Returns a TypeTuple whose entries are the types of this Tuple’s items.
	 */
	public override toType(): TYPE.TypeTuple {
		return TYPE.TypeTuple.fromTypes(this.items.map((it) => it.toType()));
	}
}

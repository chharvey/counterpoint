import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	build_tuple_like,
	type Builder,
} from '../../index.js';
import {
	strictEqual,
	instanceOf,
} from '../../lib/index.js';
import {TYPE} from '../index.js';
import {languageValuesIdentical} from '../utils-private.js';
import {Object as CPObject} from './Object.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class Tuple<T extends CPObject = CPObject> extends CollectionIndexed<T> {
	@strictEqual
	@instanceOf(Tuple)
	@CPObject.memoizeSameness
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

	public override build(builder: Builder): binaryen.ExpressionRef {
		return build_tuple_like<T>(
			this.items,
			builder,
			(value) => value.toType(),
			(value) => value.build(builder),
		);
	}
}

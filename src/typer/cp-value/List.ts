import type binaryen from 'binaryen';
import type {Builder} from '../../index.js';
import {TYPE} from '../index.js';
import type {Value} from './Value.js';
import {CollectionIndexed} from './CollectionIndexed.js';



/**
 * A dynamic ordered sequence of values.
 * @final
 */
export class List<T extends Value = Value> extends CollectionIndexed<T> {
	public override toString(): string {
		return `List.(${ super.toString() })`;
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.List whose invariant is the union of the types of this List’s items.
	 */
	public override toType(): TYPE.List {
		return new TYPE.List(TYPE.Union.all(this.items.map<TYPE.Type>((it) => it.toType())));
	}

	public override build(_: Builder): binaryen.ExpressionRef {
		throw new Error('`List#build` not yet supported.');
	}
}

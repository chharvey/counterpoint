import {TYPE} from '../index.ts';
import {
	language_values_equal,
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import {
	identical,
	type Value,
} from './Value.ts';
import {CollectionIndexed} from './CollectionIndexed.ts';



/**
 * A dynamic ordered sequence of values.
 * @final
 */
export class List<T extends Value = Value> extends CollectionIndexed<T> {
	public override readonly isReference = true;


	public override toString(): string {
		return `[${ super.toString() }]`;
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => List)
	public override equal(value: Value): boolean {
		return CollectionIndexed.samenessDfn<T>(this, value as List<T>, language_values_equal);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.List whose type argument is the union of the types of this List’s items.
	 */
	public override toType(): TYPE.List {
		return new TYPE.List(TYPE.Union.all(...this.items.map<TYPE.Type>((it) => it.toType())));
	}
}

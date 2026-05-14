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
import {CollectionKeyed} from './CollectionKeyed.ts';



/**
 * A dynamic structure of key–value pairs.
 * @final
 */
export class Dict<T extends Value = Value> extends CollectionKeyed<T> {
	public override toString(): string {
		return `[${ super.toString() }]`;
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => Dict)
	public override equal(value: Value): boolean {
		return CollectionKeyed.samenessDfn<T>(this, value as Dict<T>, language_values_equal);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Dict whose type argument is the union of the types of this Dict’s values.
	 */
	public override toType(): TYPE.Dict {
		return new TYPE.Dict(TYPE.Union.all(...[...this.properties.values()].map<TYPE.Type>((val) => val.toType())));
	}
}

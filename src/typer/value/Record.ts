import {TYPE} from '../index.ts';
import {
	language_values_identical,
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
 * A static structure of key–value pairs.
 * @final
 */
class ValueRecord<T extends Value = Value> extends CollectionKeyed<T> {
	public override get isReference(): boolean {
		return false;
	}


	public override toString(): string {
		return `(${ super.toString() })`;
	}

	@strictEqual
	@memoizeBinOp(true, true)
	@instanceOf(() => ValueRecord)
	public override identical(value: Value): boolean {
		return CollectionKeyed.samenessDfn<T>(this, value as ValueRecord<T>, language_values_identical);
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => ValueRecord)
	public override equal(value: Value): boolean {
		return CollectionKeyed.samenessDfn<T>(this, value as ValueRecord<T>, language_values_equal);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Record whose entries are the types of this ValueRecord’s values.
	 */
	public override toType(): TYPE.Record {
		return TYPE.Record.fromTypes(new Map([...this.properties].map<[bigint, TYPE.Type]>(([key, val]) => [key, val.toType()])));
	}
}
export {ValueRecord as Record};

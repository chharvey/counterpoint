import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../../lib/index.js';
import {TYPE} from '../index.js';
import type {Value} from './Value.js';
import {CollectionKeyed} from './CollectionKeyed.js';



/**
 * A static structure of key–value pairs.
 * @final
 */
class ValueRecord<T extends Value = Value> extends CollectionKeyed<T> {
	@strictEqual
	@instanceOf(() => ValueRecord)
	@memoizeBinOp(true, true)
	public override identical(value: Value): boolean {
		return (
			this.properties.size === (value as ValueRecord).properties.size &&
			[...(value as ValueRecord).properties].every(([thatkey, thatvalue]) => !!this.properties.get(thatkey)?.identical(thatvalue))
		);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Record whose entries are the types of this ValueRecord’s values.
	 */
	public override toType(): TYPE.Record {
		return TYPE.Record.fromTypes(new Map([...this.properties].map(([key, val]) => [key, val.toType()])));
	}
}
export {ValueRecord as Record};

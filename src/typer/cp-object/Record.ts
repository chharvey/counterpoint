import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../../lib/index.js';
import {TYPE} from '../index.js';
import type {Object as CPObject} from './Value.js';
import {CollectionKeyed} from './CollectionKeyed.js';



/**
 * A static structure of key–value pairs.
 * @final
 */
export class Record<T extends CPObject = CPObject> extends CollectionKeyed<T> {
	@strictEqual
	@instanceOf(() => Record)
	@memoizeBinOp(true, true)
	public override identical(value: CPObject): boolean {
		return (
			this.properties.size === (value as Record).properties.size &&
			[...(value as Record).properties].every(([thatkey, thatvalue]) => !!this.properties.get(thatkey)?.identical(thatvalue))
		);
	}

	/**
	 * @inheritdoc
	 * Returns a TypeRecord whose entries are the types of this Record’s values.
	 */
	public override toType(): TYPE.TypeRecord {
		return TYPE.TypeRecord.fromTypes(new Map([...this.properties].map(([key, val]) => [key, val.toType()])));
	}
}

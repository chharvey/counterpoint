import {strictEqual} from '../../lib/index.js';
import {TYPE} from '../index.js';
import type {Object as CPObject} from './Object.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class Record<T extends CPObject = CPObject> extends CollectionKeyed<T> {
	@strictEqual
	public override identical(value: CPObject): boolean {
		return (
			   value instanceof Record
			&& this.properties.size === value.properties.size
			&& this.isIdenticalTo(value as this, (this_, that_) => (
				[...that_.properties].every(([thatkey, thatvalue]) => !!this_.properties.get(thatkey)?.identical(thatvalue))
			))
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

import {strictEqual} from '../../lib/index.js';
import {TYPE} from '../index.js';
import {Object as CPObject} from './Object.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class Record<T extends CPObject = CPObject> extends CollectionKeyed<T> {
	@strictEqual
	@CPObject.memoizeSameness
	public override identical(value: CPObject): boolean {
		return (
			   value instanceof Record
			&& this.properties.size === value.properties.size
			&& [...(value as Record).properties].every(([thatkey, thatvalue]) => !!this.properties.get(thatkey)?.identical(thatvalue))
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

import {strictEqual} from '../../lib/index.js';
import {TYPE} from '../index.js';
import type {Object as CPObject} from './Object.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class Struct<T extends CPObject = CPObject> extends CollectionKeyed<T> {
	public override toString(): string {
		return `\\${ super.toString() }`;
	}

	@strictEqual
	public override identical(value: CPObject): boolean {
		return (
			   value instanceof Struct
			&& this.properties.size === value.properties.size
			&& this.isIdenticalTo(value as this, (this_, that_) => (
				[...that_.properties].every(([thatkey, thatvalue]) => !!this_.properties.get(thatkey)?.identical(thatvalue))
			))
		);
	}

	/**
	 * @inheritdoc
	 * Returns a TypeStruct whose entries are the types of this Struct’s values.
	 */
	public override toType(): TYPE.TypeStruct {
		return TYPE.TypeStruct.fromTypes(new Map([...this.properties].map(([key, val]) => [key, val.toType()])));
	}
}

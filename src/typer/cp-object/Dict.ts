import {TYPE} from '../index.js';
import type {Object as CPObject} from './Object.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class Dict<T extends CPObject = CPObject> extends CollectionKeyed<T> {
	public override toString(): string {
		return `Dict.(${ super.toString() })`;
	}

	/**
	 * @inheritdoc
	 * Returns a TypeDict whose invariant is the union of the types of this Dict’s values.
	 */
	public override toType(): TYPE.TypeDict {
		return new TYPE.TypeDict(TYPE.Type.unionAll([...this.properties.values()].map<TYPE.Type>((val) => val.toType())));
	}
}

import {TYPE} from '../index.js';
import type {Object as CPObject} from './Value.js';
import {CollectionKeyed} from './CollectionKeyed.js';



/**
 * A dynamic structure of key–value pairs.
 * @final
 */
export class Dict<T extends CPObject = CPObject> extends CollectionKeyed<T> {
	public override toString(): string {
		return `Dict.(${ super.toString() })`;
	}

	/**
	 * @inheritdoc
	 * Returns a TypeDict whose invariant is the union of the types of this Dict’s values.
	 */
	public override toType(): TYPE.TypeDict {
		return new TYPE.TypeDict(TYPE.TypeUnion.all([...this.properties.values()].map<TYPE.Type>((val) => val.toType())));
	}
}

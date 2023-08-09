import {TYPE} from '../index.js';
import type {Object as CPObject} from './Object.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class Record<T extends CPObject = CPObject> extends CollectionKeyed<T> {
	/**
	 * @inheritdoc
	 * Returns a TypeStruct whose entries are the types of this Record’s values.
	 */
	public override toType(): TYPE.TypeStruct {
		return TYPE.TypeStruct.fromTypes(new Map([...this.properties].map(([key, val]) => [key, val.toType()])));
	}
}

import {TYPE} from './package.js';
import type {Object as CPObject} from './Object.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class Record<T extends CPObject = CPObject> extends CollectionKeyed<T> {
	/**
	 * @inheritdoc
	 * Returns a TypeRecord whose entries are the types of this Record’s values.
	 */
	public override toType(): TYPE.TypeRecord {
		return TYPE.TypeRecord.fromTypes(new Map([...this.properties].map(([key, val]) => [key, val.toType()])));
	}
}

import {TYPE} from './package.js';
import type {Object} from './Object.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class Record<T extends Object = Object> extends CollectionKeyed<T> {
	override toType(): TYPE.TypeRecord {
		return TYPE.TypeRecord.fromTypes(new Map([...this.properties].map(([key, value]) => [key, new TYPE.TypeUnit<T>(value)])));
	}
}

import {
	TypeUnit,
	TypeRecord,
} from './package.js';
import type {Object} from './Object.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class Record<T extends Object = Object> extends CollectionKeyed<T> {
	override toType(): TypeRecord {
		return TypeRecord.fromTypes(new Map([...this.properties].map(([key, value]) => [key, new TypeUnit<T>(value)])));
	}
}

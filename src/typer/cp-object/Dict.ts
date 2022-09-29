import {
	Type,
	TypeUnit,
	TypeDict,
} from './package.js';
import type {Object as CPObject} from './Object.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class Dict<T extends CPObject = CPObject> extends CollectionKeyed<T> {
	override toString(): string {
		return `Dict.(${ super.toString() })`;
	}

	override toType(): TypeDict {
		return new TypeDict(Type.unionAll([...this.properties.values()].map<Type>((value) => new TypeUnit(value))));
	}
}

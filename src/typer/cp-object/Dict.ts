import {
	Type,
	TypeUnit,
	TypeDict,
} from './package.js';
import type {Object} from './Object.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class Dict<T extends Object = Object> extends CollectionKeyed<T> {
	override toString(): string {
		return `Dict.(${ super.toString() })`;
	}

	override toType(): TypeDict {
		return new TypeDict(
			(this.properties.size)
				? Type.unionAll([...this.properties.values()].map<Type>((value) => new TypeUnit(value)))
				: Type.NEVER,
		);
	}
}

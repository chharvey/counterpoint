import {TYPE} from './package.js';
import type {Object} from './Object.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class Dict<T extends Object = Object> extends CollectionKeyed<T> {
	override toString(): string {
		return `Dict.(${ super.toString() })`;
	}
	override toType(): TYPE.TypeDict {
		return new TYPE.TypeDict(
			(this.properties.size)
				? TYPE.Type.unionAll([...this.properties.values()].map<TYPE.Type>((value) => new TYPE.TypeUnit<T>(value)))
				: TYPE.NEVER,
		);
	}
}

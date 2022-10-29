import {TYPE} from './package.js';
import type {Object} from './Object.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class List<T extends Object = Object> extends CollectionIndexed<T> {
	override toString(): string {
		return `List.(${ super.toString() })`;
	}
	override toType(): TYPE.TypeList {
		return new TYPE.TypeList(
			(this.items.length)
				? TYPE.Type.unionAll(this.items.map<TYPE.Type>((el) => new TYPE.TypeUnit<T>(el)))
				: TYPE.Type.NEVER,
		);
	}
}

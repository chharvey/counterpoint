import {
	Type,
	TypeUnit,
	TypeList,
} from './package.js';
import type {Object} from './Object.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class List<T extends Object = Object> extends CollectionIndexed<T> {
	override toString(): string {
		return `List.(${ super.toString() })`;
	}
	override toType(): TypeList {
		return new TypeList(
			(this.items.length)
				? Type.unionAll(this.items.map<Type>((el) => new TypeUnit<T>(el)))
				: Type.NEVER,
		);
	}
}

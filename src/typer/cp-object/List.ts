import {
	Type,
	TypeUnit,
	TypeList,
} from './package.js';
import type {Object as CPObject} from './Object.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class List<T extends CPObject = CPObject> extends CollectionIndexed<T> {
	override toString(): string {
		return `List.(${ super.toString() })`;
	}

	override toType(): TypeList {
		return new TypeList(Type.unionAll(this.items.map<Type>((el) => new TypeUnit(el))));
	}
}

import {
	Type,
	TypeUnit,
	TypeList,
} from './package.js';
import type {SolidObject} from './SolidObject.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class SolidList<T extends SolidObject = SolidObject> extends CollectionIndexed<T> {
	override toString(): string {
		return `List.(${ super.toString() })`;
	}
	override toType(): TypeList {
		return new TypeList(
			(this.items.length)
				? Type.unionAll(this.items.map<Type>((el) => new TypeUnit(el)))
				: Type.NEVER,
		);
	}
}

import {
	Type,
	TypeUnit,
	TypeDict,
} from './package.js';
import type {SolidObject} from './SolidObject.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class SolidDict<T extends SolidObject = SolidObject> extends CollectionKeyed<T> {
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

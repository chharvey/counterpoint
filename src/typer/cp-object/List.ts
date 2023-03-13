import {
	Type,
	TypeList,
} from './package.js';
import type {Object as CPObject} from './Object.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class List<T extends CPObject = CPObject> extends CollectionIndexed<T> {
	public override toString(): string {
		return `List.(${ super.toString() })`;
	}

	public override toType(): TypeList {
		return new TypeList(Type.unionAll(this.items.map<Type>((it) => it.toType())));
	}
}

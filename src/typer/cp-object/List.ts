import {TYPE} from './package.js';
import type {Object as CPObject} from './Object.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class List<T extends CPObject = CPObject> extends CollectionIndexed<T> {
	public override toString(): string {
		return `List.(${ super.toString() })`;
	}

	/**
	 * @inheritdoc
	 * Returns a TypeList whose invariant is the union of the types of this List’s items.
	 */
	public override toType(): TYPE.TypeList {
		return new TYPE.TypeList(TYPE.Type.unionAll(this.items.map<TYPE.Type>((el) => new TYPE.TypeUnit<T>(el))));
	}
}

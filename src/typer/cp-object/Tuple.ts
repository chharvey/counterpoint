import {TYPE} from '../index.js';
import type {Object as CPObject} from './Object.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class Tuple<T extends CPObject = CPObject> extends CollectionIndexed<T> {
	/**
	 * @inheritdoc
	 * Returns a TypeVect whose entries are the types of this Tuple’s items.
	 */
	public override toType(): TYPE.TypeVect {
		return TYPE.TypeVect.fromTypes(this.items.map((it) => it.toType()));
	}
}

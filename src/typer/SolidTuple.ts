import {SolidTypeTuple} from './SolidTypeTuple.js';
import type {SolidObject} from './SolidObject.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class SolidTuple<T extends SolidObject = SolidObject> extends CollectionIndexed<T> {
	override toType(): SolidTypeTuple {
		return SolidTypeTuple.fromTypes(this.items.map((it) => it.toType()));
	}
}

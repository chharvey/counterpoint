import {
	SolidTypeUnit,
	SolidTypeTuple,
} from './cp-type/index.js';
import type {SolidObject} from './SolidObject.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class SolidTuple<T extends SolidObject = SolidObject> extends CollectionIndexed<T> {
	override toType(): SolidTypeTuple {
		return SolidTypeTuple.fromTypes(this.items.map((it) => new SolidTypeUnit(it)));
	}
}

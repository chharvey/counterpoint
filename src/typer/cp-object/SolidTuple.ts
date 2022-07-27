import {
	TypeUnit,
	TypeTuple,
} from './package.js';
import type {SolidObject} from './SolidObject.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class SolidTuple<T extends SolidObject = SolidObject> extends CollectionIndexed<T> {
	override toType(): TypeTuple {
		return TypeTuple.fromTypes(this.items.map((it) => new TypeUnit(it)));
	}
}

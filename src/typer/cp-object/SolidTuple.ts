import {
	TypeUnit,
	TypeTuple,
} from './package.js';
import type {Object} from './Object.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class SolidTuple<T extends Object = Object> extends CollectionIndexed<T> {
	override toType(): TypeTuple {
		return TypeTuple.fromTypes(this.items.map((it) => new TypeUnit(it)));
	}
}

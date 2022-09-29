import {
	TypeUnit,
	TypeTuple,
} from './package.js';
import type {Object as CPObject} from './Object.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class Tuple<T extends CPObject = CPObject> extends CollectionIndexed<T> {
	override toType(): TypeTuple {
		return TypeTuple.fromTypes(this.items.map((it) => new TypeUnit(it)));
	}
}

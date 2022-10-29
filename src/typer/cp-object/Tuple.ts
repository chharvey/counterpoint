import {TYPE} from './package.js';
import type {Object} from './Object.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class Tuple<T extends Object = Object> extends CollectionIndexed<T> {
	override toType(): TYPE.TypeTuple {
		return TYPE.TypeTuple.fromTypes(this.items.map((it) => new TYPE.TypeUnit<T>(it)));
	}
}

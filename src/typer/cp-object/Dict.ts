import {TYPE} from './package.js';
import type {Object as CPObject} from './Object.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class Dict<T extends CPObject = CPObject> extends CollectionKeyed<T> {
	public override toString(): string {
		return `Dict.(${ super.toString() })`;
	}

	public override toType(): TYPE.TypeDict {
		return new TYPE.TypeDict(TYPE.Type.unionAll([...this.properties.values()].map<TYPE.Type>((value) => new TYPE.TypeUnit<T>(value))));
	}
}

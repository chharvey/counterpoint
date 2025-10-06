import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {TYPE} from '../index.ts';
import type {Value} from './Value.ts';
import {CollectionKeyed} from './CollectionKeyed.ts';



/**
 * A dynamic structure of key–value pairs.
 * @final
 */
export class Dict<T extends Value = Value> extends CollectionKeyed<T> {
	public override toString(): string {
		return `Dict.(${ super.toString() })`;
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Dict whose type argument is the union of the types of this Dict’s values.
	 */
	public override toType(): TYPE.Dict {
		return new TYPE.Dict(TYPE.Union.all([...this.properties.values()].map<TYPE.Type>((val) => val.toType())));
	}

	public override build(_: Builder): binaryen.ExpressionRef {
		throw new Error('`Dict#build` not yet supported.');
	}
}

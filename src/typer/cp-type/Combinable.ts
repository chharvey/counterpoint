import type * as VALUE from '../cp-value/index.js';
import {Type} from './Type.js';



export type ReadonlyArrayOfAtLeast2<T> = readonly [T, T, ...readonly T[]];



/**
 * Known subclasses:
 * - TypeIntersection
 * - TypeUnion
 */
export abstract class Combinable extends Type {
	/**
	 * Construct a new Combinable object.
	 * @param values the values assignable to this type
	 */
	public constructor(
		values: ReadonlySet<VALUE.Value>,
		public readonly operands: ReadonlyArrayOfAtLeast2<Type>,
	) {
		super(false, values);
	}


	public abstract normalize(): Type;

	public abstract denormalize(): Type;

	public abstract combineTuplesOrRecords(): Type;
}

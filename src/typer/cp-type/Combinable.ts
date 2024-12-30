import type * as VALUE from '../cp-value/index.js';
import type {ReadonlyArrayOfAtLeast2} from './utils-private.js';
import {Type} from './Type.js';



/**
 * Known subclasses:
 * - Intersection
 * - Union
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

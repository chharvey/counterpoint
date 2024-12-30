import type * as VALUE from '../cp-value/index.js';
import type {ReadonlyArrayOfAtLeast2} from './utils-private.js';
import {Type} from './Type.js';



/**
 * Known subclasses:
 * - Combinable
 * - Difference
 */
export abstract class TypeOperation extends Type {
	/**
	 * Construct a new TypeOperation object.
	 * @param values   the values assignable to this type
	 * @param operands the operands of this operation
	 */
	public constructor(
		values: ReadonlySet<VALUE.Value>,
		public readonly operands: ReadonlyArrayOfAtLeast2<Type>,
	) {
		super(false, values);
	}
}

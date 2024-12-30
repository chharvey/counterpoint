import {assert_context_name} from '../../lib/index.js';
import type * as VALUE from '../cp-value/index.js';
import {
	NEVER,
	UNKNOWN,
} from './index.js';
import type {ReadonlyArrayOfAtLeast2} from './utils-private.js';
import {Type} from './Type.js';



/**
 * Decorator for some overrides of {@link Type#toString}.
 * Contains some special cases of string representations.
 * @implements MethodDecorator<Type, Type['toString']>
 */
export function botOrTopString(
	method:  Type['toString'],
	context: ClassMethodDecoratorContext<Type, typeof method>,
): typeof method {
	assert_context_name(context, 'toString');
	return function (this: Type) {
		return (
			this.isBottomType ? NEVER  .toString() :
			this.isTopType    ? UNKNOWN.toString() :
			method.call(this)
		);
	};
}



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

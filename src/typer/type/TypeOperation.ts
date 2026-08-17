import {assert_context_name} from '../../lib/index.ts';
import type * as VALUE from '../value/index.ts';
import {
	NOTHING,
	ANYTHING,
} from './index.ts';
import type {ArrayOfAtLeast2} from './utils-private.ts';
import {Type} from './Type.ts';



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
			this.isBottomType ? NOTHING .toString() :
			this.isTopType    ? ANYTHING.toString() :
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
	public readonly operands: readonly Type[];


	/**
	 * Construct a new TypeOperation object.
	 * @param values   the values assignable to this type
	 * @param operands the operands of this operation
	 */
	public constructor(
		values:     ReadonlySet<VALUE.Value>,
		operands:   Readonly<ArrayOfAtLeast2<Type>>,
		is_mutable: boolean,
	) {
		super(values, is_mutable);
		this.operands = operands;
	}
}

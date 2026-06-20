import {assert_context_name} from '../../lib/index.ts';
import {OBJ} from './index.ts';
import {Type} from './Type.ts';



/**
 * Decorator for {@link Type#isSubtypeOf} method and any overrides for reference types.
 * Short-circuits when the argument is equal (via type equality) to the Counterpoint `Object` type.
 * @implements MethodDecorator<Type, Type['isSubtypeOf']>
 */
export function isObjectType(
	method:  Type['isSubtypeOf'],
	context: ClassMethodDecoratorContext<Type, typeof method>,
): typeof method {
	assert_context_name(context, 'isSubtypeOf');
	return function (this: Type, t) {
		return t.equals(OBJ) || method.call(this, t);
	};
}



/**
 * Parent class for reference types (types of objects that are passed by reference).
 * Known subclasses:
 * - Anything
 * - TypeObject
 * - List
 * - Dict
 * - TypeSet
 * - TypeMap
 * - TypeFunction
 */
export abstract class ReferenceType extends Type {
	/** @final */
	public override get isReference(): boolean {
		return true;
	}
}

import type {Object as CPObject} from './index.js';



/**
 * Decorator for {@link CPObject#equal} method and any overrides.
 * Performs the Equality algorithm — returns whether two CPObjects (Counterpoint Language Values)
 * are equal by some definition.
 * @implements MethodDecorator<CPObject, CPObject['equal']>
 */
export function equalsDeco(
	method:   CPObject['equal'],
	_context: ClassMethodDecoratorContext<CPObject, typeof method>,
): typeof method {
	return function (this: CPObject, value) {
		return this.identical(value) || method.call(this, value);
	};
}

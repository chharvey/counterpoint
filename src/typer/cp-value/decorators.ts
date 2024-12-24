import type {Value} from './index.js';



/**
 * Decorator for {@link Value#equal} method and any overrides.
 * Performs the Equality algorithm — returns whether two Values (Counterpoint Language Values)
 * are equal by some definition.
 * @implements MethodDecorator<Value, Value['equal']>
 */
export function equalsDeco(
	method:   Value['equal'],
	_context: ClassMethodDecoratorContext<Value, typeof method>,
): typeof method {
	return function (this: Value, value) {
		return this.identical(value) || method.call(this, value);
	};
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The type for instance method decorators.
 * @typeparam This    the `this` ‘parameter’ of the instance method
 * @typeparam Value   the type of the decorated value — in this case, the instance method
 * @param     method  the method to decorate
 * @param     context a standard `ClassMethodDecoratorContext` object
 * @returns           a new value that is the result of decorating `method`
 */
export type MethodDecorator<
	This                                            = any,
	Value extends (this: This, ...args: any) => any = (this: This, ...args: any) => any,
> = (
	method:  Value,
	context: ClassMethodDecoratorContext<This, Value>,
) => typeof method;



/**
 * The type for instance getter decorators.
 * @typeparam This    the `this` ‘parameter’ of the instance getter
 * @typeparam Value   the type of the decorated value — in this case, the instance getter
 * @param     getter  the getter to decorate
 * @param     context a standard `ClassGetterDecoratorContext` object
 * @returns           a new value that is the result of decorating `getter`
 */
export type GetterDecorator<
	This  = any,
	Value = any,
> = (
	getter:  (this: This) => Value,
	context: ClassGetterDecoratorContext<This, Value>,
) => typeof getter;



/**
 * The type for instance setter decorators.
 * @typeparam This    the `this` ‘parameter’ of the instance setter
 * @typeparam Value   the type of the decorated value — in this case, the instance setter
 * @param     setter  the setter to decorate
 * @param     context a standard `ClassSetterDecoratorContext` object
 * @returns           a new value that is the result of decorating `setter`
 */
export type SetterDecorator<
	This  = any,
	Value = any,
> = (
	setter:  (this: This, value: Value) => void,
	context: ClassSetterDecoratorContext<This, Value>,
) => typeof setter;
/* eslint-enable @typescript-eslint/no-explicit-any */



/**
 * Decorator for memoizing properties.
 * When getting a property, check whether it exists in the “database”.
 * If it does, return that value.
 * If it doen’t, compute the value, store it in the database, and then return it.
 * @implements MethodDecorator<object, (this: object, ...args: Params) => Return>
 * @typeparam Params      the method’s parameter types
 * @typeparam Return      the method’s return type
 */
export function memoizeMethod<Params extends unknown[], Return>(
	method:   (this: object, ...args: Params) => Return,
	_context: ClassMethodDecoratorContext<object, typeof method>,
): typeof method {
	const memomap = new WeakMap<object, Return>();
	return function (...args) {
		memomap.has(this) || memomap.set(this, method.call(this, ...args));
		return memomap.get(this)!;
	};
}



/**
 * Like {@link memoizeMethod} but for getters.
 * @implements GetterDecorator<object, Return>
 * @typeparam Return      the getter’s return type
 */
export function memoizeGetter<Return>(
	getter:   (this: object) => Return,
	_context: ClassGetterDecoratorContext<object, Return>,
): typeof getter {
	const memomap = new WeakMap<object, Return>();
	return function () {
		memomap.has(this) || memomap.set(this, getter.call(this));
		return memomap.get(this)!;
	};
}



/**
 * Decorator for run-once methods.
 * The first time the method is called, it should execute; any time after that, it should not.
 * Should only be used on methods that return `void`; for non-void methods, use {@link memoizeMethod}.
 * @implements MethodDecorator<object, (this: object, ...args: Params) => void>
 * @typeparam Params      the method’s parameter types
 */
export function runOnceMethod<Params extends unknown[]>(
	method:   (this: object, ...args: Params) => void,
	_context: ClassMethodDecoratorContext<object, typeof method>,
): typeof method {
	const memoset = new WeakSet();
	return function (...args) {
		if (!memoset.has(this)) {
			memoset.add(this);
			return method.call(this, ...args);
		}
	};
}



/**
 * Like {@link runOnceMethod} but for setters.
 * @implements SetterDecorator<object, Param>
 * @typeparam Param       the setter’s parameter type
 */
export function runOnceSetter<Param>(
	setter:   (this: object, value: Param) => void,
	_context: ClassSetterDecoratorContext<object, Param>,
): typeof setter {
	const memoset = new WeakSet();
	return function (arg) {
		if (!memoset.has(this)) {
			memoset.add(this);
			return setter.call(this, arg);
		}
	};
}



/**
 * Decorator for performing strict equality (`===`), and then disjuncting (`||`) that result
 * with the results of performing the method.
 * @implements MethodDecorator<Proto, (this: Proto, that: Proto, ...args: Params) => boolean>
 * @typeparam Proto       the type of the prototype
 * @typeparam Params      the method’s parameter types
 */
export function strictEqual<Proto extends object, Params extends unknown[]>(
	method:   (this: Proto, that: Proto, ...args: Params) => boolean,
	_context: ClassMethodDecoratorContext<Proto, typeof method>,
): typeof method {
	return function (that, ...args) {
		return this === that || method.call(this, that, ...args);
	};
}

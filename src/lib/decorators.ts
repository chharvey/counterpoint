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
	This                                              = any,
	Value extends (this: This, ...args: any[]) => any = (this: This, ...args: any[]) => any,
> = (
	method:  Value,
	context: ClassMethodDecoratorContext<This, Value>,
) => (typeof method) | void; // eslint-disable-line @typescript-eslint/no-invalid-void-type --- TC39 allows a method decorator function to return `void` — in that case it will preserve the original method



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
) => (typeof getter) | void; // eslint-disable-line @typescript-eslint/no-invalid-void-type --- TC39 allows a getter decorator function to return `void` — in that case it will preserve the original getter



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
) => (typeof setter) | void; // eslint-disable-line @typescript-eslint/no-invalid-void-type --- TC39 allows a setter decorator function to return `void` — in that case it will preserve the original setter
/* eslint-enable @typescript-eslint/no-explicit-any */



/**
 * Cancels a method decorator.
 *
 * Apply this to a decorator function to cancel it out, equivalent to removing the decorator from the method.
 * The decorator argument is not even applied to the method at class evaluation time.
 *
 * Why use this instead of just removing the decorator?
 * Sometimes a family of methods all have a decorator applied.
 * This is often the case for methods inherited from a superclass or methods that implement an interface.
 * When we have an exception that doesn’t need the decorator, its absence might seem like a bug or an oversight.
 * By explicitly applying `@noopMethod(decorator)` to the method, it tells programmers,
 * “Normally we would use `@decorator` here, but for a specific reason we decided to leave it off.”
 *
 * @typeparam ProtoThis the method’s `this` type
 * @typeparam Params    the method’s parameter types
 * @typeparam Return    the method’s return type
 * @param _decorator a decorator to cancel
 * @return           a new decorator that voids the argument
 */
export function noopMethod<ProtoThis extends object, Params extends unknown[], Return>(_decorator: MethodDecorator<ProtoThis, (this: ProtoThis, ...args: Params) => Return>): typeof _decorator {
	return (_method, _context) => undefined;
}



/**
 * Cancels a getter decorator. Similar to {@link noopMethod} but for getters.
 * @typeparam ProtoThis   the getter’s `this` type
 * @typeparam Return      the getter’s return type
 * @param _decorator a decorator to cancel
 * @return           a new decorator that voids the argument
 */
export function noopGetter<ProtoThis extends object, Return>(_decorator: GetterDecorator<ProtoThis, Return>): typeof _decorator {
	return (_getter, _context) => undefined;
}



/**
 * Cancels a getter decorator. Similar to {@link noopMethod} but for setters.
 * @typeparam ProtoThis   the setter’s `this` type
 * @typeparam Param       the setter’s parameter type
 * @param _decorator a decorator to cancel
 * @return           a new decorator that voids the argument
 */
export function noopSetter<ProtoThis extends object, Param>(_decorator: SetterDecorator<ProtoThis, Param>): typeof _decorator {
	return (_getter, _context) => undefined;
}



/**
 * Decorator for memoizing properties.
 * When getting a property, check whether it exists in the “database”.
 * If it does, return that value.
 * If it doen’t, compute the value, store it in the database, and then return it.
 * @implements MethodDecorator<ProtoThis, (this: ProtoThis, ...args: Params) => Return>
 * @typeparam ProtoThis   the method’s `this` type
 * @typeparam Params      the method’s parameter types
 * @typeparam Return      the method’s return type
 */
export function memoizeMethod<ProtoThis extends object, Params extends unknown[], Return>(
	method:   (this: ProtoThis, ...args: Params) => Return,
	_context: ClassMethodDecoratorContext<ProtoThis, typeof method>,
): typeof method {
	const memomap = new WeakMap<ProtoThis, Return>();
	return function (...args) {
		// TODO: Map#getOrInsertComputed
		memomap.has(this) || memomap.set(this, method.call(this, ...args));
		return memomap.get(this)!;
	};
}



/**
 * Like {@link memoizeMethod} but for getters.
 * @implements GetterDecorator<ProtoThis, Return>
 * @typeparam ProtoThis   the getter’s `this` type
 * @typeparam Return      the getter’s return type
 */
export function memoizeGetter<ProtoThis extends object, Return>(
	getter:   (this: ProtoThis) => Return,
	_context: ClassGetterDecoratorContext<ProtoThis, Return>,
): typeof getter {
	const memomap = new WeakMap<ProtoThis, Return>();
	return function () {
		// TODO: Map#getOrInsertComputed
		memomap.has(this) || memomap.set(this, getter.call(this));
		return memomap.get(this)!;
	};
}



/**
 * Decorator for run-once methods.
 * The first time the method is called, it should execute; any time after that, it should not.
 * Should only be used on methods that return `void`; for non-void methods, use {@link memoizeMethod}.
 * @implements MethodDecorator<ProtoThis, (this: ProtoThis, ...args: Params) => void>
 * @typeparam ProtoThis   the method’s `this` type
 * @typeparam Params      the method’s parameter types
 */
export function runOnceMethod<ProtoThis extends object, Params extends unknown[]>(
	method:   (this: ProtoThis, ...args: Params) => void,
	_context: ClassMethodDecoratorContext<ProtoThis, typeof method>,
): typeof method {
	const memoset = new WeakSet<ProtoThis>();
	return function (...args) {
		if (!memoset.has(this)) {
			memoset.add(this);
			return method.call(this, ...args);
		}
	};
}



/**
 * Like {@link runOnceMethod} but for setters.
 * @implements SetterDecorator<ProtoThis, Param>
 * @typeparam ProtoThis   the setter’s `this` type
 * @typeparam Param       the setter’s parameter type
 */
export function runOnceSetter<ProtoThis extends object, Param>(
	setter:   (this: ProtoThis, value: Param) => void,
	_context: ClassSetterDecoratorContext<ProtoThis, Param>,
): typeof setter {
	const memoset = new WeakSet<ProtoThis>();
	return function (arg) {
		if (!memoset.has(this)) {
			memoset.add(this);
			return setter.call(this, arg);
		}
	};
}

/**
 * Decorator for memoizing properties.
 * When getting a property, check whether it exists in the “database”.
 * If it does, return that value.
 * If it doen’t, compute the value, store it in the database, and then return it.
 * @implements MethodDecorator
 * @typeparam Params      the method’s parameter types
 * @typeparam Return      the method’s return type
 * @param   _prototype    the prototype that has the method to be decorated
 * @param   _property_key the name of the method to be decorated
 * @param   descriptor    the Property Descriptor of the prototype’s method
 * @returns               `descriptor`, with a new value that is the decorated method
 */
export function memoizeMethod<Params extends unknown[], Return>(
	_prototype:    object,
	_property_key: string,
	descriptor:    TypedPropertyDescriptor<(this: object, ...args: Params) => Return>,
): typeof descriptor {
	const method = descriptor.value!;
	const memomap: WeakMap<object, Return> = new WeakMap();
	descriptor.value = function (...args) {
		memomap.has(this) || memomap.set(this, method.call(this, ...args));
		return memomap.get(this)!;
	};
	return descriptor;
}



/**
 * Like {@link memoizeMethod} but for getters.
 * @implements MethodDecorator
 * @typeparam Return      the getter’s return type
 * @param   _prototype    the prototype that has the getter to be decorated
 * @param   _property_key the name of the getter to be decorated
 * @param   descriptor    the Property Descriptor of the prototype’s getter
 * @returns               `descriptor`, with a new `get` that is the decorated getter
 */
export function memoizeGetter<Return>(
	_prototype:    object,
	_property_key: string,
	descriptor:    TypedPropertyDescriptor<Return>,
): typeof descriptor {
	const method = descriptor.get!;
	const memomap: WeakMap<object, Return> = new WeakMap();
	descriptor.get = function () {
		memomap.has(this) || memomap.set(this, method.call(this));
		return memomap.get(this)!;
	};
	return descriptor;
}



/**
 * Decorator for run-once methods.
 * The first time the method is called, it should execute; any time after that, it should not.
 * Should only be used on methods that return `void`; for non-void methods, use {@link memoizeMethod}.
 * @implements MethodDecorator
 * @typeparam Params      the method’s parameter types
 * @param   _prototype    the prototype that has the method to be decorated
 * @param   _property_key the name of the method to be decorated
 * @param   descriptor    the Property Descriptor of the prototype’s method
 * @returns               `descriptor`, with a new value that is the decorated method
 */
export function runOnceMethod<Params extends unknown[]>(
	_prototype:    object,
	_property_key: string,
	descriptor:    TypedPropertyDescriptor<(this: object, ...args: Params) => void>,
): typeof descriptor {
	const method = descriptor.value!;
	const memoset: WeakSet<object> = new WeakSet();
	descriptor.value = function (...args) {
		if (!memoset.has(this)) {
			memoset.add(this);
			return method.call(this, ...args);
		};
	};
	return descriptor;
}



/**
 * Like {@link runOnceMethod} but for setters.
 * @implements MethodDecorator
 * @typeparam Param       the setter’s parameter type
 * @param   _prototype    the prototype that has the getter to be decorated
 * @param   _property_key the name of the getter to be decorated
 * @param   descriptor    the Property Descriptor of the prototype’s getter
 * @returns               `descriptor`, with a new `get` that is the decorated getter
 */
export function runOnceSetter<Param>(
	_prototype:    object,
	_property_key: string,
	descriptor:    TypedPropertyDescriptor<Param>,
): typeof descriptor {
	const method = descriptor.set!;
	const memoset: WeakSet<object> = new WeakSet();
	descriptor.set = function (arg) {
		if (!memoset.has(this)) {
			memoset.add(this);
			return method.call(this, arg);
		};
	};
	return descriptor;
}



/**
 * Decorator for performing strict equality (`===`), and then disjuncting (`||`) that result
 * with the results of performing the method.
 * @typeparam Proto       the type of the prototype
 * @typeparam Params      the method’s parameter types
 * @param   _prototype    the prototype that has the method to be decorated
 * @param   _property_key the name of the method to be decorated
 * @param   descriptor    the Property Descriptor of the prototype’s method
 * @returns               `descriptor`, with a new value that is the decorated method
 */
export function strictEqual<Proto extends object, Params extends unknown[]>(
	_prototype:    Proto,
	_property_key: string,
	descriptor:    TypedPropertyDescriptor<(this: Proto, that: Proto, ...args: Params) => boolean>,
): typeof descriptor {
	const method = descriptor.value!;
	descriptor.value = function (that, ...args) {
		return this === that || method.call(this, that, ...args);
	};
	return descriptor;
}

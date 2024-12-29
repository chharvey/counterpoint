import type {MethodDecorator} from '../lib/index.js';
import type {VALUE} from './index.js';



/**
 * Comparator function for checking “sameness” of `Type#values` set elements.
 * Values should be “the same” iff they are identical per the Counterpoint specification.
 */
export const languageValuesIdentical = (a: VALUE.Value, b: VALUE.Value): boolean => a.identical(b);



export const language_values_equal = (a: VALUE.Value, b: VALUE.Value): boolean => a.equal(b);



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



/**
 * Factory for decorators performing `instanceof`, and then conjuncting (`&&`) that result
 * with the results of performing the method.
 * @typeparam ProtoThis the type of this prototype
 * @typeparam ProtoThat the type of the first arg prototype
 * @typeparam Params    the method’s parameter types
 * @param     cons      a function returning a class/constructor to check instance of; offers potential to fail early
 * @returns             MethodDecorator<Proto, (this: Proto, that: Proto, ...args: Params) => boolean>
 */
export function instanceOf<ProtoThis extends object, ProtoThat extends object, Params extends unknown[]>(cons: () => NewableFunction): MethodDecorator<ProtoThis, (this: ProtoThis, that: ProtoThat, ...args: Params) => boolean> {
	let klass: NewableFunction | null = null;
	return (method) => function (that, ...args) {
		klass ??= cons.call(null);
		return that instanceof klass && method.call(this, that, ...args);
	};
}



/** A global cache of memoized binary operations’ results. */
const BINOP_CACHE = new Map<string, WeakMap<object, WeakMap<object, unknown>>>();

/**
 * Returns a decorator that memoizes a method that acts as a binary operation or relation,
 * i.e. the result of `this.method(that)` is saved in a global cache.
 * If the binary operation is symmetric, calls to `this.method(that)` and `that.method(this)` are memoized with the same value.
 * @typeparam Proto        the type of the prototype
 * @typeparam Return       the return type of the method
 * @param     is_symmetric is the binary operation symmetric?
 * @param     assumption   an assumption value to use before calling the method (which may prevent infinite loops or recursion)
 * @returns                MethodDecorator<ProtoThis, (this: Proto, that: Proto) => Return>
 */
export function memoizeBinOp<Proto extends object, Return>(is_symmetric = false, assumption?: Return): MethodDecorator<Proto, (this: Proto, that: Proto) => Return> {
	return (method, context) => {
		const method_name: string = String(context.name);
		BINOP_CACHE.has(method_name) || BINOP_CACHE.set(method_name, new WeakMap<Proto, WeakMap<Proto, Return>>());
		const this_cache = BINOP_CACHE.get(method_name) as WeakMap<Proto, WeakMap<Proto, Return>>;
		return function (that) {
			if (this_cache.has(this)) {
				const that_cache: WeakMap<Proto, Return> = this_cache.get(this)!;
				if (!that_cache.has(that)) {
					if (assumption !== undefined) {
						that_cache.set(that, assumption);
					}
					that_cache.set(that, method.call(this, that));
				}
				return that_cache.get(that)!;
			} else if (is_symmetric && this_cache.has(that)) {
				const that_cache: WeakMap<Proto, Return> = this_cache.get(that)!;
				if (!that_cache.has(this)) {
					if (assumption !== undefined) {
						that_cache.set(this, assumption);
					}
					that_cache.set(this, method.call(this, that));
				}
				return that_cache.get(this)!;
			} else {
				const that_cache = new WeakMap<Proto, Return>();
				this_cache.set(this, that_cache);
				if (assumption !== undefined) {
					that_cache.set(that, assumption);
				}
				const result: Return = method.call(this, that);
				that_cache.set(that, result);
				return result;
			}
		};
	};
}

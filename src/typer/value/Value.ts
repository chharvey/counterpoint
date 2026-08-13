import {assert_context_name} from '../../lib/index.ts';
import {strictEqual} from '../utils-private.ts';
import type {TYPE} from '../index.ts';
import {String as ValueString} from './index.ts';



/**
 * Decorator for {@link Value#equal} method and any overrides.
 * Checks identicality before performing the Equality algorithm.
 * @implements MethodDecorator<Value, Value['equal']>
 */
export function identical(
	method:  Value['equal'],
	context: ClassMethodDecoratorContext<Value, typeof method>,
): typeof method {
	assert_context_name(context, 'equal');
	return function (this: Value, value) {
		return this.identical(value) || method.call(this, value);
	};
}



/**
 * Parent class for all Counterpoint Language Values.
 * Known subclasses:
 * - Primitive
 * - Collection
 * - Maybe
 */
export abstract class Value {
	/**
	 * Return whether this type is a reference type or a value type.
	 * @return `true` if this type is a reference type
	 */
	public abstract get isReference(): boolean;

	/**
	 * Return the “logical value” of this value.
	 * @returns the associated Boolean value of this value
	 */
	// eslint-disable-next-line @typescript-eslint/class-literal-property-style --- overridden in subclasses by getters
	public get isTruthy(): boolean {
		return true;
	}

	/**
	 * Return whether this value is “empty”, that is,
	 * it is either falsy, a zero number, an empty string, or an empty collection.
	 */
	public get isEmpty(): boolean {
		return !this.isTruthy;
	}

	/**
	 * @return a string representation of this type
	 */
	public abstract toString(): string;

	/**
	 * Is this value the same exact object as the argument?
	 * @param value the object to compare
	 * @returns are the objects identically the same?
	 */
	@strictEqual
	public identical(_value: Value): boolean {
		return false;
	}

	/**
	 * Are the values considered equal?
	 * If {@link Value#identical} returns `true`, this method will return `true`.
	 * @param value the object to compare
	 * @returns are the objects equal?
	 */
	@strictEqual
	@identical
	public equal(_value: Value): boolean {
		return false;
	}

	/**
	 * Return a Counterpoint String representation of this Object.
	 * (Not a native string — see {@link #toString}.)
	 * @returns a {@link ValueString} representation of this Object
	 */
	public toCplString(): ValueString {
		return new ValueString(this.toString());
	}

	/**
	 * Return the canonical type of this Object.
	 * The returned type is as reasonably narrow as possible.
	 * @return a Type that contains this Object
	 */
	public abstract toType(): TYPE.Type;
}

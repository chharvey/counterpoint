import {strictEqual} from './package.js';
import {String as CPString} from './index.js';



/**
 * Parent class for all Counterpoint Language Values.
 * Known subclasses:
 * - Primitive
 * - Collection
 */
abstract class CPObject {
	/**
	 * Decorator for {@link CPObject#equal} method and any overrides.
	 * Performs the Equality algorithm — returns whether two CPObjects (Counterpoint Language Values)
	 * are equal by some definition.
	 * @param   _prototype    the prototype that has the method to be decorated
	 * @param   _property_key the name of the method to be decorated
	 * @param   descriptor    the Property Descriptor of the prototype’s method
	 * @returns               `descriptor`, with a new value that is the decorated method
	 */
	protected static equalsDeco(
		_prototype: CPObject,
		_property_key: string,
		descriptor: TypedPropertyDescriptor<(this: CPObject, value: CPObject) => boolean>,
	): typeof descriptor {
		const method = descriptor.value!;
		descriptor.value = function (value) {
			return this.identical(value) || method.call(this, value);
		};
		return descriptor;
	}


	/**
	 * Return the “logical value” of this value.
	 * @returns the associated Boolean value of this value
	 */
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
	 * Is this value the same exact object as the argument?
	 * @param value the object to compare
	 * @returns are the objects identically the same?
	 */
	@strictEqual
	public identical(_value: CPObject): boolean {
		return false;
	}

	/**
	 * Are the values considered equal?
	 * If {@link this.identical} returns `true`, this method will return `true`.
	 * @param value the object to compare
	 * @returns are the objects equal?
	 */
	@strictEqual
	@CPObject.equalsDeco
	public equal(_value: CPObject): boolean {
		return false;
	}

	/**
	 * Return a Counterpoint string representation of this Object.
	 * (Not a native String — see {@link #toString}.)
	 * @returns a string representation of this Object
	 */
	public toCPString(): CPString {
		return new CPString(this.toString());
	}
}
export {CPObject as Object};

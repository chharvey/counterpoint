import {strictEqual} from './package.js';
import {SolidString} from './index.js';
import {SolidType} from './SolidType.js';



/**
 * Parent class for all Solid Language Values.
 * Known subclasses:
 * - SolidNull
 * - SolidBoolean
 * - Int16
 * - Float64
 * - SolidString
 * - Collection
 */
export abstract class SolidObject {
	/** @implements Object */
	static toString(): string {
		return 'obj';
	}
	/** @implements SolidType */
	static isBottomType: SolidType['isBottomType'] = false;
	/** @implements SolidType */
	static isTopType: SolidType['isTopType'] = false;
	/** @implements SolidType */
	static values: SolidType['values'] = new Set();
	/** @implements SolidType */
	static includes(v: SolidObject): boolean {
		return v instanceof this/*static*/
	}
	/** @implements SolidType */
	static intersect: SolidType['intersect'] = SolidType.prototype.intersect;
	/** @implements SolidType */
	static union: SolidType['union'] = SolidType.prototype.union;
	/** @implements SolidType */
	static subtract: SolidType['subtract'] = SolidType.prototype.subtract;
	/** @implements SolidType */
	@strictEqual
	@SolidType.subtypeDeco
	static isSubtypeOf(t: SolidType): boolean {
		return (t instanceof Function)
			? this/*static*/.prototype instanceof t
			: SolidType.prototype.isSubtypeOf.call(this, t)
	}
	/** @implements SolidType */
	static equals: SolidType['equals'] = SolidType.prototype.equals;

	/**
	 * Decorator for {@link SolidObject#equal} method and any overrides.
	 * Performs the Equality algorithm — returns whether two Objects (Solid Language Values)
	 * are equal by some definition.
	 * @param   _prototype    the prototype that has the method to be decorated
	 * @param   _property_key the name of the method to be decorated
	 * @param   descriptor    the Property Descriptor of the prototype’s method
	 * @returns               `descriptor`, with a new value that is the decorated method
	 */
	protected static equalsDeco(
		_prototype: SolidObject,
		_property_key: string,
		descriptor: TypedPropertyDescriptor<(this: SolidObject, value: SolidObject) => boolean>,
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
	get isTruthy(): boolean {
		return true;
	}
	/**
	 * Return whether this value is “empty”, that is,
	 * it is either falsy, a zero number, an empty string, or an empty collection.
	 */
	get isEmpty(): boolean {
		return !this.isTruthy;
	}
	/**
	 * Is this value the same exact object as the argument?
	 * @param value the object to compare
	 * @returns are the objects identically the same?
	 */
	@strictEqual
	identical(_value: SolidObject): boolean {
		return false
	}
	/**
	 * Are the values considered equal?
	 * If {@link this.identical} returns `true`, this method will return `true`.
	 * @param value the object to compare
	 * @returns are the objects equal?
	 */
	@strictEqual
	@SolidObject.equalsDeco
	equal(_value: SolidObject): boolean {
		return false
	}

	/**
	 * Return a Solid string representation of this Object.
	 * (Not a native String — see {@link #toString}.)
	 * @returns a string representation of this Object
	 */
	toSolidString(): SolidString {
		return new SolidString(this.toString());
	}
}

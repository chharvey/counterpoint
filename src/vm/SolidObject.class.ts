import type SolidNull from './SolidNull.class'
import type SolidBoolean from './SolidBoolean.class'



/**
 * Parent class for all Solid Language Values.
 * Known subclasses:
 * - Null
 * - Boolean
 * - Int16
 * - Float64
 */
export default class SolidObject {
	/**
	 * Return the “logical value” of this value.
	 * @returns the associated Boolean value of this value
	 */
	get isTruthy(): SolidBoolean {
		const SolidNull_Class:    typeof SolidNull    = require('./SolidNull.class').default
		const SolidBoolean_Class: typeof SolidBoolean = require('./SolidBoolean.class').default
		return (
			(this instanceof SolidNull_Class)    ? SolidBoolean_Class.FALSE :
			(this instanceof SolidBoolean_Class) ? this :
			SolidBoolean_Class.TRUE
		)
	}
	/**
	 * Is this value the same exact object as the argument?
	 * @param value the object to compare
	 * @returns are the objects identically the same?
	 * @final
	 */
	identical(value: SolidObject): boolean {
		return this === value || this.identical_helper(value)
	}
	/**
	 * Helper method for {@link this.identical}. Override as needed.
	 * @param _value the object to compare
	 * @returns are the objects identically the same?
	 */
	protected identical_helper(_value: SolidObject): boolean {
		return false
	}
	/**
	 * Are the values considered equal?
	 * If {@link this.identical} returns `true`, this method will return `true`.
	 * @param value the object to compare
	 * @returns are the objects equal?
	 * @final
	 */
	equal(value: SolidObject): boolean {
		return this.identical(value) || this.equal_helper(value)
	}
	/**
	 * Helper method for {@link this.equal}. Override as needed.
	 * @param _value the object to compare
	 * @returns are the objects equal?
	 */
	protected equal_helper(_value: SolidObject): boolean {
		return false
	}
}

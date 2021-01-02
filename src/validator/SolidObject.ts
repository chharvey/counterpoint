import {SolidLanguageType} from './SolidLanguageType';
import type {SolidNull}    from './SolidNull';
import type {SolidBoolean} from './SolidBoolean';



/**
 * Parent class for all Solid Language Values.
 * Known subclasses:
 * - Null
 * - Boolean
 * - Int16
 * - Float64
 */
export class SolidObject {
	/** @implements SolidLanguageType */
	static isEmpty: SolidLanguageType['isEmpty'] = false
	/** @implements SolidLanguageType */
	static isUniverse: SolidLanguageType['isUniverse'] = false
	/** @implements SolidLanguageType */
	static values: SolidLanguageType['values'] = new Set()
	/** @implements SolidLanguageType */
	static includes(v: SolidObject): boolean {
		return v instanceof this/*static*/
	}
	/** @implements SolidLanguageType */
	static intersect: SolidLanguageType['intersect'] = SolidLanguageType.prototype.intersect
	/** @implements SolidLanguageType */
	static union: SolidLanguageType['union'] = SolidLanguageType.prototype.union
	/** @implements SolidLanguageType */
	static isSubtypeOf: SolidLanguageType['isSubtypeOf'] = SolidLanguageType.prototype.isSubtypeOf
	/** @implements SolidLanguageType */
	static isSubtypeOf_do(t: SolidLanguageType): boolean {
		return (t instanceof Function)
			? this/*static*/.prototype instanceof t
			: SolidLanguageType.prototype.isSubtypeOf_do.call(this, t)
	}
	/** @implements SolidLanguageType */
	static equals: SolidLanguageType['equals'] = SolidLanguageType.prototype.equals


	/**
	 * Return the “logical value” of this value.
	 * @returns the associated Boolean value of this value
	 */
	get isTruthy(): SolidBoolean {
		const SolidNull_Class:    typeof SolidNull    = require('./SolidNull')   .SolidNull;
		const SolidBoolean_Class: typeof SolidBoolean = require('./SolidBoolean').SolidBoolean;
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

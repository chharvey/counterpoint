import {SolidType} from './SolidType';
import type {SolidBoolean} from './SolidBoolean'; // TODO circular imports



/**
 * Parent class for all Solid Language Values.
 * Known subclasses:
 * - SolidNull
 * - SolidBoolean
 * - Int16
 * - Float64
 * - SolidString
 */
export abstract class SolidObject {
	/** @implements Object */
	static toString(): string {
		return 'obj';
	}
	/** @implements SolidType */
	static isEmpty: SolidType['isEmpty'] = false;
	/** @implements SolidType */
	static isUniverse: SolidType['isUniverse'] = false;
	/** @implements SolidType */
	static values: SolidType['values'] = new Set();
	/** @implements SolidType */
	static includes(v: SolidObject): boolean {
		return v instanceof this/*static*/
	}
	/** @implements SolidType */
	static intersect: SolidType['intersect'] = SolidType.prototype.intersect;
	/** @implements SolidType */
	static intersect_do: SolidType['intersect_do'] = SolidType.prototype.intersect_do;
	/** @implements SolidType */
	static union: SolidType['union'] = SolidType.prototype.union;
	/** @implements SolidType */
	static union_do: SolidType['union_do'] = SolidType.prototype.union_do;
	/** @implements SolidType */
	static isSubtypeOf: SolidType['isSubtypeOf'] = SolidType.prototype.isSubtypeOf;
	/** @implements SolidType */
	static isSubtypeOf_do(t: SolidType): boolean {
		return (t instanceof Function)
			? this/*static*/.prototype instanceof t
			: SolidType.prototype.isSubtypeOf_do.call(this, t);
	}
	/** @implements SolidType */
	static equals: SolidType['equals'] = SolidType.prototype.equals;


	/**
	 * Return the “logical value” of this value.
	 * @returns the associated Boolean value of this value
	 */
	get isTruthy(): SolidBoolean {
		const SolidBoolean_Class: typeof SolidBoolean = require('./SolidBoolean').SolidBoolean;
		return SolidBoolean_Class.TRUE;
	}
	/**
	 * Return whether this value is “empty”, that is,
	 * it is either falsy, a zero number, an empty string, or an empty collection.
	 */
	get isEmpty(): SolidBoolean {
		return this.isTruthy.not;
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

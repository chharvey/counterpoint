import Int16 from './Int16.class'
import Float64 from './Float64.class'



/**
 * Parent class for all Solid Language Types.
 * Known subclasses:
 * - Intersection
 * - Union
 */
export default class SolidLanguageType {
	/**
	 * Return whether the given class is a numeric type, i.e., an Integer or a Float.
	 * @todo TODO: this should be an instance method, where SolidLanguageValue classes are instances of this class
	```
	isNumericType(): boolean {
		return this === Int16 || this === Float64
	}
	```
	 * @return Is the given class Integer or Float?
	 */
	static isNumericType(t: SolidLanguageType): boolean {
		return t === Int16 || t === Float64
	}
}



/**
 * A type intersection of two types.
 * Indicates a value that must have both one and the other type.
 */
export class SolidTypeIntersection extends SolidLanguageType {
	constructor (
		private operand0: SolidLanguageType,
		private operand1: SolidLanguageType,
	) {
		super()
	}
}
/**
 * A type union of two types.
 * Indicates a value that could have either one or the other type.
 */
export class SolidTypeUnion extends SolidLanguageType {
	constructor (
		private operand0: SolidLanguageType,
		private operand1: SolidLanguageType,
	) {
		super()
	}
}

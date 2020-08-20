/**
 * Parent class for all Solid Language Types.
 * Known subclasses:
 * - Intersection
 * - Union
 */
export default class SolidLanguageType {
	/**
	 * Return whether the given class is a numeric type, i.e., an Integer or a Float.
	 * @return Is this type Number or a subtype?
	 */
	get isNumericType(): boolean {
		return false
	}
}



/**
 * A type intersection of two types.
 * Indicates a value that must have both one and the other type.
 */
export class SolidTypeIntersection extends SolidLanguageType {
	constructor (
		private readonly operand0: SolidLanguageType,
		private readonly operand1: SolidLanguageType,
	) {
		super()
	}
	/** @implements SolidLanguageType */
	get isNumericType(): boolean {
		return this.operand0.isNumericType || this.operand1.isNumericType
	}
}
/**
 * A type union of two types.
 * Indicates a value that could have either one or the other type.
 */
export class SolidTypeUnion extends SolidLanguageType {
	constructor (
		private readonly operand0: SolidLanguageType,
		private readonly operand1: SolidLanguageType,
	) {
		super()
	}
	/** @implements SolidLanguageType */
	get isNumericType(): boolean {
		return this.operand0.isNumericType && this.operand1.isNumericType
	}
}

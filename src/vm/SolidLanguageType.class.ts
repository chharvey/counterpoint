/**
 * Parent class for all Solid Language Types.
 * Known subclasses:
 * - Intersection
 * - Union
 */
export default class SolidLanguageType {
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

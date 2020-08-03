/**
 * Parent class for all Solid Language Values.
 * Known subclasses:
 * - Null
 * - Boolean
 * - Int16
 * - Float64
 */
export default class SolidLanguageValue {
}



/**
 * The class for the Solid Language Value `null`.
 *
 * A Null object is used as a placeholder for missing values.
 * It has no fields or methods, and it is “falsy” when used as a condition.
 *
 * This class is a singleton: there exists only one instance.
 * The reference to the instance of this class is a constant named `null`.
 *
 * The type of the value `null` is this class (the class `Null`),
 * but as a shorthand in type declarations that type is referred to as `null`.
 *
 * @final
 */
export class SolidNull extends SolidLanguageValue {
	/** The Solid Language Value `null`. */
	static readonly NULL: SolidNull = new SolidNull()
	private constructor () {
		super()
	}
	toString(): string {
		return 'null'
	}
}



/**
 * The Solid Language Type `Boolean` has two values: `true` and `false`.
 * These values are constant and the only two instances of this class.
 *
 * The type of the boolean values is this class (the class `Boolean`),
 * but as a shorthand in type declarations that type is referred to as `bool`.
 *
 * @final
 */
export class SolidBoolean extends SolidLanguageValue {
	/** The Solid Language Value `false`. */
	static readonly FALSE: SolidBoolean = new SolidBoolean()
	/** The Solid Language Value `true`. */
	static readonly TRUE: SolidBoolean = new SolidBoolean(true)
	protected constructor (private readonly value: boolean = false) {
		super()
	}
	toString(): string {
		return `${ this.value }`
	}
}



/**
 * A 64-bit floating-point number.
 * @final
 */
export class Float64 extends SolidLanguageValue {
	constructor (readonly value: number = 0) {
		super()
	}
	toString(): string {
		return `${ this.value }`
	}
}

/**
 * The class for the Solid Language Value `null`.
 *
 * A Null object is used as a placeholder for missing values.
 * It has no fields or methods, and it is “falsy” when used as a condition.
 *
 * This class is a singleton: there exists only one instance.
 * The reference to the instance of this class is named `null`.
 *
 * The type of the value `null` is this class (the class `Null`),
 * but as a shorthand in type declarations that type is referred to as `null`.
 */
export default class SolidNull {
	/** The Solid Language Value `null`. */
	static readonly NULL: SolidNull = new SolidNull()
	private constructor () {
	}
	toString(): string {
		return 'null'
	}
}

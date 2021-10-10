import type {SolidType} from './SolidType.js';
import type {SolidObject} from './SolidObject.js';
import {Primitive} from './Primitive.js';



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
export class SolidNull extends Primitive {
	static override toString(): string {
		return 'null';
	}
	/** The Solid Language Value `null`. */
	static readonly NULL: SolidNull = new SolidNull()
	static override values: SolidType['values'] = new Set([SolidNull.NULL]);


	private constructor () {
		super()
	}

	override toString(): string {
		return 'null'
	}
	override get isTruthy(): boolean {
		return false;
	}
	protected override identical_helper(value: SolidObject): boolean {
		return value instanceof SolidNull
	}
}

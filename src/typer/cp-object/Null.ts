import {TypeUnit} from './package.js';
import type {Object as CPObject} from './Object.js';
import {Primitive} from './Primitive.js';



/**
 * The class for the Counterpoint Language Value `null`.
 *
 * A Null object is used as a placeholder for missing values.
 * It has no fields or methods, and it is “falsy” when used as a condition.
 *
 * This class is a singleton: there exists only one instance.
 * The reference to the instance of this class is a constant named `null`.
 *
 * @final
 */
export class Null extends Primitive {
	/** The Counterpoint Language Value `null`. */
	public static readonly NULL: Null = new Null();
	/** A Unit Type containing only the Counterpoint Language Value `null`. */
	public static readonly NULLTYPE: TypeUnit = new TypeUnit(Null.NULL);


	private constructor() {
		super();
	}

	public override toString(): string {
		return 'null';
	}

	public override get isTruthy(): boolean {
		return false;
	}

	protected override identical_helper(value: CPObject): boolean {
		return value instanceof Null;
	}
}

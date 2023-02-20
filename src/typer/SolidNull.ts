import type binaryen from 'binaryen';
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
 * @final
 */
export class SolidNull extends Primitive {
	/** The Solid Language Value `null`. */
	static readonly NULL: SolidNull = new SolidNull();
	/** A Unit Type containing only the Solid Language Value `null`. */
	static readonly NULLTYPE = SolidNull.NULL.toType();


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

	public override build(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.i32.const(0);
	}
}

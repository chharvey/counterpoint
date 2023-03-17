import type binaryen from 'binaryen';
import {strictEqual} from '../../lib/index.js';
import type {TYPE} from '../index.js';
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
	public static readonly NULL = new Null();

	/** A Unit Type containing only the Counterpoint Language Value `null`. */
	public static get NULLTYPE(): TYPE.TypeUnit<Null> {
		return Null.NULL.toType();
	}


	private constructor() {
		super();
	}

	public override toString(): string {
		return 'null';
	}

	public override get isTruthy(): boolean {
		return false;
	}

	@strictEqual
	public override identical(value: CPObject): boolean {
		return value instanceof Null;
	}

	public override build(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.i32.const(0);
	}
}

import type binaryen from 'binaryen';
import {BinVect} from '../../index.js';
import {
	strictEqual,
	instanceOf,
} from '../utils-private.js';
import type {Value} from './Value.js';
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
	public constructor() {
		super();
	}

	public override toString(): string {
		return 'null';
	}

	public override get isTruthy(): boolean {
		return false;
	}

	@strictEqual
	@instanceOf(() => Null)
	// @memoizeBinOp(true, true) // memoizing takes longer than returning a constant
	public override identical(_value: Value): boolean {
		return true;
	}

	public override build(mod: binaryen.Module): binaryen.ExpressionRef {
		return new BinVect(mod, null).vect;
	}
}

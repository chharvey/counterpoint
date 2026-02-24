import type binaryen from 'binaryen';
import {
	type Builder,
	BinVect,
} from '../../index.ts';
import {noopMethod} from '../../lib/index.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import type {Value} from './Value.ts';
import {Primitive} from './Primitive.ts';



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
	@noopMethod(memoizeBinOp(true, true))
	public override identical(_value: Value): boolean {
		return true;
	}

	public override build(builder: Builder): binaryen.ExpressionRef {
		return new BinVect(builder.module).vect;
	}
}

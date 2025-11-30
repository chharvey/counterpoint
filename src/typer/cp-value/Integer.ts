import type binaryen from 'binaryen';
import {
	bigint_to_i64,
	type Builder,
	BinVect,
} from '../../index.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import {
	Natural,
	Float,
} from './index.ts';
import {
	identical,
	type Value,
} from './Value.ts';
import {Number as ValueNumber} from './Number.ts';



/**
 * A 64-bit signed integer in two’s complement.
 * @final
 */
export class Integer extends ValueNumber<Integer> {
	/**
	 * Internal implementation of this Integer.
	 * A 64-bit integer stored in a BigInt64Array.
	 */
	private readonly data: bigint;

	/**
	 * Construct a new Integer object from a bigint or from data.
	 * @param data - a numeric value or data
	 * @returns the value represented as a 64-bit signed integer
	 */
	public constructor(data: bigint = 0n) {
		super();
		const internal = new BigInt64Array(1);
		internal[0] = data; // need to store in BigInt64Array first to ensure 64-bit and signed
		this.data = internal[0];
	}

	public override toString(): string {
		return `${ this.toNumber() }`;
	}

	@strictEqual
	@instanceOf(() => Integer)
	// @memoizeBinOp(true, true) // memoizing takes longer than a simple comparison
	public override identical(value: Value): boolean {
		return this.data === (value as Integer).data;
	}

	@strictEqual
	@identical
	@instanceOf(() => ValueNumber)
	@memoizeBinOp(true, true)
	public override equal(value: Value): boolean {
		if (value instanceof Integer) {
			// non-identical Integers will never be equal
			return false;
		}
		if (value instanceof Natural) {
			return this.data === value.toBigInt();
		}
		return this.toFloat().equal(value);
	}

	public override build(builder: Builder): binaryen.ExpressionRef {
		return new BinVect(builder.module, bigint_to_i64(builder.module, this.data)).vect;
	}

	public override toInt(): Integer {
		return this;
	}

	public override toNat(): Natural {
		return new Natural(this.data);
	}

	public override toFloat(): Float {
		return new Float(this.toNumber());
	}

	/**
	 * Return the signed interpretation of this Integer.
	 * @return   the numeric value
	 */
	public toBigInt(): bigint {
		return this.data;
	}

	/**
	 * Return the signed interpretation of this Integer as a number.
	 * Note: Some precision may be lost, especially for integers larger than 2^53.
	 * @return   the numeric value as a number
	 */
	public toNumber(): number {
		return Number(this.toBigInt());
	}

	public override plus(addend: Integer): Integer {
		return new Integer(this.data + addend.data);
	}

	public override minus(subtrahend: Integer): Integer {
		return new Integer(this.data - subtrahend.data);
	}

	public override times(multiplier: Integer): Integer {
		return new Integer(this.data * multiplier.data);
	}

	public override divide(divisor: Integer): Integer {
		if (divisor.eq0()) {
			throw new RangeError('Division by zero.');
		}
		return new Integer(this.data / divisor.data);
	}

	public override exp(exponent: Integer): Integer {
		return new Integer(this.data ** exponent.data);
	}

	/**
	 * Equivalently, this is the “two’s complement” of the integer.
	 */
	public override neg(): Integer {
		return new Integer(-this.data);
	}

	public override eq0(): boolean {
		return this.data === 0n;
	}

	public override eq1(): boolean {
		return this.data === 1n;
	}

	public override lt(y: ValueNumber): boolean {
		if (y instanceof Integer) {
			return this.data < y.data;
		}
		return this.toFloat().lt(y);
	}
}

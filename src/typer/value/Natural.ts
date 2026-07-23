import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {
	noopMethod,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import {Float} from './index.ts';
import {
	identical,
	type Value,
} from './Value.ts';
import {Number as ValueNumber} from './Number.ts';
import {Integer} from './Integer.ts';



/**
 * A 64-bit unsigned integer.
 * @final
 */
export class Natural extends ValueNumber<Natural> {
	/**
	 * Internal implementation of this Natural.
	 * A 64-bit integer stored in a BigUint64Array.
	 */
	private readonly data: bigint;

	/**
	 * Construct a new Natural object from a bigint or from data.
	 * @param data - a numeric value or data
	 * @returns the value represented as a 64-bit unsigned integer
	 */
	public constructor(data: bigint = 0n) {
		super();
		const internal = new BigUint64Array([data]); // need to store in BigUint64Array first to ensure 64-bit and signed
		this.data = internal[0];
	}

	public override toString(): string {
		return `+${ this.data }`;
	}

	@strictEqual
	@noopMethod(memoizeBinOp(true, true))
	@instanceOf(() => Natural)
	public override identical(value: Value): boolean {
		return this.data === (value as Natural).data;
	}

	@strictEqual
	@identical
	@memoizeBinOp(true, true)
	@instanceOf(() => ValueNumber)
	public override equal(value: Value): boolean {
		if (value instanceof Natural) {
			// non-identical Naturals will never be equal
			return false;
		}
		if (value instanceof Integer) {
			return this.data === value.toNat().data;
		}
		return this.toFloat().equal(value);
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.vm.Value.newPrimitive(cg.vm.Vect.newNat(cg.mod.wasm.i64.const(this.data)));
	}

	public override toInt(): Integer {
		return new Integer(this.data);
	}

	public override toNat(): Natural {
		return this;
	}

	public override toFloat(): Float {
		return new Float(Number(this.data));
	}

	/**
	 * Return the unsigned interpretation of this Natural.
	 * @return   the numeric value
	 */
	public toBigInt(): bigint {
		return this.data;
	}

	public override plus(addend: Natural): Natural {
		return new Natural(this.data + addend.data);
	}

	public override minus(subtrahend: Natural): Natural {
		const data: bigint = this.data - subtrahend.data;
		return new Natural(data < 0n ? 0n : data);
	}

	public override times(multiplier: Natural): Natural {
		return new Natural(this.data * multiplier.data);
	}

	public override divide(divisor: Natural): Natural {
		if (divisor.eq0()) {
			throw new RangeError('Division by zero.');
		}
		return new Natural(this.data / divisor.data);
	}

	public override exp(exponent: Natural): Natural {
		return new Natural(this.data ** exponent.data);
	}

	public override neg(): Natural {
		throw new RangeError('No additive inverse.');
	}

	public override eq0(): boolean {
		return this.data === 0n;
	}

	public override eq1(): boolean {
		return this.data === 1n;
	}

	public override lt(y: ValueNumber): boolean {
		if (y instanceof Integer || y instanceof Natural) {
			return this.data < y.toNat().data;
		}
		return this.toFloat().lt(y);
	}
}

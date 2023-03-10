import type binaryen from 'binaryen';
import {strictEqual} from '../../lib/index.js';
import type {TYPE} from '../index.js';
import type {Object as CPObject} from './Object.js';
import {Primitive} from './Primitive.js';



/**
 * The Counterpoint Language Type `Boolean` has two values: `true` and `false`.
 * These values are constant and the only two instances of this class.
 *
 * @final
 */
class CPBoolean extends Primitive {
	/** The Counterpoint Language Value `false`. */
	public static readonly FALSE: CPBoolean = new CPBoolean(false);
	/** The Counterpoint Language Value `true`. */
	public static readonly TRUE: CPBoolean = new CPBoolean(true);
	/** A Unit Type containing only the Counterpoint Language Value `false`. */
	public static get FALSETYPE(): TYPE.TypeUnit<CPBoolean> {
		return CPBoolean.FALSE.toType();
	}

	/** A Unit Type containing only the Counterpoint Language Value `true`. */
	public static get TRUETYPE(): TYPE.TypeUnit<CPBoolean> {
		return CPBoolean.TRUE.toType();
	}

	/**
	 * Return the Counterpoint Language Value `true` or `false` based on the argument.
	 * @param b a native boolean value
	 * @returns the argument converted into a CPBoolean
	 */
	public static fromBoolean(b: boolean): CPBoolean {
		return (b) ? CPBoolean.TRUE : CPBoolean.FALSE;
	}

	/**
	 * Construct a new CPBoolean object.
	 * @param data The native boolean value of this object.
	 */
	private constructor(private readonly data: boolean) {
		super();
	}

	public override toString(): string {
		return `${ this.data }`;
	}

	public override get isTruthy(): boolean {
		return this.data;
	}

	@strictEqual
	public override identical(value: CPObject): boolean {
		return value instanceof CPBoolean && this.data === value.data;
	}

	public override build(mod: binaryen.Module): binaryen.ExpressionRef {
		return mod.i32.const((this.isTruthy) ? 1 : 0);
	}
}
export {CPBoolean as Boolean};

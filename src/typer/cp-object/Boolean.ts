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
	static readonly FALSE: CPBoolean = new CPBoolean(false);
	/** The Counterpoint Language Value `true`. */
	static readonly TRUE: CPBoolean = new CPBoolean(true);
	/** A Unit Type containing only the Counterpoint Language Value `false`. */
	public static readonly FALSETYPE = CPBoolean.FALSE.toType();
	/** A Unit Type containing only the Counterpoint Language Value `true`. */
	public static readonly TRUETYPE = CPBoolean.TRUE.toType();

	/**
	 * Return the Counterpoint Language Value `true` or `false` based on the argument.
	 * @param b a native boolean value
	 * @returns the argument converted into a CPBoolean
	 */
	static fromBoolean(b: boolean): CPBoolean {
		return (b) ? CPBoolean.TRUE : CPBoolean.FALSE;
	}
	/**
	 * Construct a new CPBoolean object.
	 * @param data The native boolean value of this object.
	 */
	private constructor (private readonly data: boolean) {
		super()
	}

	override toString(): string {
		return `${ this.data }`;
	}
	override get isTruthy(): boolean {
		return this.data;
	}
	protected override identical_helper(value: CPObject): boolean {
		return value instanceof CPBoolean && this.data === value.data;
	}
}
export {CPBoolean as Boolean};

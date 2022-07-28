import {
	strictEqual,
	TypeUnit,
} from './package.js';
import type {Object} from './Object.js';
import {Primitive} from './Primitive.js';



/**
 * The Counterpoint Language Type `Boolean` has two values: `true` and `false`.
 * These values are constant and the only two instances of this class.
 *
 * @final
 */
export class Boolean extends Primitive {
	/** The Counterpoint Language Value `false`. */
	static readonly FALSE: Boolean = new Boolean(false);
	/** The Counterpoint Language Value `true`. */
	static readonly TRUE: Boolean = new Boolean(true);
	/** A Unit Type containing only the Counterpoint Language Value `false`. */
	static readonly FALSETYPE: TypeUnit = new TypeUnit(Boolean.FALSE);
	/** A Unit Type containing only the Counterpoint Language Value `true`. */
	static readonly TRUETYPE: TypeUnit = new TypeUnit(Boolean.TRUE);

	/**
	 * Return the Counterpoint Language Value `true` or `false` based on the argument.
	 * @param b a native boolean value
	 * @returns the argument converted into a Boolean
	 */
	static fromBoolean(b: boolean): Boolean {
		return (b) ? Boolean.TRUE : Boolean.FALSE;
	}
	/**
	 * Construct a new Boolean object.
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
	@strictEqual
	override identical(value: Object): boolean {
		return value instanceof Boolean && this.data === value.data;
	}
}

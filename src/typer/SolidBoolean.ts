import type {SolidType} from './SolidType.js';
import {SolidTypeUnit} from './SolidTypeUnit.js';
import type {SolidObject} from './SolidObject.js';
import {Primitive} from './Primitive.js';



/**
 * The Solid Language Type `Boolean` has two values: `true` and `false`.
 * These values are constant and the only two instances of this class.
 *
 * The type of the boolean values is this class (the class `Boolean`),
 * but as a shorthand in type declarations that type is referred to as `bool`.
 *
 * @final
 */
export class SolidBoolean extends Primitive {
	static override toString(): string {
		return 'bool';
	}
	/** The Solid Language Value `false`. */
	static readonly FALSE: SolidBoolean = new SolidBoolean()
	/** The Solid Language Value `true`. */
	static readonly TRUE: SolidBoolean = new SolidBoolean(true)
	/** A Unit Type containing only the Solid Language Value `false`. */
	static readonly FALSETYPE: SolidTypeUnit = new SolidTypeUnit(SolidBoolean.FALSE);
	/** A Unit Type containing only the Solid Language Value `true`. */
	static readonly TRUETYPE: SolidTypeUnit = new SolidTypeUnit(SolidBoolean.TRUE);
	static override values: SolidType['values'] = new Set([SolidBoolean.FALSE, SolidBoolean.TRUE])

	/**
	 * Return the Solid Language Value `true` or `false` based on the argument.
	 * @param b a native boolean value
	 * @returns the argument converted into a SolidBoolean
	 */
	static fromBoolean(b: boolean): SolidBoolean {
		return (b) ? SolidBoolean.TRUE : SolidBoolean.FALSE
	}
	/**
	 * Construct a new SolidBoolean object.
	 * @param data The native boolean value of this object.
	 */
	private constructor (private readonly data: boolean = false) {
		super()
	}

	override toString(): string {
		return `${ this.data }`;
	}
	override get isTruthy(): boolean {
		return this.data;
	}
	protected override identical_helper(value: SolidObject): boolean {
		return value instanceof SolidBoolean && this.data === value.data;
	}
}

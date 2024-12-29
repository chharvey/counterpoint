import type binaryen from 'binaryen';
import {strictEqual} from '../../lib/index.js';
import type {TYPE} from '../index.js';
import {String as ValueString} from './index.js';
import {equalsDeco} from './decorators.js';



/**
 * Parent class for all Counterpoint Language Values.
 * Known subclasses:
 * - Primitive
 * - Collection
 */
export abstract class Value {
	/**
	 * Return the “logical value” of this value.
	 * @returns the associated Boolean value of this value
	 */
	// eslint-disable-next-line @typescript-eslint/class-literal-property-style --- overridden in subclasses by getters
	public get isTruthy(): boolean {
		return true;
	}

	/**
	 * Return whether this value is “empty”, that is,
	 * it is either falsy, a zero number, an empty string, or an empty collection.
	 */
	public get isEmpty(): boolean {
		return !this.isTruthy;
	}

	/**
	 * Is this value the same exact object as the argument?
	 * @param value the object to compare
	 * @returns are the objects identically the same?
	 */
	@strictEqual
	public identical(_value: Value): boolean {
		return false;
	}

	/**
	 * Are the values considered equal?
	 * If {@link Value#identical} returns `true`, this method will return `true`.
	 * @param value the object to compare
	 * @returns are the objects equal?
	 */
	@strictEqual
	@equalsDeco
	public equal(_value: Value): boolean {
		return false;
	}

	/**
	 * Return a Counterpoint string representation of this Object.
	 * (Not a native String — see {@link #toString}.)
	 * @returns a string representation of this Object
	 */
	public toCPString(): ValueString {
		return new ValueString(this.toString());
	}

	/**
	 * Return the canonical type of this Object.
	 * The returned type is as reasonably narrow as possible.
	 * @return a Type that contains this Object
	 */
	public abstract toType(): TYPE.Type;

	/**
	 * Create an ExpressionRef that implements this object.
	 * @param mod the module to build from
	 * @return the directions to print
	 */
	public abstract build(mod: binaryen.Module): binaryen.ExpressionRef;
}

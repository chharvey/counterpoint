import {strictEqual} from '../../lib/index.js';
import type {TYPE} from '../index.js';
import {memoBinop} from '../utils-private.js';
import {String as CPString} from './index.js';



/**
 * Parent class for all Counterpoint Language Values.
 * Known subclasses:
 * - Primitive
 * - Collection
 */
abstract class CPObject {
	/** Memoizer for comparing `CPObject`s by identity (`===`). */
	private static readonly ID_MEMO = new Map<readonly [CPObject, CPObject], boolean>();
	/** Memoizer for comparing `CPObject`s by equality (`==`). */
	private static readonly EQ_MEMO = new Map<readonly [CPObject, CPObject], boolean>();

	/**
	 * Decorator for {@link CPObject#equal} method and any overrides.
	 * Performs the Equality algorithm — returns whether two CPObjects (Counterpoint Language Values)
	 * are equal by some definition.
	 * @implements MethodDecorator<CPObject, CPObject['equal']>
	 */
	protected static equalsDeco(
		method:   CPObject['equal'],
		_context: ClassMethodDecoratorContext<CPObject, typeof method>,
	): typeof method {
		return function (this: CPObject, value) {
			return this.identical(value) || method.call(this, value);
		};
	}


	/**
	 * Return the “logical value” of this value.
	 * @returns the associated Boolean value of this value
	 */
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
	public identical(_value: CPObject): boolean {
		return false;
	}

	/**
	 * Are the values considered equal?
	 * If {@link CPObject#identical} returns `true`, this method will return `true`.
	 * @param value the object to compare
	 * @returns are the objects equal?
	 */
	@strictEqual
	@CPObject.equalsDeco
	public equal(_value: CPObject): boolean {
		return false;
	}

	/**
	 * Utility method for checking and memoizing identity.
	 * @param  that       the object to compare to this object
	 * @param  definition the definition of identity for this type; a function taking 2 objects (`this` and `that`) and returning a boolean
	 * @return            the result of evaluating the Counterpoint code `this === that`
	 * @final
	 */
	protected isIdenticalTo<T extends CPObject>(this: T, that: T, definition: (this_: T, that_: T) => boolean): boolean {
		return memoBinop(this, that, CPObject.ID_MEMO, definition);
	}

	/**
	 * Utility method for checking and memoizing equality.
	 * @param  that       the object to compare to this object
	 * @param  definition the definition of equality for this type; a function taking 2 objects (`this` and `that`) and returning a boolean
	 * @return            the result of evaluating the Counterpoint code `this == that`
	 * @final
	 */
	protected isEqualTo<T extends CPObject>(this: T, that: T, definition: (this_: T, that_: T) => boolean): boolean {
		return memoBinop(this, that, CPObject.EQ_MEMO, definition);
	}

	/**
	 * Return a Counterpoint string representation of this Object.
	 * (Not a native String — see {@link #toString}.)
	 * @returns a string representation of this Object
	 */
	public toCPString(): CPString {
		return new CPString(this.toString());
	}

	/**
	 * Return the canonical type of this Object.
	 * The returned type is as reasonably narrow as possible.
	 * @return a Type that contains this Object
	 */
	public abstract toType(): TYPE.Type;
}
export {CPObject as Object};

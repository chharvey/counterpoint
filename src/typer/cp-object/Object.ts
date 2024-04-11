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
	 * Decorator for {@link CPObject#identical} for memoizing results.
	 * @implements MethodDecorator<CPObject, CPObject['identical']>
	 */
	protected static memoizeIdentical(
		method:   CPObject['identical'],
		_context: ClassMethodDecoratorContext<CPObject, typeof method>,
	): typeof method {
		return function (this: CPObject, value) {
			return memoBinop(this, value, CPObject.ID_MEMO, () => method.call(this, value));
		};
	}

	/**
	 * Decorator for {@link CPObject#equal} for memoizing results.
	 * @implements MethodDecorator<CPObject, CPObject['equal']>
	 */
	protected static memoizeEqual(
		method:   CPObject['equal'],
		_context: ClassMethodDecoratorContext<CPObject, typeof method>,
	): typeof method {
		return function (this: CPObject, value) {
			return memoBinop(this, value, CPObject.EQ_MEMO, () => method.call(this, value));
		};
	}

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

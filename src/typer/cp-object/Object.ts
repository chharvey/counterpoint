import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	type Keys,
	strictEqual,
} from '../../lib/index.js';
import type {TYPE} from '../index.js';
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
	 * Utility method for checking and memoizing a boolean binary operation.
	 * When the compiler performs `o1 ‹op› o2` (where ‹op› is some binary operation that returns a boolean result),
	 * it will memoize the result and refer to it later,
	 * in the case of recursive nesting (say `o1.prop ‹op› o2` and `o2.prop ‹op› o1`),
	 * or when evaluating a similar expression (such as `o2 ‹op› o1`).
	 * @param  that       the object to compare to this object
	 * @param  memo       the memoizer, using `[this, that]` as keys and the result of the operation as values
	 * @param  definition the definition of equality for this type; a function taking 2 objects (`this` and `that`) and returning a boolean
	 * @return            the result of evaluating the Counterpoint code `this ‹op› that`
	 */
	private memoBinop(that: this, memo: Map<readonly [CPObject, CPObject], boolean>, definition: (this_: this, that_: this) => boolean): boolean {
		type K = Keys<typeof memo>;
		const memo_key: readonly [this, this] = [this, that];
		const memo_comparator = (
			memokey1: K,
			memokey2: K,
		): boolean => xjs.Set.is<CPObject>( // cannot test `.identical()` for value objects without resulting in infinite recursion, so we must use the stricter native `===`
			new Set<CPObject>(memokey1),
			new Set<CPObject>(memokey2),
		);
		if (!xjs.Map.has<K, boolean>(memo, memo_key, memo_comparator)) {
			xjs.Map.set<K, boolean>(memo, memo_key, false,                             memo_comparator); // use this assumption in the next step
			xjs.Map.set<K, boolean>(memo, memo_key, definition.call(null, this, that), memo_comparator);
		}
		return xjs.Map.get<K, boolean>(memo, memo_key, memo_comparator)!;
	}

	/**
	 * Utility method for checking and memoizing identity.
	 * @param  that       the object to compare to this object
	 * @param  definition the definition of identity for this type; a function taking 2 objects (`this` and `that`) and returning a boolean
	 * @return            the result of evaluating the Counterpoint code `this === that`
	 * @final
	 */
	protected isIdenticalTo(that: this, definition: (this_: this, that_: this) => boolean): boolean {
		return this.memoBinop(that, CPObject.ID_MEMO, definition);
	}

	/**
	 * Utility method for checking and memoizing equality.
	 * @param  that       the object to compare to this object
	 * @param  definition the definition of equality for this type; a function taking 2 objects (`this` and `that`) and returning a boolean
	 * @return            the result of evaluating the Counterpoint code `this == that`
	 * @final
	 */
	protected isEqualTo(that: this, definition: (this_: this, that_: this) => boolean): boolean {
		return this.memoBinop(that, CPObject.EQ_MEMO, definition);
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

	/**
	 * Create an ExpressionRef that implements this object.
	 * @param mod the module to build from
	 * @return the directions to print
	 */
	public abstract build(mod: binaryen.Module): binaryen.ExpressionRef;
}
export {CPObject as Object};

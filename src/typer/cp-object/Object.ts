import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	type Keys,
	strictEqual,
} from '../../lib/index.js';
import type {TYPE} from '../index.js';
import {String as CPString} from './index.js';



/* eslint-disable @typescript-eslint/no-use-before-define */
const eq_memo = new Map<readonly [CPObject, CPObject], boolean>();
const eq_memo_comparator = (memokey1: Keys<typeof eq_memo>, memokey2: Keys<typeof eq_memo>): boolean => xjs.Set.is<CPObject>(new Set<CPObject>(memokey1), new Set<CPObject>(memokey2)); // cannot test `.identical()` for value objects without resulting in infinite recursion, so we must use the stricter native `===`
/* eslint-enable @typescript-eslint/no-use-before-define */



/**
 * Parent class for all Counterpoint Language Values.
 * Known subclasses:
 * - Primitive
 * - Collection
 */
abstract class CPObject {
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
	 * Utility method for checking and memoizing equality.
	 * When the compiler performs `o1 == o2`, it will memoize the result and refer to it later,
	 * in the case of recursive nesting (say `o1.prop == o2` and `o2.prop == o1`),
	 * or when evaluating a similar expression (such as `o2 == o1`).
	 * @param  that       the object to compare to this object
	 * @param  definition the definition of equality for this type; a function taking 2 objects (`this` and `that`) and returning a boolean
	 * @return            the result of evaluating the Counterpoint code `this == that`
	 * @final
	 */
	protected isEqualTo(that: this, definition: (this_: this, that_: this) => boolean): boolean {
		const memokey: readonly [this, this] = [this, that];
		if (!xjs.Map.has<Keys<typeof eq_memo>, boolean>(eq_memo, memokey, eq_memo_comparator)) {
			xjs.Map.set<Keys<typeof eq_memo>, boolean>(eq_memo, memokey, false, eq_memo_comparator); // use this assumption in the next step
			xjs.Map.set<Keys<typeof eq_memo>, boolean>(eq_memo, memokey, definition.call(null, this, that), eq_memo_comparator);
		}
		return xjs.Map.get<Keys<typeof eq_memo>, boolean>(eq_memo, memokey, eq_memo_comparator)!;
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

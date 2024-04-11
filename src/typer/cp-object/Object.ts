import * as assert from 'assert';
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
	 * Decorator for {@link CPObject#identical} or {@link CPObject#equal} for memoizing results.
	 * It may only be applied to one of those methods.
	 * @implements MethodDecorator<CPObject, CPObject['identical' | 'equal']>
	 */
	protected static memoizeSameness(
		method:  CPObject['identical' | 'equal'],
		context: ClassMethodDecoratorContext<CPObject, typeof method>,
	): typeof method {
		const memo: Map<readonly [CPObject, CPObject], boolean> = (
			context.name === 'identical' ? CPObject.ID_MEMO :
			context.name === 'equal'     ? CPObject.EQ_MEMO :
			assert.fail(`CPObject.memoizeSameness did not expect the name \`${ context.name.toString() }\`.`)
		);
		type K = Keys<typeof memo>;
		const memo_comparator = (key0: K, key1: K): boolean => xjs.Set.is<CPObject>(new Set<CPObject>(key0), new Set<CPObject>(key1));

		return function (this: CPObject, value) {
			const memo_key: K = [this, value];
			if (!xjs.Map.has(memo, memo_key, memo_comparator)) {
				xjs.Map.set(memo, memo_key, true,                     memo_comparator); // use this assumption in the next step
				xjs.Map.set(memo, memo_key, method.call(this, value), memo_comparator);
			}
			return xjs.Map.get(memo, memo_key, memo_comparator)!;
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

import type binaryen from 'binaryen';
import * as assert from 'assert';
import {strictEqual} from '../../lib/index.js';
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
	private static readonly ID_MEMO = new WeakMap<CPObject, WeakMap<CPObject, boolean>>();
	/** Memoizer for comparing `CPObject`s by equality (`==`). */
	private static readonly EQ_MEMO = new WeakMap<CPObject, WeakMap<CPObject, boolean>>();

	/**
	 * Decorator for {@link CPObject#identical} or {@link CPObject#equal} for memoizing results.
	 * It may only be applied to one of those methods.
	 * @implements MethodDecorator<CPObject, CPObject['identical' | 'equal']>
	 */
	protected static memoizeSameness(
		method:  CPObject['identical' | 'equal'],
		context: ClassMethodDecoratorContext<CPObject, typeof method>,
	): typeof method {
		const memo: WeakMap<CPObject, WeakMap<CPObject, boolean>> = (
			context.name === 'identical' ? CPObject.ID_MEMO :
			context.name === 'equal'     ? CPObject.EQ_MEMO :
			assert.fail(`CPObject.memoizeSameness did not expect the name \`${ context.name.toString() }\`.`)
		);
		return function (this: CPObject, value) {
			if (memo.has(this)) {
				const map: WeakMap<CPObject, boolean> = memo.get(this)!;
				if (!map.has(value)) {
					map.set(value, true); // use this assumption in the next step
					map.set(value, method.call(this, value));
				}
				return map.get(value)!;
			} else if (memo.has(value)) {
				const map: WeakMap<CPObject, boolean> = memo.get(value)!;
				if (!map.has(this)) {
					map.set(this, true); // use this assumption in the next step
					map.set(this, method.call(this, value));
				}
				return map.get(this)!;
			} else {
				const map = new WeakMap<CPObject, boolean>();
				memo.set(this, map);
				map.set(value, true); // use this assumption in the next step
				const result: boolean = method.call(this, value);
				map.set(value, result);
				return result;
			}
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

	/**
	 * Create an ExpressionRef that implements this object.
	 * @param mod the module to build from
	 * @return the directions to print
	 */
	public abstract build(mod: binaryen.Module): binaryen.ExpressionRef;
}
export {CPObject as Object};

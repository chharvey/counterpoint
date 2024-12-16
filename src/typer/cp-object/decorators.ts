import * as assert from 'assert';
import type {Object as CPObject} from './index.js';



/** Memoizer for comparing `CPObject`s by identity (`===`). */
const ID_MEMO = new WeakMap<CPObject, WeakMap<CPObject, boolean>>();
/** Memoizer for comparing `CPObject`s by equality (`==`). */
const EQ_MEMO = new WeakMap<CPObject, WeakMap<CPObject, boolean>>();



/**
 * Decorator for {@link CPObject#equal} method and any overrides.
 * Performs the Equality algorithm — returns whether two CPObjects (Counterpoint Language Values)
 * are equal by some definition.
 * @implements MethodDecorator<CPObject, CPObject['equal']>
 */
export function equalsDeco(
	method:   CPObject['equal'],
	_context: ClassMethodDecoratorContext<CPObject, typeof method>,
): typeof method {
	return function (this: CPObject, value) {
		return this.identical(value) || method.call(this, value);
	};
}



/**
 * Decorator for {@link CPObject#identical} or {@link CPObject#equal} for memoizing results.
 * It may only be applied to one of those methods.
 * @implements MethodDecorator<CPObject, CPObject['identical' | 'equal']>
 */
export function memoizeSameness(
	method:  CPObject['identical' | 'equal'],
	context: ClassMethodDecoratorContext<CPObject, typeof method>,
): typeof method {
	const memo: WeakMap<CPObject, WeakMap<CPObject, boolean>> = (
		context.name === 'identical' ? ID_MEMO :
		context.name === 'equal'     ? EQ_MEMO :
		assert.fail(`memoizeSameness did not expect the name \`${ context.name.toString() }\`.`)
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

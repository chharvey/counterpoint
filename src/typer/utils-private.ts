import * as xjs from 'extrajs';
import type {Keys} from '../lib/index.js';
import type {OBJ} from './index.js';



/**
 * Comparator function for checking “sameness” of `Type#values` set elements.
 * Values should be “the same” iff they are identical per the Counterpoint specification.
 */
export const languageValuesIdentical = (a: OBJ.Object, b: OBJ.Object): boolean => a.identical(b);



export const language_values_equal = (a: OBJ.Object, b: OBJ.Object): boolean => a.equal(b);



/**
 * Utility function for checking and memoizing a commutative boolean binary operation.
 * When the compiler performs `o1 ‹op› o2` (where ‹op› is some binary operation that returns a boolean result),
 * it will memoize the result and refer to it later,
 * in the case of recursive nesting (say `o1.prop ‹op› o2` and `o2.prop ‹op› o1`),
 * or when evaluating a similar expression (such as `o2 ‹op› o1`).
 * @typeparam T       the type of arguments
 * @param  arg0       the left argument
 * @param  arg1       the right argument
 * @param  memo       the memoizer, using `[arg0, arg1]` as keys and the result of the operation as values
 * @param  definition the definition of equality for this type; a function taking 2 objects (`arg0` and `arg1`) and returning a boolean
 * @return            the result of evaluating the Counterpoint code `arg0 ‹op› arg1`
 */
export function memoBinop<T extends OBJ.Object>(arg0: T, arg1: T, memo: Map<readonly [OBJ.Object, OBJ.Object], boolean>, definition: (this_: T, that_: T) => boolean): boolean {
	type K = Keys<typeof memo>;
	const memo_key: K     = [arg0, arg1];
	const memo_comparator = (key0: K, key1: K): boolean => xjs.Set.is(new Set(key0), new Set(key1));

	if (!xjs.Map.has(memo, memo_key, memo_comparator)) {
		xjs.Map.set(memo, memo_key, true,                              memo_comparator); // use this assumption in the next step
		xjs.Map.set(memo, memo_key, definition.call(null, arg0, arg1), memo_comparator);
	}
	return xjs.Map.get(memo, memo_key, memo_comparator)!;
}

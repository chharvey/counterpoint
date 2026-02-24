import type {Optimizer} from '../Optimizer.ts';
import {
	type Value,
	Trap,
	Const,
	Get,
} from './index.ts';



/**
 * Ensure that values use the Three-Address Code technique.
 *
 * Every binary operation should take the form of `t1 := t2 + t3`, and
 * every unary operation should take the form of `t1 := -t2`.
 * Nested operations such as `!(5 + -x * 2 - 3)`, instead of a tree-like structure:
 * ```
 * (NOT (SUB (ADD 5 (MUL (NEG x) 2)) 3))
 * ```
 * become flattened with the use of temporary locals:
 * ```
 * (SET $0 (NEG x))          ;; t0 := -x
 * (SET $1 (MUL $0 2))       ;; t1 := t0 * 2
 * (SET $2 (ADD 5 (GET $1))) ;; t2 := 5 + t1
 * (SET $3 (SUB (GET $2) 3)) ;; t3 := t2 - 3
 * (GET $3)                  ;; t3
 * ```
 *
 * If this value is already a unit (constant or variable), do nothing.
 * Otherwise, store the value in a local and return a {@link Get}.
 *
 * @param optimizer
 * @param value     the value to express as a unit
 * @return          the value, or a GET of the value
 * @see https://en.wikipedia.org/wiki/Three-address_code
 */
export function as_unit(optimizer: Optimizer, value: Value): Value {
	return [Trap, Const, Get].some((cons) => value instanceof cons)
		? value
		: new Get(optimizer.newTempLocal(value.type, value));
}

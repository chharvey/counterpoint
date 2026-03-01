import type {Local} from '../utils-private.ts';
import type {Optimizer} from '../Optimizer.ts';
import {
	type Type,
	type Value,
	Get,
	Set,
	Label,
	Goto,
	GotoIfFalse,
} from './index.ts';



/**
 * Utilty for implementing a conditional expression CFG:
 * ```
 * (if ‹condition› then ‹consequent› else ‹alternative›)
 * ```
 * IR Outline:
 * ```
 * (DECL ‹result_type› result)
 * if_false ‹condition›, goto "else".
 * (SET result ‹consequent›) ;; evaluate consequent and set to result
 * goto "endif".
 * "else":
 * (SET result ‹alternative›) ;; evaluate alternative and set to result
 * "endif":
 * return (GET result).
 * ```
 * @param optimizer
 * @param result_type the type of the expression’s value
 * @param condition
 * @param consequent
 * @param alternative
 * @return            a (GET) of the result based on the condition
 */
export function conditional_expression(
	optimizer:   Optimizer,
	result_type: Type,
	condition:   () => Value,
	consequent:  () => Value,
	alternative: () => Value,
): Get {
	const block_else:  string = optimizer.newLabel();
	const block_endif: string = optimizer.newLabel();
	const result:      Local  = optimizer.newTempLocal(result_type);

	optimizer.pushInstruction(new GotoIfFalse(condition.call(null), block_else));
	optimizer.pushInstruction(new Set(result, consequent.call(null)));
	optimizer.pushInstruction(new Goto(block_endif));
	optimizer.pushInstruction(new Label(block_else));
	optimizer.pushInstruction(new Set(result, alternative.call(null)));
	optimizer.pushInstruction(new Label(block_endif));
	return new Get(result);
}



/**
 * Utilty for implementing a conditional statement CFG:
 * ```
 * if ‹condition› then {... ‹consequent› ...} else {... ‹alternative› ...};
 * ```
 * If there is no ‘else’ block, don’t provide an argument for `alternative`.
 *
 * For if–else–if chains, structure them the old-fashioned way:
 * ```
 * if … then {…} else {if … then {…} else {if … then {…} else {…}}};
 * ```
 * @param optimizer
 * @param condition
 * @param consequent
 * @param alternative
 */
export function conditional_statement(
	optimizer:    Optimizer,
	condition:    () => Value,
	consequent:   () => void,
	alternative?: () => void,
): void {
	const block_else:  string = optimizer.newLabel();
	const block_endif: string = optimizer.newLabel();

	optimizer.pushInstruction(new GotoIfFalse(condition.call(null), alternative ? block_else : block_endif));
	consequent.call(null);
	optimizer.pushInstruction(new Goto(block_endif));
	if (alternative) {
		optimizer.pushInstruction(new Label(block_else));
		alternative.call(null);
	}
	optimizer.pushInstruction(new Label(block_endif));
}

import type {Local} from '../utils-private.ts';
import type {Optimizer} from '../Optimizer.ts';
import {
	type TypeName,
	type Value,
	Get,
	Phi,
	type Label,
	Goto,
	GotoIfFalse,
} from './index.ts';



export type CollectionDynamicName = (
	| TypeName.LIST
	| TypeName.DICT
	| TypeName.SET
	| TypeName.MAP
);



/**
 * Utilty for implementing a conditional expression CFG:
 * ```
 * (if ‹condition› then ‹consequent› else ‹alternative›)
 * ```
 * IR Outline:
 * ```
 * if_false ‹condition›, goto "else".
 * "then":
 * (DECL ‹result_type› $result_then)
 * (SET $result_then ‹consequent›) ;; evaluate consequent and set to result
 * goto "endif".
 * "else":
 * (DECL ‹result_type› $result_else)
 * (SET $result_else ‹alternative›) ;; evaluate alternative and set to result
 * "endif":
 * return (PHI "then"->(GET $result_then) "else"->(GET $result_else)).
 * ```
 * @param optimizer
 * @param result_type the type of the expression’s value
 * @param condition
 * @param consequent
 * @param alternative
 * @return            a (PHI) of the results based on the condition
 */
export function conditional_expression(
	optimizer:   Optimizer,
	condition:   () => Value,
	consequent:  () => Value,
	alternative: () => Value,
): Phi {
	const block_then:  Label = optimizer.newLabel();
	const block_else:  Label = optimizer.newLabel();
	const block_endif: Label = optimizer.newLabel();

	optimizer.pushInstruction(new GotoIfFalse(condition.call(null), block_else));
	optimizer.pushInstruction(block_then);
	const result_then: Local = optimizer.newTempLocal(consequent.call(null));
	optimizer.pushInstruction(new Goto(block_endif));
	optimizer.pushInstruction(block_else);
	const result_else: Local = optimizer.newTempLocal(alternative.call(null));
	optimizer.pushInstruction(block_endif);
	return new Phi(
		[block_then, new Get(result_then)],
		[block_else, new Get(result_else)],
	);
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
 * @return            labels for the ‘then’ branch (and ‘else’ branch, if applicable) for later use
 */
export function conditional_statement(
	optimizer:    Optimizer,
	condition:    () => Value,
	consequent:   () => void,
	alternative?: () => void,
): {then: Label, else: Label | null} {
	const block_then:  Label = optimizer.newLabel();
	const block_else:  Label = optimizer.newLabel();
	const block_endif: Label = optimizer.newLabel();

	optimizer.pushInstruction(new GotoIfFalse(condition.call(null), alternative ? block_else : block_endif));
	optimizer.pushInstruction(block_then);
	consequent.call(null);
	optimizer.pushInstruction(new Goto(block_endif));
	if (alternative) {
		optimizer.pushInstruction(block_else);
		alternative.call(null);
	}
	optimizer.pushInstruction(block_endif);
	return {
		then: block_then,
		else: alternative ? block_else : null,
	};
}

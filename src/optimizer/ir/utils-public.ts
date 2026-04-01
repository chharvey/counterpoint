import type {
	Temp,
	Optimizer,
} from '../Optimizer.ts';
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
 * (DECL ‹result_type› $result_then ‹consequent›) ;; evaluate consequent and set to result
 * goto "endif".
 * "else":
 * (DECL ‹result_type› $result_else ‹alternative›) ;; evaluate alternative and set to result
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
	const label_then:  Label = optimizer.newLabel();
	const label_else:  Label = optimizer.newLabel();
	const label_endif: Label = optimizer.newLabel();

	optimizer.pushInstruction(new GotoIfFalse(condition.call(null), label_else));
	optimizer.pushInstruction(label_then);
	const result_then: Temp = optimizer.newTemp(consequent.call(null));
	optimizer.pushInstruction(new Goto(label_endif));
	optimizer.pushInstruction(label_else);
	const result_else: Temp = optimizer.newTemp(alternative.call(null));
	optimizer.pushInstruction(label_endif);
	return new Phi(
		[label_then, new Get(result_then)],
		[label_else, new Get(result_else)],
	);
}

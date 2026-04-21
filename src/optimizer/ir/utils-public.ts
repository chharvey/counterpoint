import {TYPE} from '../../typer/index.ts';
import type {
	Temp,
	Optimizer,
} from '../Optimizer.ts';
import {
	type Value,
	Get,
	Phi,
	Decl,
	Goto,
	GotoConditional,
} from './index.ts';



export enum TypeName {
	TRAP,
	NULL,
	BOOL,
	SYM,
	INT,
	NAT,
	FLOAT,
	STR,
	TUPLE,
	RECORD,
	LIST,
	DICT,
	SET,
	MAP,
	ANY,
}



export type CollectionDynamicName = (
	| TypeName.LIST
	| TypeName.DICT
	| TypeName.SET
	| TypeName.MAP
);



export function ast_type_name(typ: TYPE.Type): TypeName {
	switch (true) {
		case typ.isSubtypeOf(TYPE.NULL):  { return TypeName.NULL; }
		case typ.isSubtypeOf(TYPE.BOOL):  { return TypeName.BOOL; }
		case typ.isSubtypeOf(TYPE.SYM):   { return TypeName.SYM; }
		case typ.isSubtypeOf(TYPE.INT):   { return TypeName.INT; }
		case typ.isSubtypeOf(TYPE.NAT):   { return TypeName.NAT; }
		case typ.isSubtypeOf(TYPE.FLOAT): { return TypeName.FLOAT; }
		case typ.isSubtypeOf(TYPE.STR):   { return TypeName.STR; }

		case typ instanceof TYPE.Tuple:  { return TypeName.TUPLE; }
		case typ instanceof TYPE.Record: { return TypeName.RECORD; }
		case typ instanceof TYPE.List:   { return TypeName.LIST; }
		case typ instanceof TYPE.Dict:   { return TypeName.DICT; }
		case typ instanceof TYPE.Set:    { return TypeName.SET; }
		case typ instanceof TYPE.Map:    { return TypeName.MAP; }
	}

	if (typ instanceof TYPE.Union || typ instanceof TYPE.Intersection) {
		switch (true) {
			case typ.operands.every((op) => op instanceof TYPE.Tuple):  { return TypeName.TUPLE; }
			case typ.operands.every((op) => op instanceof TYPE.Record): { return TypeName.RECORD; }
			case typ.operands.every((op) => op instanceof TYPE.List):   { return TypeName.LIST; }
			case typ.operands.every((op) => op instanceof TYPE.Dict):   { return TypeName.DICT; }
			case typ.operands.every((op) => op instanceof TYPE.Set):    { return TypeName.SET; }
			case typ.operands.every((op) => op instanceof TYPE.Map):    { return TypeName.MAP; }
		}
	}
	return TypeName.ANY;
}



/**
 * Utilty for implementing a conditional expression CFG:
 * ```
 * (if ‹condition› then ‹consequent› else ‹alternative›)
 * ```
 * IR Outline:
 * ```
 * (GOTO.IF ‹condition› "then" "else")
 * "then":
 * (DECL ‹result_type› $result_then ‹consequent›) ;; evaluate consequent and set to result
 * (GOTO "endif")
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
	const label_then:  string = optimizer.newLabel();
	const label_else:  string = optimizer.newLabel();
	const label_endif: string = optimizer.newLabel();

	optimizer.terminateBlock(new GotoConditional(condition.call(null), label_then, label_else));

	optimizer.initiateBlock(label_then);
	const result_then: Temp = optimizer.newTemp(consequent.call(null));
	optimizer.pushInstruction(new Decl(result_then, result_then.value));
	optimizer.terminateBlock(new Goto(label_endif));

	optimizer.initiateBlock(label_else);
	const result_else: Temp = optimizer.newTemp(alternative.call(null));
	optimizer.pushInstruction(new Decl(result_else, result_else.value));
	optimizer.terminateBlock(new Goto(label_endif));

	optimizer.initiateBlock(label_endif);
	return new Phi(
		[label_then, new Get(result_then)],
		[label_else, new Get(result_else)],
	);
}

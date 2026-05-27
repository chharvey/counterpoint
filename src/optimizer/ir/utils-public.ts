import {TYPE} from '../../typer/index.ts';
import type {
	Temp,
	Builder,
} from '../Builder.ts';
import {
	type Value,
	Get,
	Decl,
	Set as IrSet,
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
 * (DECL ‹result_type› $result)
 * (GOTO.IF ‹condition› "then" "else")
 * "then":
 * (SET $result ‹consequent›)
 * (GOTO "endif")
 * "else":
 * (SET $result ‹alternative›)
 * (GOTO "endif")
 * "endif":
 * return (GET $result).
 * ```
 * @param optimizer
 * @param result_type the type of the expression’s value
 * @param condition
 * @param consequent
 * @param alternative
 * @return            a (GET) of the results based on the condition
 */
export function conditional_expression(
	optimizer:   Builder,
	result_type: TYPE.Type,
	condition:   () => Value,
	consequent:  () => Value,
	alternative: () => Value,
): Get {
	const label_then:  string = optimizer.newLabel();
	const label_else:  string = optimizer.newLabel();
	const label_endif: string = optimizer.newLabel();

	const result: Temp = optimizer.newTemp(result_type);
	optimizer.pushInstruction(new Decl(result));
	optimizer.terminateBlock(new GotoConditional(condition.call(null), label_then, label_else));

	optimizer.initiateBlock(label_then);
	optimizer.pushInstruction(new IrSet(result, consequent.call(null)));
	optimizer.terminateBlock(new Goto(label_endif));

	optimizer.initiateBlock(label_else);
	optimizer.pushInstruction(new IrSet(result, alternative.call(null)));
	optimizer.terminateBlock(new Goto(label_endif));

	optimizer.initiateBlock(label_endif);
	return new Get(result);
}

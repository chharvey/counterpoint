import {TYPE} from '../../typer/index.ts';
import type {
	Temp,
	Builder,
} from '../Builder.ts';
import {
	type Value,
	Get,
	Decl,
	Set as OpSet,
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
 * @param builder
 * @param result_type the type of the expression’s value
 * @param condition
 * @param consequent
 * @param alternative
 * @return            a (GET) of the results based on the condition
 */
export function conditional_expression(
	builder:   Builder,
	result_type: TYPE.Type,
	condition:   () => Value,
	consequent:  () => Value,
	alternative: () => Value,
): Get {
	const label_then:  string = builder.newLabel();
	const label_else:  string = builder.newLabel();
	const label_endif: string = builder.newLabel();

	const result: Temp = builder.newTemp(result_type);
	builder.pushInstruction(new Decl(result));
	builder.terminateBlock(new GotoConditional(condition.call(null), label_then, label_else));

	builder.initiateBlock(label_then);
	builder.pushInstruction(new OpSet(result, consequent.call(null)));
	builder.terminateBlock(new Goto(label_endif));

	builder.initiateBlock(label_else);
	builder.pushInstruction(new OpSet(result, alternative.call(null)));
	builder.terminateBlock(new Goto(label_endif));

	builder.initiateBlock(label_endif);
	return new Get(result);
}

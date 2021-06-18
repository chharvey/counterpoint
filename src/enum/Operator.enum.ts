// HACK: this is defined here, instead of in `../validator/ASTNode.ts`, to avoid circular imports.
export enum Operator {
	ORNULL,
	OREXCP,
	NOT,
	EMP,
	AFF,
	NEG,
	EXP,
	MUL,
	DIV,
	ADD,
	SUB,
	LT,
	GT,
	LE,
	GE,
	NLT,
	NGT,
	IS,
	ISNT,
	ID,
	NID,
	EQ,
	NEQ,
	AND,
	NAND,
	OR,
	NOR,
	COND,
}

export type ValidTypeOperator =
	| Operator.ORNULL
	| Operator.OREXCP
	| Operator.AND
	| Operator.OR

export type ValidOperatorUnary =
	| Operator.NOT
	| Operator.EMP
	| Operator.NEG

export type ValidOperatorBinary =
	| ValidOperatorArithmetic
	| ValidOperatorComparative
	| ValidOperatorEquality
	| ValidOperatorLogical

export type ValidOperatorArithmetic =
	| Operator.EXP
	| Operator.MUL
	| Operator.DIV
	| Operator.ADD

export type ValidOperatorComparative =
	| Operator.LT
	| Operator.LE
	| Operator.GT
	| Operator.GE
	| Operator.IS

export type ValidOperatorEquality =
	| Operator.ID
	| Operator.EQ

export type ValidOperatorLogical =
	| Operator.AND
	| Operator.OR

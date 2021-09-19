export enum Operator {
	DOT,      // Dev.supports('literalCollection')
	OPTDOT,   // Dev.supports('optionalAccess')
	CLAIMDOT, // Dev.supports('claimAccess')
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

export type ValidAccessOperator =
	| Operator.DOT
	| Operator.OPTDOT
	| Operator.CLAIMDOT

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

export enum Operator {
	DOT,
	DOT_MAY,
	DOT_RES,
	ORNULL,
	OREXCP,
	MUTABLE,
	NOT,
	EMP,
	AFF,
	NEG,
	ISSET,
	CAST,
	CAST_MAY,
	CAST_RES,
	EXP,
	MUL,
	DIV,
	ADD,
	SUB,
	LT,
	GT,
	LE,
	GE,
	IS,
	ISNT,
	ID,
	EQ,
	AND,
	OR,
	COND,
}

export type ValidTypeAccessOperator = (
	| Operator.DOT
	| Operator.DOT_MAY
);

export type ValidAccessOperator = (
	| Operator.DOT
	| Operator.DOT_MAY
	| Operator.DOT_RES
);

export type ValidTypeOperator = (
	| Operator.ORNULL
	| Operator.OREXCP
	| Operator.MUTABLE
	| Operator.AND
	| Operator.OR
);

export type ValidOperatorUnary = (
	| Operator.NOT
	| Operator.EMP
	| Operator.NEG
);

export type ValidOperatorCast = (
	| Operator.CAST
	| Operator.CAST_MAY
	| Operator.CAST_RES
);

export type ValidOperatorArithmetic = (
	| Operator.EXP
	| Operator.MUL
	| Operator.DIV
	| Operator.ADD
	| Operator.SUB
);

export type ValidOperatorComparative = (
	| Operator.LT
	| Operator.GT
	| Operator.LE
	| Operator.GE
);

export type ValidOperatorEquality = (
	| Operator.ID
	| Operator.EQ
);

export type ValidOperatorLogical = (
	| Operator.AND
	| Operator.OR
);

export type ValidOperatorBinary = (
	| ValidOperatorCast
	| ValidOperatorArithmetic
	| ValidOperatorComparative
	| ValidOperatorEquality
	| ValidOperatorLogical
);

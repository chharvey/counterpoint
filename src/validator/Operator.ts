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

export type ValidOperatorArithmetic = (
	| Operator.EXP
	| Operator.MUL
	| Operator.DIV
	| Operator.ADD
);

export type ValidOperatorComparative = (
	| Operator.LT
	| Operator.GT
	| Operator.LE
	| Operator.GE
	| Operator.NLT
	| Operator.NGT
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
	| ValidOperatorArithmetic
	| ValidOperatorComparative
	| ValidOperatorEquality
	| ValidOperatorLogical
);

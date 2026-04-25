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
	INT,
	NAT,
	FLOAT,
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
	NLT,
	NGT,
	IS,
	ISNT,
	ID,
	EQ,
	NID,
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
	| Operator.INT
	| Operator.NAT
	| Operator.FLOAT
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
	| Operator.NLT
	| Operator.NGT
);

export type ValidOperatorEquality = (
	| Operator.ID
	| Operator.EQ
	| Operator.NID
	| Operator.NEQ
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

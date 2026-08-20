export enum Operator {
	DOT,
	DOT_MAYBE,
	DOT_RESULT,
	MAYBE,
	RESULT,
	MUTABLE,
	UN_MAYBE,
	UN_RESULT,
	NOT,
	EMP,
	AFF,
	NEG,
	CAST,
	CAST_MAYBE,
	CAST_RESULT,
	IS,
	ISNT,
	EXP,
	MUL,
	DIV,
	ADD,
	SUB,
	LT,
	GT,
	LE,
	GE,
	ID,
	EQ,
	AND,
	OR,
	COND,
}

export type ValidTypeAccessOperator = (
	| Operator.DOT
	| Operator.DOT_MAYBE
);

export type ValidAccessOperator = (
	| Operator.DOT
	| Operator.DOT_MAYBE
	| Operator.DOT_RESULT
);

export type ValidTypeOperator = (
	| Operator.MAYBE
	| Operator.RESULT
	| Operator.MUTABLE
	| Operator.AND
	| Operator.OR
);

export type ValidOperatorUnary = (
	| Operator.UN_MAYBE
	| Operator.UN_RESULT
	| Operator.NOT
	| Operator.EMP
	| Operator.NEG
);

export type ValidOperatorCast = (
	| Operator.IS
	| Operator.CAST
	| Operator.CAST_MAYBE
	| Operator.CAST_RESULT
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

/* eslint-disable @typescript-eslint/no-duplicate-enum-values --- some punctuators are “homonyms”: same symbol, different meaning */
export enum Punctuator {
	// grouping
	GRP_OPN  = '(',
	GRP_CLS  = ')',
	BRAK_OPN = '[',
	BRAK_CLS = ']',
	BRAC_OPN = '{',
	BRAC_CLS = '}',
	COMMA    = ',',
	MAPTO    = '->',
	OPT      = '?:',

	// compound
	DOT     = '.',
	DOT_MAY = '?.',
	DOT_RES = '!.',

	// unary
	NOT    = '!',
	EMP    = '?',
	AFF    = '+',
	NEG    = '-',
	ORNULL = '?',
	OREXCP = '!',

	// binary
	EXP   = '^',
	MUL   = '*',
	DIV   = '/',
	ADD   = '+',
	SUB   = '-',
	LT    = '<',
	GT    = '>',
	LE    = '<=',
	GE    = '>=',
	NLT   = '!<',
	NGT   = '!>',
	ID    = '===',
	NID   = '!==',
	EQ    = '==',
	NEQ   = '!=',
	AND   = '&&',
	NAND  = '!&',
	OR    = '||',
	NOR   = '!|',
	INTER = '&',
	UNION = '|',

	// statement
	ENDSTAT = ';',
	ISTYPE  = ':',
	ASSIGN  = '=',

	// storage
	LAMBDA_START = '\\',
	IMPL_RTN     = '=>',
}

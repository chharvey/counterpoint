export enum Punctuator {
	// grouping
		GRP_OPN = '(',
		GRP_CLS = ')',
		BRAK_OPN = '[',
		BRAK_CLS = ']',
		BRAC_OPN = '{',
		BRAC_CLS = '}',
		CONST    = '@',
		COMMA    = ',',
		MAPTO    = '->',
	// compound
		DOT      = '.',
		OPTDOT   = '?.',
		CLAIMDOT = '!.',
	// unary
		NOT = '!',
		EMP = '?',
		AFF = '+',
		NEG = '-',
		ORNULL = '?',
		OREXCP = '!',
	// binary
		EXP  = '^',
		MUL  = '*',
		DIV  = '/',
		ADD  = '+',
		SUB  = '-',
		LT   = '<',
		GT   = '>',
		LE   = '<=',
		GE   = '>=',
		NLT  = '!<',
		NGT  = '!>',
		ID   = '===',
		NID  = '!==',
		EQ   = '==',
		NEQ  = '!=',
		AND  = '&&',
		NAND = '!&',
		OR   = '||',
		NOR  = '!|',
		INTER = '&',
		UNION = '|',
	// statement
		ENDSTAT = ';',
		ISTYPE  = ':',
		OPT     = '?:',
		ASSIGN  = '=',
}



/** An iterable list of unique punctuators. */
export const PUNCTUATORS: readonly Punctuator[] = [...new Set(Object.values(Punctuator))];

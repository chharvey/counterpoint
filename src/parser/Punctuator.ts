export enum Punctuator {
	// grouping
		GRP_OPN = '(',
		GRP_CLS = ')',
		BRAK_OPN = '[',   // Dev.supports('literalCollection')
		BRAK_CLS = ']',   // Dev.supports('literalCollection')
		COMMA    = ',',   // Dev.supports('literalCollection')
		MAPTO    = '|->', // Dev.supports('literalCollection')
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
		ASSIGN  = '=', // Dev.supports('literalCollection')
}

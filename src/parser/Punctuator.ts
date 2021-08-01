export enum Punctuator {
	// grouping
		GRP_OPN = '(',
		GRP_CLS = ')',
		BRAK_OPN = '[',   // Dev.supports('literalCollection')
		BRAK_CLS = ']',   // Dev.supports('literalCollection')
		BRAC_OPN = '{',   // Dev.supports('literalCollection')
		BRAC_CLS = '}',   // Dev.supports('literalCollection')
		COMMA    = ',',   // Dev.supports('literalCollection')
		MAPTO    = '|->', // Dev.supports('literalCollection')
	// compound
		DOT      = '.',  // Dev.supports('literalCollection')
		OPTDOT   = '?.', // Dev.supports('optionalAccess')
		CLAIMDOT = '!.', // Dev.supports('claimAccess')
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
		OPT     = '?:', // Dev.supports('optionalEntries')
		ASSIGN  = '=', // Dev.supports('literalCollection')
}

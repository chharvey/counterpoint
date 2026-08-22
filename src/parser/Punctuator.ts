export enum Punctuator {
	// grouping
	PAREN_OPN  = '(',
	PAREN_CLS  = ')',
	BRACK_OPN = '[',
	BRACK_CLS = ']',
	BRACE_OPN = '{',
	BRACE_CLS = '}',
	COMMA     = ',',
	THIN_ARR  = '->',

	// compound
	DOT      = '.',
	QUST_DOT = '?.',
	BANG_DOT = '!.',
	TILD_QST = '~?',
	TILD_BNG = '~!',

	// unary
	BANG  = '!',
	QUST  = '?',
	PLUS  = '+',
	MINUS = '-',

	// binary
	CFLEX    = '^',
	ASTK     = '*',
	SLASH    = '/',
	LT       = '<',
	GT       = '>',
	LT_EQ    = '<=',
	GT_EQ    = '>=',
	BANG_LT  = '!<',
	BANG_GT  = '!>',
	EQ3      = '===',
	BANG_EQ2 = '!==',
	EQ2      = '==',
	BANG_EQ  = '!=',
	AMP2     = '&&',
	BANG_AMP = '!&',
	BAR2     = '||',
	BANG_BAR = '!|',
	AMP      = '&',
	BAR      = '|',

	// statement
	SEMI   = ';',
	COLON  = ':',
	EQ     = '=',
}

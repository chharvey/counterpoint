export enum Keyword {
	// type literal
	NOTHING  = 'nothing',
	VOID     = 'void',
	BOOL     = 'bool',
	SYM      = 'sym',
	INT      = 'int',
	FLOAT    = 'float',
	STR      = 'str',
	ANYTHING = 'anything',

	// value literal
	NULL  = 'null',
	FALSE = 'false',
	TRUE  = 'true',

	// operator
	MUTABLE = 'mut',
	AS      = 'as',
	AS_MAY  = 'as?',
	AS_RES  = 'as!',
	IS      = 'is',
	ISNT    = 'isnt',
	IF      = 'if',
	THEN    = 'then',
	ELSE    = 'else',

	// storage
	TYPE  = 'type',
	LET   = 'let',
	CLAIM = 'claim',
	SET   = 'set',
	BLANK = '_',

	// modifier
	NOMINAL = 'nominal',
	UNFIXED = 'var',

	// control
	UNLESS = 'unless',
}



/** An iterable list of unique keywords. */
export const KEYWORDS: readonly Keyword[] = [...new Set<Keyword>(Object.values(Keyword))];

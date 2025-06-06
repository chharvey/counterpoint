export enum Keyword {
	// type literal
	NEVER   = 'never',
	VOID    = 'void',
	BOOL    = 'bool',
	SYM     = 'sym',
	INT     = 'int',
	FLOAT   = 'float',
	STR     = 'str',
	UNKNOWN = 'unknown',

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
	BLANK = '_',

	// modifier
	UNFIXED = 'var',
}



/** An iterable list of unique keywords. */
export const KEYWORDS: readonly Keyword[] = [...new Set<Keyword>(Object.values(Keyword))];

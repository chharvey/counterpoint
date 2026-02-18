export enum Keyword {
	// type literal
	NEVER   = 'never',
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
	IS      = 'is',
	ISNT    = 'isnt',
	IF      = 'if',
	THEN    = 'then',
	ELSE    = 'else',

	// storage
	TYPE  = 'type',
	LET   = 'val',
	BLANK = '_',
	VOID  = 'void',

	// modifier
	UNFIXED = 'mut', // eslint-disable-line @typescript-eslint/no-duplicate-enum-values
}



/** An iterable list of unique keywords. */
export const KEYWORDS: readonly Keyword[] = [...new Set<Keyword>(Object.values(Keyword))];

export enum Keyword {
	// type literal
	NOTHING  = 'nothing',
	BOOL     = 'bool',
	SYM      = 'sym',
	INT      = 'int',
	NAT      = 'nat',
	FLOAT    = 'float',
	STR      = 'str',
	ANYTHING = 'anything',

	// value literal
	NULL  = 'null',
	FALSE = 'false',
	TRUE  = 'true',

	// operator
	MUTABLE = 'mut',
	ISSET   = 'isset',
	ISNTSET = '!isset',
	AS      = 'as',
	AS_MAY  = 'as?',
	AS_RES  = 'as!',
	IS      = 'is',
	ISNT    = '!is',
	IF      = 'if',
	THEN    = 'then',
	ELSE    = 'else',

	// storage
	TYPE   = 'type',
	LET    = 'val',
	CLAIM  = 'claim',
	SET    = 'set',
	DELETE = 'delete',
	BLANK  = '_',
	VOID   = 'void',

	// modifier
	NOMINAL  = 'nominal',
	WRITABLE = 'mut', // eslint-disable-line @typescript-eslint/no-duplicate-enum-values

	// control
	UNLESS = 'unless',
	WHILE  = 'while',
	UNTIL  = 'until',
	FOR    = 'for',
	IN     = 'in',
	DO     = 'do',
	BREAK  = 'break',
	SKIP   = 'skip',
}



/** An iterable list of unique keywords. */
export const KEYWORDS: readonly Keyword[] = [...new Set<Keyword>(Object.values(Keyword))];

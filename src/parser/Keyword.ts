export enum Keyword {
	// type literal
		NEVER   = 'never',
		VOID    = 'void',
		BOOL    = 'bool',
		INT     = 'int',
		FLOAT   = 'float',
		STR     = 'str',
		UNKNOWN = 'unknown',
	// value literal
		NULL  = 'null',
		FALSE = 'false',
		TRUE  = 'true',
	// operator
		MUTABLE = 'mutable',
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
	// modifier
		UNFIXED = 'unfixed',
}



/** An iterable list of unique keywords. */
export const KEYWORDS: readonly Keyword[] = [...new Set<Keyword>(Object.values(Keyword))];

export enum Keyword {
	// type literal
		VOID  = 'void',
		BOOL  = 'bool',
		INT   = 'int',
		FLOAT = 'float',
		STR   = 'str',
		OBJ   = 'obj',
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
		TYPE = 'type',
		LET  = 'let',
	// modifier
		UNFIXED = 'unfixed',
}

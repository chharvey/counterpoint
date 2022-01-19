export enum Keyword {
	// literal
		VOID  = 'void',
		NULL  = 'null',
		BOOL  = 'bool',
		FALSE = 'false',
		TRUE  = 'true',
		INT   = 'int',
		FLOAT = 'float',
		STR   = 'str',
		OBJ   = 'obj',
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
	// modifier
		UNFIXED = 'unfixed',
}

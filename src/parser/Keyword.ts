export enum Keyword {
	// literal
		NULL  = 'null',
		BOOL  = 'bool',
		FALSE = 'false',
		TRUE  = 'true',
		INT   = 'int',
		FLOAT = 'float',
		STR   = 'str',
		OBJ   = 'obj',
	// operator
		IS   = 'is',
		ISNT = 'isnt',
		IF   = 'if',
		THEN = 'then',
		ELSE = 'else',
	// storage
		LET  = 'let',
		TYPE = 'type',
	// modifier
		UNFIXED = 'unfixed',
}

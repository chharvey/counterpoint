/** Built-in class names. May be referenced as types or as constructors. */
export enum IntrinsicName {
	NULL    = 'Null',
	BOOLEAN = 'Boolean',
	SYMBOL  = 'Symbol',
	INTEGER = 'Integer',
	NATURAL = 'Natural',
	FLOAT   = 'Float',
	STRING  = 'String',
	OBJECT  = 'Object',
	LIST    = 'List',
	DICT    = 'Dict',
	SET     = 'Set',
	MAP     = 'Map',
	MAYBE   = 'Maybe',
	NONE    = 'None',
	SOME    = 'Some',
}



export const INTRINSICS: readonly IntrinsicName[] = Object.values(IntrinsicName);

/** Built-in class names. May be referenced as types or as constructors. */
export enum CoreLibName {
	NULL      = 'Null',
	BOOLEAN   = 'Boolean',
	SYMBOL    = 'Symbol',
	INTEGER   = 'Integer',
	NATURAL   = 'Natural',
	FLOAT     = 'Float',
	STRING    = 'String',
	OBJECT    = 'Object',
	LIST      = 'List',
	DICT      = 'Dict',
	SET       = 'Set',
	MAP       = 'Map',
	EXCEPTION = 'Exception',
	MAYBE     = 'Maybe',
	NONE      = 'None',
	SOME      = 'Some',
	RESULT    = 'Result',
	FAIL      = 'Fail',
	OK        = 'Ok',
	FUNCTION  = 'Function',
	CLASS     = 'Class',
}



export const CORE_LIB_NAMES: readonly CoreLibName[] = Object.values(CoreLibName);

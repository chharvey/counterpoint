/*
 * -- Internal package use only! --
 * The following components are re-exports from other packages.
 * Other packages should not import them from here;
 * they are only for modules within this package.
 */
export {
	SolidType,
	SolidTypeIntersection,
	SolidTypeUnion,
	SolidTypeUnit,
	SolidTypeTuple,
	SolidTypeRecord,
	SolidTypeList,
	SolidTypeDict,
	SolidTypeSet,
	SolidTypeMap,
	SolidObject,
	Primitive,
	SolidNull,
	SolidBoolean,
	SolidNumber,
	Int16,
	Float64,
	SolidString,
	CollectionIndexed,
	CollectionKeyed,
	SolidTuple,
	SolidRecord,
	SolidList,
	SolidDict,
	SolidSet,
	SolidMap,
	Instruction,
	INST,
	Builder,
	ErrorCode,
	LexError01,
	ReferenceError01,
	ReferenceError03,
	AssignmentError01,
	AssignmentError10,
	SolidTypeError,
	TypeError01,
	TypeError02,
	TypeError03,
	TypeError04,
	TypeError05,
	TypeError06,
	MutabilityError01,
	NanError01,
	NanError02,
} from '../index.js';
export {
	NonemptyArray,
	CodeUnit,
	memoizeMethod,
	memoizeGetter,
} from '../lib/index.js';
export {
	stringifyAttributes,
	SolidConfig,
	CONFIG_DEFAULT,
	Serializable,
	serialize,
} from '../core/index.js';
export {
	TS_PARSER,
	Punctuator,
	PUNCTUATORS,
	Keyword,
	KEYWORDS,
} from '../parser/index.js';

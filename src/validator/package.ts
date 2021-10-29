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
	SolidTypeHash,
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
	SolidHash,
	SolidSet,
	SolidMap,
	Instruction,
	INST,
	Builder,
	ErrorCode,
	ReferenceError01,
	ReferenceError03,
	AssignmentError01,
	AssignmentError10,
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
} from '../lib/index.js';
export {
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
	Serializable,
} from '../core/index.js';
export {
	stringifyAttributes,
	Punctuator,
	Keyword,
	Token,
	// {TokenPunctuator, TokenKeyword, ...} as TOKEN,
	ParserSolid,
	ParseNode,
	PARSENODE,
	PARSER,
} from '../parser/index.js';
export * as TOKEN from '../parser/token/index.js'; // HACK

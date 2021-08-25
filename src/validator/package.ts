/*
 * -- Internal package use only! --
 * The following components are re-exports from other packages.
 * Other packages should not import them from here;
 * they are only for modules within this package.
 */
export {
	ReferenceError01,
	ReferenceError03,
	AssignmentError01,
	AssignmentError10,
	TypeError01,
	TypeError02,
	TypeError03,
	TypeError04,
	NanError01,
	NanError02,
} from '../index.js';
export {
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
} from '../core/index.js';
export {
	Punctuator,
	Keyword,
	TOKEN,
	ParserSolid as Parser,
	PARSER,
} from '../parser/index.js';
export {
	SolidType,
	SolidTypeIntersection,
	SolidTypeUnion,
	SolidTypeConstant,
	SolidTypeTuple,
	SolidTypeRecord,
	SolidTypeSet,
	SolidTypeMapping,
	SolidObject,
	SolidNull,
	SolidBoolean,
	SolidNumber,
	Int16,
	Float64,
	SolidString,
	SolidTuple,
	SolidRecord,
	SolidSet,
	SolidMapping,
} from '../typer/index.js';
export {
	Instruction,
	INST,
	Builder,
} from '../builder/index.js';

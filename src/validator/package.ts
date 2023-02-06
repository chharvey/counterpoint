/*
 * -- Internal package use only! --
 * The following components are re-exports from other packages.
 * Other packages should not import them from here;
 * they are only for modules within this package.
 */
export {
	TYPE,
	OBJ,
	Builder,
	ErrorCode,
	LexError01,
	ParseError01,
	ReferenceError01,
	ReferenceError03,
	AssignmentError01,
	AssignmentError02,
	AssignmentError10,
	TypeError,
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
	throw_expression,
} from '../lib/index.js';
export {
	stringifyAttributes,
	CPConfig,
	CONFIG_DEFAULT,
} from '../core/index.js';
export {
	TS_PARSER,
	Punctuator,
	PUNCTUATORS,
	Keyword,
	KEYWORDS,
	Serializable,
	to_serializable,
} from '../parser/index.js';

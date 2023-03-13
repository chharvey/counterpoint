/*
 * -- Internal package use only! --
 * The following components are re-exports from other packages.
 * Other packages should not import them from here;
 * they are only for modules within this package.
 */
export {
	TYPE,
	OBJ,
	INST,
	Builder,
	ErrorCode,
	LexError01,
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
	CodeUnit,
} from '../lib/index.js';
export {
	stringifyAttributes,
	CPConfig,
	CONFIG_DEFAULT,
	Dev,
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

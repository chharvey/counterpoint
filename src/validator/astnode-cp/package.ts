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
	NonemptyArray,
	throw_expression,
	CPConfig,
	CONFIG_DEFAULT,
	TS_PARSER,
	Keyword,
	Serializable,
	to_serializable,
} from '../package.js';
export {
	DECORATOR,
	Validator,
	SymbolKind,
	SymbolStructure,
	SymbolStructureVar,
	SymbolStructureType,
} from '../index.js';
export {
	SyntaxNodeType,
	isSyntaxNodeType,
	SyntaxNodeSupertype,
} from '../utils-private.js';
export {
	Operator,
	ValidAccessOperator,
	ValidTypeOperator,
	ValidOperatorUnary,
	ValidOperatorBinary,
	ValidOperatorArithmetic,
	ValidOperatorComparative,
	ValidOperatorEquality,
	ValidOperatorLogical,
} from '../Operator.js';
export {ASTNode} from '../ASTNode.js';

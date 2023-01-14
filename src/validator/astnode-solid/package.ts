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
	NonemptyArray,
	forEachAggregated,
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
	Serializable,
	stringifyAttributes,
	Keyword,
	Token,
	TOKEN_SOLID as TOKEN,
	ParseNode,
	PARSENODE_SOLID as PARSENODE,
	ParserSolid,
	PARSER_SOLID as PARSER,
} from '../package.js';
export {
	DECORATOR_SOLID as DECORATOR,
	Validator,
	SymbolKind,
	SymbolStructure,
	SymbolStructureVar,
	SymbolStructureType,
} from '../index.js';
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
} from '../OperatorSolid.js';
export {ASTNode} from '../ASTNode.js';

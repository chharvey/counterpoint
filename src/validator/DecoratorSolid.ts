import type {SyntaxNode} from 'tree-sitter';
import {
	NonemptyArray,
	SolidConfig,
	CONFIG_DEFAULT,
	Punctuator,
	Keyword,
	TOKEN_SOLID as TOKEN,
	ParseNode,
	PARSENODE_SOLID as PARSENODE,
} from './package.js';
import {
	SyntaxNodeType,
	isSyntaxNodeType,
} from './utils-private.js';
import {
	Operator,
	ValidAccessOperator,
	ValidTypeOperator,
	ValidOperatorUnary,
	ValidOperatorArithmetic,
	ValidOperatorComparative,
	ValidOperatorEquality,
	ValidOperatorLogical,
} from './OperatorSolid.js';
import * as AST from './astnode-solid/index.js';
import {
	DecoratorReturnType,
	Decorator,
} from './Decorator.js';
import * as h from '../../test/helpers-parse.js';



type Category =
	| 'type'
	| 'expression'
	| 'declaration'
	| 'statement'
;
type SyntaxNodeSupertype<C extends Category> = C extends 'type' ?
	| SyntaxNodeType<'primitive_literal'>
	| SyntaxNodeType<'type_grouped'>
	| SyntaxNodeType<'type_tuple_literal'>
	| SyntaxNodeType<'type_record_literal'>
	| SyntaxNodeType<'type_hash_literal'>
	| SyntaxNodeType<'type_map_literal'>
	| SyntaxNodeType<'type_compound'>
	| SyntaxNodeType<'type_unary_symbol'>
	| SyntaxNodeType<'type_unary_keyword'>
	| SyntaxNodeType<'type_intersection'>
	| SyntaxNodeType<'type_union'>
: C extends 'expression' ?
	| SyntaxNodeType<'primitive_literal'>
	| SyntaxNodeType<'string_template'>
	| SyntaxNodeType<'expression_grouped'>
	| SyntaxNodeType<'tuple_literal'>
	| SyntaxNodeType<'record_literal'>
	| SyntaxNodeType<'set_literal'>
	| SyntaxNodeType<'map_literal'>
	| SyntaxNodeType<'expression_compound'>
	| SyntaxNodeType<'expression_unary_symbol'>
	| SyntaxNodeType<'expression_exponential'>
	| SyntaxNodeType<'expression_multiplicative'>
	| SyntaxNodeType<'expression_additive'>
	| SyntaxNodeType<'expression_comparative'>
	| SyntaxNodeType<'expression_equality'>
	| SyntaxNodeType<'expression_conjunctive'>
	| SyntaxNodeType<'expression_disjunctive'>
	| SyntaxNodeType<'expression_conditional'>
: C extends 'declaration' ?
	| SyntaxNodeType<'declaration_type'>
	| SyntaxNodeType<'declaration_variable'>
: C extends 'statement' ?
	| SyntaxNodeSupertype<'declaration'>
	| SyntaxNodeType<'statement_expression'>
	| SyntaxNodeType<'statement_assignment'>
: never;
function isSyntaxNodeSupertype<C extends Category>(node: SyntaxNode, category: C): node is SyntaxNodeSupertype<C> {
	return new Map<Category, (node: SyntaxNode) => boolean>([
		['type',        (node) => isSyntaxNodeType(node, /^primitive_literal|type_grouped|type_tuple_literal|type_record_literal|type_hash_literal|type_map_literal|type_compound|type_unary_symbol|type_unary_keyword|type_intersection|type_union$/)],
		['expression',  (node) => isSyntaxNodeType(node, /^primitive_literal|string_template|expression_grouped|tuple_literal|record_literal|set_literal|map_literal|expression_compound|expression_unary_symbol|expression_exponential|expression_multiplicative|expression_additive|expression_comparative|expression_equality|expression_conjunctive|expression_disjunctive|expression_conditional$/)],
		['declaration', (node) => isSyntaxNodeType(node, /^declaration_type|declaration_variable$/)],
		['statement',   (node) => isSyntaxNodeType(node, /^statement_expression|statement_assignment$/) || isSyntaxNodeSupertype(node, 'declaration')],
	]).get(category)!(node);
}

type TemplatePartialType = // FIXME spread types
	| [                        AST.ASTNodeConstant                       ]
	| [                        AST.ASTNodeConstant, AST.ASTNodeExpression]
	// | [...TemplatePartialType, AST.ASTNodeConstant                       ]
	// | [...TemplatePartialType, AST.ASTNodeConstant, AST.ASTNodeExpression]
	| AST.ASTNodeExpression[]
;



class DecoratorSolid extends Decorator {
	private static readonly ACCESSORS: ReadonlyMap<Punctuator, ValidAccessOperator> = new Map<Punctuator, ValidAccessOperator>([
		[Punctuator.DOT,      Operator.DOT],
		[Punctuator.OPTDOT,   Operator.OPTDOT],
		[Punctuator.CLAIMDOT, Operator.CLAIMDOT],
	]);
	private static readonly TYPEOPERATORS_UNARY: ReadonlyMap<Punctuator | Keyword, ValidTypeOperator> = new Map<Punctuator | Keyword, ValidTypeOperator>([
		[Punctuator.ORNULL,  Operator.ORNULL],
		[Punctuator.OREXCP,  Operator.OREXCP],
		[Keyword   .MUTABLE, Operator.MUTABLE],
	])
	private static readonly TYPEOPERATORS_BINARY: ReadonlyMap<Punctuator, ValidTypeOperator> = new Map<Punctuator, ValidTypeOperator>([
		[Punctuator.INTER, Operator.AND],
		[Punctuator.UNION, Operator.OR],
	])
	private static readonly OPERATORS_UNARY: ReadonlyMap<Punctuator, Operator> = new Map<Punctuator, Operator>([
		[Punctuator.NOT, Operator.NOT],
		[Punctuator.EMP, Operator.EMP],
		[Punctuator.AFF, Operator.AFF],
		[Punctuator.NEG, Operator.NEG],
	])
	private static readonly OPERATORS_BINARY: ReadonlyMap<Punctuator | Keyword, Operator> = new Map<Punctuator | Keyword, Operator>([
		[Punctuator.EXP,  Operator.EXP],
		[Punctuator.MUL,  Operator.MUL],
		[Punctuator.DIV,  Operator.DIV],
		[Punctuator.ADD,  Operator.ADD],
		[Punctuator.SUB,  Operator.SUB],
		[Punctuator.LT,   Operator.LT],
		[Punctuator.GT,   Operator.GT],
		[Punctuator.LE,   Operator.LE],
		[Punctuator.GE,   Operator.GE],
		[Punctuator.NLT,  Operator.NLT],
		[Punctuator.NGT,  Operator.NGT],
		[Keyword   .IS,   Operator.IS],
		[Keyword   .ISNT, Operator.ISNT],
		[Punctuator.ID,   Operator.ID],
		[Punctuator.NID,  Operator.NID],
		[Punctuator.EQ,   Operator.EQ],
		[Punctuator.NEQ,  Operator.NEQ],
		[Punctuator.AND,  Operator.AND],
		[Punctuator.NAND, Operator.NAND],
		[Punctuator.OR,   Operator.OR],
		[Punctuator.NOR,  Operator.NOR],
	])


	override decorate(node: PARSENODE.ParseNodeWord):             AST.ASTNodeKey;
	override decorate(node: PARSENODE.ParseNodePrimitiveLiteral): AST.ASTNodeConstant;
	override decorate(node:
		| PARSENODE.ParseNodeEntryType
		| PARSENODE.ParseNodeEntryType_Optional
	): AST.ASTNodeItemType;
	override decorate(node:
		| PARSENODE.ParseNodeEntryType_Named
		| PARSENODE.ParseNodeEntryType_Named_Optional
	): AST.ASTNodePropertyType;
	override decorate(node: PARSENODE.ParseNodeItemsType):          NonemptyArray<AST.ASTNodeItemType>;
	override decorate(node: PARSENODE.ParseNodePropertiesType):     NonemptyArray<AST.ASTNodePropertyType>;
	override decorate(node: PARSENODE.ParseNodeTypeTupleLiteral):   AST.ASTNodeTypeTuple;
	override decorate(node: PARSENODE.ParseNodeTypeRecordLiteral):  AST.ASTNodeTypeRecord;
	override decorate(node: PARSENODE.ParseNodeTypeHashLiteral):    AST.ASTNodeTypeHash;
	override decorate(node: PARSENODE.ParseNodeTypeMapLiteral):     AST.ASTNodeTypeMap;
	override decorate(node: PARSENODE.ParseNodeGenericArguments):   NonemptyArray<AST.ASTNodeType>;
	override decorate(node: PARSENODE.ParseNodePropertyAccessType): AST.ASTNodeIndexType | AST.ASTNodeKey;
	override decorate(node: PARSENODE.ParseNodeGenericCall):        NonemptyArray<AST.ASTNodeType>;
	override decorate(node:
		| PARSENODE.ParseNodeTypeUnit
		| PARSENODE.ParseNodeTypeCompound
		| PARSENODE.ParseNodeTypeUnarySymbol
		| PARSENODE.ParseNodeTypeUnaryKeyword
		| PARSENODE.ParseNodeTypeIntersection
		| PARSENODE.ParseNodeTypeUnion
		| PARSENODE.ParseNodeType
	): AST.ASTNodeType;
	override decorate(node: PARSENODE.ParseNodeStringTemplate):          AST.ASTNodeTemplate;
	override decorate(node: PARSENODE.ParseNodeStringTemplate__0__List): TemplatePartialType;
	override decorate(node: PARSENODE.ParseNodeProperty):                AST.ASTNodeProperty;
	override decorate(node: PARSENODE.ParseNodeCase):                    AST.ASTNodeCase;
	override decorate(node: PARSENODE.ParseNodeTupleLiteral):            AST.ASTNodeTuple;
	override decorate(node: PARSENODE.ParseNodeRecordLiteral):           AST.ASTNodeRecord;
	override decorate(node: PARSENODE.ParseNodeSetLiteral):              AST.ASTNodeSet;
	override decorate(node: PARSENODE.ParseNodeMapLiteral):              AST.ASTNodeMap;
	override decorate(node: PARSENODE.ParseNodeFunctionArguments):       AST.ASTNodeExpression[];
	override decorate(node: PARSENODE.ParseNodePropertyAccess):          AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression;
	override decorate(node: PARSENODE.ParseNodePropertyAssign):          AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression;
	override decorate(node: PARSENODE.ParseNodeFunctionCall):            [AST.ASTNodeType[], AST.ASTNodeExpression[]];
	override decorate(node: PARSENODE.ParseNodeAssignee):                AST.ASTNodeVariable | AST.ASTNodeAccess;
	override decorate(node:
		| PARSENODE.ParseNodeExpressionUnit
		| PARSENODE.ParseNodeExpressionCompound
		| PARSENODE.ParseNodeExpressionUnarySymbol
		| PARSENODE.ParseNodeExpressionExponential
		| PARSENODE.ParseNodeExpressionMultiplicative
		| PARSENODE.ParseNodeExpressionAdditive
		| PARSENODE.ParseNodeExpressionComparative
		| PARSENODE.ParseNodeExpressionEquality
		| PARSENODE.ParseNodeExpressionConjunctive
		| PARSENODE.ParseNodeExpressionDisjunctive
		| PARSENODE.ParseNodeExpression
	): AST.ASTNodeExpression;
	override decorate(node: PARSENODE.ParseNodeExpressionConditional): AST.ASTNodeOperationTernary;
	override decorate(node: PARSENODE.ParseNodeDeclarationType):       AST.ASTNodeDeclarationType;
	override decorate(node: PARSENODE.ParseNodeDeclarationVariable):   AST.ASTNodeDeclarationVariable;
	override decorate(node: PARSENODE.ParseNodeDeclaration):           AST.ASTNodeDeclaration;
	override decorate(node: PARSENODE.ParseNodeStatementExpression):   AST.ASTNodeStatementExpression;
	override decorate(node: PARSENODE.ParseNodeStatementAssignment):   AST.ASTNodeAssignment;
	override decorate(node: PARSENODE.ParseNodeStatement):             AST.ASTNodeStatement;
	override decorate(node: PARSENODE.ParseNodeGoal, config?: SolidConfig): AST.ASTNodeGoal;
	override decorate(node: ParseNode): DecoratorReturnType;
	override decorate(node: ParseNode, config: SolidConfig = CONFIG_DEFAULT): DecoratorReturnType {
		if (node instanceof PARSENODE.ParseNodeWord) {
			return new AST.ASTNodeKey(node.children[0] as TOKEN.TokenKeyword | TOKEN.TokenIdentifier);

		} else if (node instanceof PARSENODE.ParseNodePrimitiveLiteral) {
			return new AST.ASTNodeConstant(node.children[0] as TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString);

		} else if (node instanceof PARSENODE.ParseNodeEntryType) {
			return new AST.ASTNodeItemType(
				node,
				false,
				this.decorate(node.children[0]),
			);

		} else if (node instanceof PARSENODE.ParseNodeEntryType_Optional) {
			return new AST.ASTNodeItemType(
				node,
				true,
				this.decorate(node.children[1]),
			);

		} else if (node instanceof PARSENODE.ParseNodeEntryType_Named) {
			return new AST.ASTNodePropertyType(
				node,
				false,
				this.decorate(node.children[0]),
				this.decorate(node.children[2]),
			);

		} else if (node instanceof PARSENODE.ParseNodeEntryType_Named_Optional) {
			return new AST.ASTNodePropertyType(
				node,
				true,
				this.decorate(node.children[0]),
				this.decorate(node.children[2]),
			);

		} else if (node instanceof PARSENODE.ParseNodeItemsType) {
			return (node.children.length <= 2)
				? this.parseList<PARSENODE.ParseNodeEntryType | PARSENODE.ParseNodeEntryType_Optional, AST.ASTNodeItemType>(node.children[0])
				: [
					...this.parseList<PARSENODE.ParseNodeEntryType,          AST.ASTNodeItemType>(node.children[0] as PARSENODE.ParseNodeItemsType__0__List),
					...this.parseList<PARSENODE.ParseNodeEntryType_Optional, AST.ASTNodeItemType>(node.children[2]!),
				];

		} else if (node instanceof PARSENODE.ParseNodePropertiesType) {
			return this.parseList<PARSENODE.ParseNodeEntryType_Named | PARSENODE.ParseNodeEntryType_Named_Optional, AST.ASTNodePropertyType>(node.children[0]);

		} else if (node instanceof PARSENODE.ParseNodeTypeGrouped) {
			return this.decorate(node.children[1]);

		} else if (node instanceof PARSENODE.ParseNodeTypeTupleLiteral) {
			return new AST.ASTNodeTypeTuple(node, (node.children.length === 2) ? [] : this.decorate(
				node.children.find((c): c is PARSENODE.ParseNodeItemsType => c instanceof PARSENODE.ParseNodeItemsType)!
			));

		} else if (node instanceof PARSENODE.ParseNodeTypeRecordLiteral) {
			return new AST.ASTNodeTypeRecord(node, this.decorate(
				node.children.find((c): c is PARSENODE.ParseNodePropertiesType => c instanceof PARSENODE.ParseNodePropertiesType)!
			));

		} else if (node instanceof PARSENODE.ParseNodeTypeHashLiteral) {
			return new AST.ASTNodeTypeHash(node, this.decorate(node.children[2]));

		} else if (node instanceof PARSENODE.ParseNodeTypeMapLiteral) {
			return new AST.ASTNodeTypeMap(node, this.decorate(node.children[1]), this.decorate(node.children[3]));

		} else if (node instanceof PARSENODE.ParseNodeGenericArguments) {
			return this.parseList<PARSENODE.ParseNodeType, AST.ASTNodeType>(
				node.children.find((c): c is PARSENODE.ParseNodeGenericArguments__0__List => c instanceof PARSENODE.ParseNodeGenericArguments__0__List)!,
			);

		} else if (node instanceof PARSENODE.ParseNodeTypeUnit) {
			return (node.children[0] instanceof ParseNode)
				? (node.children[0] instanceof PARSENODE.ParseNodePrimitiveLiteral)
					? new AST.ASTNodeTypeConstant(node.children[0].children[0] as TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString)
					: this.decorate(node.children[0])
				: (node.children[0] instanceof TOKEN.TokenKeyword)
					? new AST.ASTNodeTypeConstant(node.children[0])
					: new AST.ASTNodeTypeAlias(node.children[0] as TOKEN.TokenIdentifier);

		} else if (node instanceof PARSENODE.ParseNodePropertyAccessType) {
			return (
				(node.children[1] instanceof TOKEN.TokenNumber) ? new AST.ASTNodeIndexType(node, new AST.ASTNodeTypeConstant(node.children[1])) :
				(node.children[1] instanceof TOKEN.TokenNumber,   this.decorate(node.children[1] as PARSENODE.ParseNodeWord))
			);

		} else if (node instanceof PARSENODE.ParseNodeGenericCall) {
			return this.decorate(node.children[1]);

		} else if (node instanceof PARSENODE.ParseNodeTypeCompound) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: (node.children[1] instanceof PARSENODE.ParseNodePropertyAccessType)
					? new AST.ASTNodeTypeAccess(node, this.decorate(node.children[0]), this.decorate(node.children[1]))
					: new AST.ASTNodeTypeCall  (node, this.decorate(node.children[0]), this.decorate(node.children[1]));

		} else if (node instanceof PARSENODE.ParseNodeTypeUnarySymbol) {
			return (
				(node.children.length === 1) ? this.decorate(node.children[0]) :
				(node.children.length === 2) ? new AST.ASTNodeTypeOperationUnary(
					node,
					DecoratorSolid.TYPEOPERATORS_UNARY.get(node.children[1].source as Punctuator)!,
					this.decorate(node.children[0]),
				) :
				(node.children[1].source === Punctuator.BRAK_OPN)
					? new AST.ASTNodeTypeList(
						node,
						this.decorate(node.children[0]),
						(node.children[2].source === Punctuator.BRAK_CLS) ? null : BigInt((node.children[2] as TOKEN.TokenNumber).cook())
					)
					: new AST.ASTNodeTypeSet(node, this.decorate(node.children[0]))
			);

		} else if (node instanceof PARSENODE.ParseNodeTypeUnaryKeyword) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new AST.ASTNodeTypeOperationUnary(
					node,
					DecoratorSolid.TYPEOPERATORS_UNARY.get(node.children[0].source as Keyword)!,
					this.decorate(node.children[1]),
				);

		} else if (
			node instanceof PARSENODE.ParseNodeTypeIntersection ||
			node instanceof PARSENODE.ParseNodeTypeUnion
		) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new AST.ASTNodeTypeOperationBinary(
					node,
					DecoratorSolid.TYPEOPERATORS_BINARY.get(node.children[1].source as Punctuator)!,
					this.decorate(node.children[0]),
					this.decorate(node.children[2]),
				);

		} else if (node instanceof PARSENODE.ParseNodeType) {
			return this.decorate(node.children[0])

		} else if (node instanceof PARSENODE.ParseNodeStringTemplate) {
			return new AST.ASTNodeTemplate(node, [...node.children].flatMap((c) =>
				(c instanceof TOKEN.TokenTemplate) ? [new AST.ASTNodeConstant(c)] :
				(c instanceof PARSENODE.ParseNodeExpression) ? [this.decorate(c)] :
				this.decorate(c as PARSENODE.ParseNodeStringTemplate__0__List)
			));

		} else if (node instanceof PARSENODE.ParseNodeStringTemplate__0__List) {
			return [...node.children].flatMap((c) =>
				(c instanceof TOKEN.TokenTemplate) ? [new AST.ASTNodeConstant(c)] :
				(c instanceof PARSENODE.ParseNodeExpression) ? [this.decorate(c)] :
				this.decorate(c as PARSENODE.ParseNodeStringTemplate__0__List)
			);

		} else if (node instanceof PARSENODE.ParseNodeProperty) {
			return new AST.ASTNodeProperty(
				node,
				this.decorate(node.children[0]),
				this.decorate(node.children[2]),
			);

		} else if (node instanceof PARSENODE.ParseNodeCase) {
			return new AST.ASTNodeCase(
				node,
				this.decorate(node.children[0]),
				this.decorate(node.children[2]),
			);

		} else if (node instanceof PARSENODE.ParseNodeExpressionGrouped) {
			return this.decorate(node.children[1]);

		} else if (node instanceof PARSENODE.ParseNodeTupleLiteral) {
			return new AST.ASTNodeTuple(node, (node.children.length === 2) ? [] : this.parseList<PARSENODE.ParseNodeExpression, AST.ASTNodeExpression>(
				node.children.find((c): c is PARSENODE.ParseNodeTupleLiteral__0__List => c instanceof PARSENODE.ParseNodeTupleLiteral__0__List)!,
			));

		} else if (node instanceof PARSENODE.ParseNodeRecordLiteral) {
			return new AST.ASTNodeRecord(node, this.parseList<PARSENODE.ParseNodeProperty, AST.ASTNodeProperty>(
				node.children.find((c): c is PARSENODE.ParseNodeRecordLiteral__0__List => c instanceof PARSENODE.ParseNodeRecordLiteral__0__List)!,
			));

		} else if (node instanceof PARSENODE.ParseNodeSetLiteral) {
			return new AST.ASTNodeSet(node, (node.children.length === 2) ? [] : this.parseList<PARSENODE.ParseNodeExpression, AST.ASTNodeExpression>(
				node.children.find((c): c is PARSENODE.ParseNodeTupleLiteral__0__List => c instanceof PARSENODE.ParseNodeTupleLiteral__0__List)!,
			));

		} else if (node instanceof PARSENODE.ParseNodeMapLiteral) {
			return new AST.ASTNodeMap(node, this.parseList<PARSENODE.ParseNodeCase, AST.ASTNodeCase>(
				node.children.find((c): c is PARSENODE.ParseNodeMapLiteral__0__List => c instanceof PARSENODE.ParseNodeMapLiteral__0__List)!,
			));

		} else if (node instanceof PARSENODE.ParseNodeFunctionArguments) {
			return (node.children.length === 2) ? [] : this.parseList<PARSENODE.ParseNodeExpression, AST.ASTNodeExpression>(
				node.children.find((c): c is PARSENODE.ParseNodeTupleLiteral__0__List => c instanceof PARSENODE.ParseNodeTupleLiteral__0__List)!,
			);

		} else if (node instanceof PARSENODE.ParseNodeExpressionUnit) {
			return (node.children[0] instanceof ParseNode)
				? this.decorate(node.children[0])
				: new AST.ASTNodeVariable(node.children[0] as TOKEN.TokenIdentifier);

		} else if (
			node instanceof PARSENODE.ParseNodePropertyAccess
			|| node instanceof PARSENODE.ParseNodePropertyAssign
		) {
			return (
				(node.children[1] instanceof TOKEN.TokenNumber)       ? new AST.ASTNodeIndex(node, new AST.ASTNodeConstant(node.children[1])) :
				(node.children[1] instanceof PARSENODE.ParseNodeWord) ? this.decorate(node.children[1]) :
				this.decorate(node.children[2]!)
			);

		} else if (node instanceof PARSENODE.ParseNodeFunctionCall) {
			return (node.children.length === 2) ? [
				[],
				this.decorate(node.children[1]),
			] : [
				this.decorate(node.children[1]),
				this.decorate(node.children[2]),
			];

		} else if (node instanceof PARSENODE.ParseNodeExpressionCompound) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: (node.children[1] instanceof PARSENODE.ParseNodePropertyAccess)
					? new AST.ASTNodeAccess(node, DecoratorSolid.ACCESSORS.get(node.children[1].children[0].source as Punctuator)!, this.decorate(node.children[0]),    this.decorate(node.children[1]))
					: new AST.ASTNodeCall  (node,                                                                                   this.decorate(node.children[0]), ...this.decorate(node.children[1]));

		} else if (node instanceof PARSENODE.ParseNodeAssignee) {
			return (node.children.length === 1)
				? new AST.ASTNodeVariable(node.children[0] as TOKEN.TokenIdentifier)
				: new AST.ASTNodeAccess(
					node,
					Operator.DOT,
					this.decorate(node.children[0]),
					this.decorate(node.children[1]),
				);

		} else if (node instanceof PARSENODE.ParseNodeExpressionUnarySymbol) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: (node.children[0].source === Punctuator.AFF) // `+a` is a no-op
					? this.decorate(node.children[1])
					: new AST.ASTNodeOperationUnary(
						node,
						DecoratorSolid.OPERATORS_UNARY.get(node.children[0].source as Punctuator) as ValidOperatorUnary,
						this.decorate(node.children[1]),
					);

		} else if (
			node instanceof PARSENODE.ParseNodeExpressionExponential    ||
			node instanceof PARSENODE.ParseNodeExpressionMultiplicative ||
			node instanceof PARSENODE.ParseNodeExpressionAdditive       ||
			node instanceof PARSENODE.ParseNodeExpressionComparative    ||
			node instanceof PARSENODE.ParseNodeExpressionEquality       ||
			node instanceof PARSENODE.ParseNodeExpressionConjunctive    ||
			node instanceof PARSENODE.ParseNodeExpressionDisjunctive
		) {
			if (node.children.length === 1) {
				return this.decorate(node.children[0])
			} else {
				const operator: Operator = DecoratorSolid.OPERATORS_BINARY.get(node.children[1].source as Punctuator | Keyword)!;
				const operands: [AST.ASTNodeExpression, AST.ASTNodeExpression] = [
					this.decorate(node.children[0]),
					this.decorate(node.children[2]),
				];
				return (
					node instanceof PARSENODE.ParseNodeExpressionExponential    ||
					node instanceof PARSENODE.ParseNodeExpressionMultiplicative ||
					node instanceof PARSENODE.ParseNodeExpressionAdditive
				) ? (
					// `a - b` is syntax sugar for `a + -(b)`
					(operator === Operator.SUB) ? new AST.ASTNodeOperationBinaryArithmetic(
						node,
						Operator.ADD,
						operands[0],
						new AST.ASTNodeOperationUnary(
							node.children[2],
							Operator.NEG,
							operands[1],
						),
					) :
					new AST.ASTNodeOperationBinaryArithmetic(node, operator as ValidOperatorArithmetic, ...operands)

				) : (node instanceof PARSENODE.ParseNodeExpressionComparative) ? (
					// `a !< b` is syntax sugar for `!(a < b)`
					(operator === Operator.NLT) ? new AST.ASTNodeOperationUnary(
						node,
						Operator.NOT,
						new AST.ASTNodeOperationBinaryComparative(node.children[0], Operator.LT, ...operands),
					) :
					// `a !> b` is syntax sugar for `!(a > b)`
					(operator === Operator.NGT) ? new AST.ASTNodeOperationUnary(
						node,
						Operator.NOT,
						new AST.ASTNodeOperationBinaryComparative(node.children[0], Operator.GT, ...operands),
					) :
					// `a isnt b` is syntax sugar for `!(a is b)`
					(operator === Operator.ISNT) ? new AST.ASTNodeOperationUnary(
						node,
						Operator.NOT,
						new AST.ASTNodeOperationBinaryComparative(node.children[0], Operator.IS, ...operands),
					) :
					new AST.ASTNodeOperationBinaryComparative(node, operator as ValidOperatorComparative, ...operands)

				) : (node instanceof PARSENODE.ParseNodeExpressionEquality) ? (
					// `a !== b` is syntax sugar for `!(a === b)`
					(operator === Operator.NID) ? new AST.ASTNodeOperationUnary(
						node,
						Operator.NOT,
						new AST.ASTNodeOperationBinaryEquality(node.children[0], Operator.ID, ...operands),
					) :
					// `a != b` is syntax sugar for `!(a == b)`
					(operator === Operator.NEQ) ? new AST.ASTNodeOperationUnary(
						node,
						Operator.NOT,
						new AST.ASTNodeOperationBinaryEquality(node.children[0], Operator.EQ, ...operands),
					) :
					new AST.ASTNodeOperationBinaryEquality(node, operator as ValidOperatorEquality, ...operands)

				) : /* (
					node instanceof PARSENODE.ParseNodeExpressionConjunctive ||
					node instanceof PARSENODE.ParseNodeExpressionDisjunctive
				) ? */ (
					// `a !& b` is syntax sugar for `!(a && b)`
					(operator === Operator.NAND) ? new AST.ASTNodeOperationUnary(
						node,
						Operator.NOT,
						new AST.ASTNodeOperationBinaryLogical(node.children[0], Operator.AND, ...operands),
					) :
					// `a !| b` is syntax sugar for `!(a || b)`
					(operator === Operator.NOR) ? new AST.ASTNodeOperationUnary(
						node,
						Operator.NOT,
						new AST.ASTNodeOperationBinaryLogical(node.children[0], Operator.OR, ...operands),
					) :
					new AST.ASTNodeOperationBinaryLogical(node, operator as ValidOperatorLogical, ...operands)
				)
			}

		} else if (node instanceof PARSENODE.ParseNodeExpressionConditional) {
			return new AST.ASTNodeOperationTernary(
				node,
				Operator.COND,
				this.decorate(node.children[1]),
				this.decorate(node.children[3]),
				this.decorate(node.children[5]),
			);

		} else if (node instanceof PARSENODE.ParseNodeExpression) {
			return this.decorate(node.children[0])

		} else if (node instanceof PARSENODE.ParseNodeDeclarationType) {
			return new AST.ASTNodeDeclarationType(
				node,
				new AST.ASTNodeTypeAlias(node.children[1] as TOKEN.TokenIdentifier),
				this.decorate(node.children[3]),
			);

		} else if (node instanceof PARSENODE.ParseNodeDeclarationVariable) {
			return new AST.ASTNodeDeclarationVariable(
				node,
				node.children.length === 8,
				new AST.ASTNodeVariable(((node.children.length === 7) ? node.children[1] : node.children[2]) as TOKEN.TokenIdentifier),
				this.decorate((node.children.length === 7) ? node.children[3] : node.children[4]),
				this.decorate((node.children.length === 7) ? node.children[5] : node.children[6]),
			);

		} else if (node instanceof PARSENODE.ParseNodeDeclaration) {
			return this.decorate(node.children[0]);

		} else if (node instanceof PARSENODE.ParseNodeStatementAssignment) {
			return new AST.ASTNodeAssignment(
				node,
				this.decorate(node.children[0]),
				this.decorate(node.children[2]),
			);

		} else if (node instanceof PARSENODE.ParseNodeStatementExpression) {
			return new AST.ASTNodeStatementExpression(node, (node.children.length === 2) ? this.decorate(node.children[0]) : void 0);

		} else if (node instanceof PARSENODE.ParseNodeStatement) {
			return this.decorate(node.children[0]);

		} else if (node instanceof PARSENODE.ParseNodeGoal) {
			return new AST.ASTNodeGoal(
				node,
				(node.children.length === 2) ? [] : this.parseList<PARSENODE.ParseNodeStatement, AST.ASTNodeStatement>(node.children[1]),
				config,
			);
		}
		throw new TypeError(`Could not find type of parse node \`${ node.constructor.name }\`.`);
	}

	decorateTS(node: SyntaxNodeType<'keyword_type'>):                            AST.ASTNodeTypeConstant;
	decorateTS(node: SyntaxNodeType<'identifier'>):                              AST.ASTNodeTypeAlias | AST.ASTNodeVariable;
	decorateTS(node: SyntaxNodeType<'word'>):                                    AST.ASTNodeKey;
	decorateTS(node: SyntaxNodeType<'primitive_literal'>):                       AST.ASTNodeTypeConstant | AST.ASTNodeConstant;
	decorateTS(node: SyntaxNodeType<`entry_type${ '' | '__optional' }`>):        AST.ASTNodeItemType;
	decorateTS(node: SyntaxNodeType<`entry_type__named${ '' | '__optional' }`>): AST.ASTNodePropertyType;
	decorateTS(node: SyntaxNodeType<'type_grouped'>):                            AST.ASTNodeType;
	decorateTS(node: SyntaxNodeType<'type_tuple_literal'>):                      AST.ASTNodeTypeTuple;
	decorateTS(node: SyntaxNodeType<'type_record_literal'>):                     AST.ASTNodeTypeRecord;
	decorateTS(node: SyntaxNodeType<'type_hash_literal'>):                       AST.ASTNodeTypeHash;
	decorateTS(node: SyntaxNodeType<'type_map_literal'>):                        AST.ASTNodeTypeMap;
	decorateTS(node: SyntaxNodeType<'property_access_type'>):                    AST.ASTNodeIndexType | AST.ASTNodeKey;
	decorateTS(node: SyntaxNodeType<'type_compound'>):                           AST.ASTNodeTypeAccess | AST.ASTNodeTypeCall;
	decorateTS(node: SyntaxNodeType<'type_unary_symbol'>):                       AST.ASTNodeTypeOperationUnary | AST.ASTNodeTypeList | AST.ASTNodeTypeSet;
	decorateTS(node: SyntaxNodeType<'type_unary_keyword'>):                      AST.ASTNodeTypeOperationUnary;
	decorateTS(node: SyntaxNodeType<'type_intersection'>):                       AST.ASTNodeTypeOperationBinary;
	decorateTS(node: SyntaxNodeType<'type_union'>):                              AST.ASTNodeTypeOperationBinary;
	decorateTS(node: SyntaxNodeSupertype<'type'>):                               AST.ASTNodeType;
	decorateTS(node: SyntaxNodeType<'string_template'>):                         AST.ASTNodeTemplate;
	decorateTS(node: SyntaxNodeType<'property'>):                                AST.ASTNodeProperty;
	decorateTS(node: SyntaxNodeType<'case'>):                                    AST.ASTNodeCase;
	decorateTS(node: SyntaxNodeType<'expression_grouped'>):                      AST.ASTNodeExpression;
	decorateTS(node: SyntaxNodeType<'tuple_literal'>):                           AST.ASTNodeTuple;
	decorateTS(node: SyntaxNodeType<'record_literal'>):                          AST.ASTNodeRecord;
	decorateTS(node: SyntaxNodeType<'set_literal'>):                             AST.ASTNodeSet;
	decorateTS(node: SyntaxNodeType<'map_literal'>):                             AST.ASTNodeMap;
	decorateTS(node: SyntaxNodeType<'property_access'>):                         AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression;
	decorateTS(node: SyntaxNodeType<'property_assign'>):                         AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression;
	decorateTS(node: SyntaxNodeType<'expression_compound'>):                     AST.ASTNodeAccess | AST.ASTNodeCall;
	decorateTS(node: SyntaxNodeType<'assignee'>):                                AST.ASTNodeVariable | AST.ASTNodeAccess;
	decorateTS(node: SyntaxNodeType<'expression_unary_symbol'>):                 AST.ASTNodeExpression | AST.ASTNodeOperationUnary;
	decorateTS(node: SyntaxNodeType<'expression_exponential'>):                  AST.ASTNodeOperationBinaryArithmetic;
	decorateTS(node: SyntaxNodeType<'expression_multiplicative'>):               AST.ASTNodeOperationBinaryArithmetic;
	decorateTS(node: SyntaxNodeType<'expression_additive'>):                     AST.ASTNodeOperationBinaryArithmetic;
	decorateTS(node: SyntaxNodeType<'expression_comparative'>):                  AST.ASTNodeOperationUnary | AST.ASTNodeOperationBinaryComparative;
	decorateTS(node: SyntaxNodeType<'expression_equality'>):                     AST.ASTNodeOperationUnary | AST.ASTNodeOperationBinaryEquality;
	decorateTS(node: SyntaxNodeType<'expression_conjunctive'>):                  AST.ASTNodeOperationUnary | AST.ASTNodeOperationBinaryLogical;
	decorateTS(node: SyntaxNodeType<'expression_disjunctive'>):                  AST.ASTNodeOperationUnary | AST.ASTNodeOperationBinaryLogical;
	decorateTS(node: SyntaxNodeType<'expression_conditional'>):                  AST.ASTNodeOperationTernary;
	decorateTS(node: SyntaxNodeSupertype<'expression'>):                         AST.ASTNodeExpression;
	decorateTS(node: SyntaxNodeType<'declaration_type'>):                        AST.ASTNodeDeclarationType;
	decorateTS(node: SyntaxNodeType<'declaration_variable'>):                    AST.ASTNodeDeclarationVariable;
	decorateTS(node: SyntaxNodeSupertype<'declaration'>):                        AST.ASTNodeDeclaration;
	decorateTS(node: SyntaxNodeType<'statement_expression'>):                    AST.ASTNodeStatementExpression;
	decorateTS(node: SyntaxNodeType<'statement_assignment'>):                    AST.ASTNodeAssignment;
	decorateTS(node: SyntaxNodeSupertype<'statement'>):                          AST.ASTNodeStatement;
	decorateTS(node: SyntaxNodeType<'source_file'>, config?: SolidConfig):       AST.ASTNodeGoal;
	decorateTS(node: SyntaxNode): AST.ASTNodeSolid;
	decorateTS(node: SyntaxNode, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeSolid {
		return new Map<string, (node: SyntaxNode) => AST.ASTNodeSolid>(Object.entries({
			source_file: (node) => new AST.ASTNodeGoal(
				node as SyntaxNodeType<'source_file'>,
				node.children
					.filter((c): c is SyntaxNodeSupertype<'statement'> => isSyntaxNodeSupertype(c, 'statement'))
					.map((c) => this.decorateTS(c)),
				config,
			),

			/* # TERMINALS */
			keyword_type: (node) => new AST.ASTNodeTypeConstant(node as SyntaxNodeType<'keyword_type'>),

			identifier: (node) => (
				(isSyntaxNodeSupertype(node.parent!, 'type'))      || isSyntaxNodeType(node.parent!, 'declaration_type')     ? new AST.ASTNodeTypeAlias (node as SyntaxNodeType<'identifier'>) :
				(isSyntaxNodeSupertype(node.parent!, 'expression') || isSyntaxNodeType(node.parent!, 'declaration_variable'),  new AST.ASTNodeVariable  (h.tokenIdentifierFromSource     (node.text + ';')))
			),

			/* # PRODUCTIONS */
			word: (node) => new AST.ASTNodeKey(node as SyntaxNodeType<'word'>),

			primitive_literal: (node) => (
				(isSyntaxNodeSupertype(node.parent!, 'type'))      || isSyntaxNodeType(node.parent!, 'declaration_type')     ? new AST.ASTNodeTypeConstant (node as SyntaxNodeType<'primitive_literal'>) :
				(isSyntaxNodeSupertype(node.parent!, 'expression') || isSyntaxNodeType(node.parent!, 'declaration_variable'),  new AST.ASTNodeConstant     (h.tokenLiteralFromSource    (node.children[0].text + ';')))
			),

			/* ## Types */
			entry_type: (node) => new AST.ASTNodeItemType(
				node as SyntaxNodeType<'entry_type'>,
				false,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
			),

			entry_type__optional: (node) => new AST.ASTNodeItemType(
				node as SyntaxNodeType<'entry_type__optional'>,
				true,
				this.decorateTS(node.children[1] as SyntaxNodeSupertype<'type'>),
			),

			entry_type__named: (node) => new AST.ASTNodePropertyType(
				node as SyntaxNodeType<'entry_type__named'>,
				false,
				this.decorateTS(node.children[0] as SyntaxNodeType<'word'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			),

			entry_type__named__optional: (node) => new AST.ASTNodePropertyType(
				node as SyntaxNodeType<'entry_type__named__optional'>,
				true,
				this.decorateTS(node.children[0] as SyntaxNodeType<'word'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			),

			type_grouped: (node) => this.decorateTS(node.children[1] as SyntaxNodeSupertype<'type'>),

			type_tuple_literal: (node) => new AST.ASTNodeTypeTuple(
				h.tupleTypeFromString(node.text),
				node.children
					.filter((c): c is SyntaxNodeType<'entry_type' | 'entry_type__optional'> => isSyntaxNodeType(c, /^entry_type(__optional)?$/))
					.map((c) => this.decorateTS(c)),
			),

			type_record_literal: (node) => new AST.ASTNodeTypeRecord(
				h.recordTypeFromString(node.text),
				node.children
					.filter((c): c is SyntaxNodeType<'entry_type__named' | 'entry_type__named__optional'> => isSyntaxNodeType(c, /^entry_type__named(__optional)?$/))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodePropertyType>,
			),

			type_hash_literal: (node) => new AST.ASTNodeTypeHash(
				h.hashTypeFromString(node.text),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			),

			type_map_literal: (node) => new AST.ASTNodeTypeMap(
				h.mapTypeFromString(node.text),
				this.decorateTS(node.children[1] as SyntaxNodeSupertype<'type'>),
				this.decorateTS(node.children[3] as SyntaxNodeSupertype<'type'>),
			),

			property_access_type: (node) => (
				(isSyntaxNodeType(node.children[1], 'integer')) ? new AST.ASTNodeIndexType(
					node as SyntaxNodeType<'property_access_type'>,
					new AST.ASTNodeTypeConstant(node.children[1]),
				) :
				(isSyntaxNodeType(node.children[1], 'word'), this.decorateTS(node.children[1] as SyntaxNodeType<'word'>))
			),

			type_compound: (node) => (
				(isSyntaxNodeType(node.children[1], 'property_access_type')) ? new AST.ASTNodeTypeAccess(
					h.compoundTypeFromString(node.text),
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
					this.decorateTS(node.children[1] as SyntaxNodeType<'property_access_type'>),
				) :
				(isSyntaxNodeType(node.children[1], 'generic_call'), new AST.ASTNodeTypeCall(
					h.compoundTypeFromString(node.text),
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
					((node.children[1] as SyntaxNodeType<'generic_call'>).children[1] as SyntaxNodeType<'generic_arguments'>).children
						.filter((c): c is SyntaxNodeSupertype<'type'> => isSyntaxNodeSupertype(c, 'type'))
						.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeType>,
				))
			),

			type_unary_symbol: (node) => (
				(node.children.length === 2) ? new AST.ASTNodeTypeOperationUnary(
					h.unarySymbolTypeFromString(node.text),
					DecoratorSolid.TYPEOPERATORS_UNARY.get(node.children[1].text as Punctuator)!,
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
				) :
				(node.children.length > 2, (node.children[1].text === Punctuator.BRAK_OPN)
					? new AST.ASTNodeTypeList(
						h.unarySymbolTypeFromString(node.text),
						this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
						(node.children[2].text === Punctuator.BRAK_CLS)
							? null
							: BigInt((h.tokenLiteralFromTypeString(node.children[2].text) as TOKEN.TokenNumber).cook())
					)
					: new AST.ASTNodeTypeSet(
						h.unarySymbolTypeFromString(node.text),
						this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
					)
				)
			),

			type_unary_keyword: (node) => new AST.ASTNodeTypeOperationUnary(
				h.unaryKeywordTypeFromString(node.text),
				DecoratorSolid.TYPEOPERATORS_UNARY.get(node.children[0].text as Keyword)!,
				this.decorateTS(node.children[1] as SyntaxNodeSupertype<'type'>),
			),

			type_intersection: (node) => new AST.ASTNodeTypeOperationBinary(
				h.intersectionTypeFromString(node.text),
				DecoratorSolid.TYPEOPERATORS_BINARY.get(node.children[1].text as Punctuator)!,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			),

			type_union: (node) => new AST.ASTNodeTypeOperationBinary(
				h.unionTypeFromString(node.text),
				DecoratorSolid.TYPEOPERATORS_BINARY.get(node.children[1].text as Punctuator)!,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			),

			/* ## Expressions */
			string_template: (node) => new AST.ASTNodeTemplate(
				h.stringTemplateFromSource(node.text + ';'),
				node.children.map((c) => (
					(isSyntaxNodeType      (c, 'template_full'))   ? new AST.ASTNodeConstant(h.tokenTemplateFullFromSource(c.text + ';')) :
					(isSyntaxNodeType      (c, 'template_head'))   ? new AST.ASTNodeConstant(h.tokenTemplateFullFromSource([                           c.text.slice(0,                                           -TOKEN.TokenTemplate.DELIM_INTERP_START.length), TOKEN.TokenTemplate.DELIM].join('') + ';')) :
					(isSyntaxNodeType      (c, 'template_middle')) ? new AST.ASTNodeConstant(h.tokenTemplateFullFromSource([TOKEN.TokenTemplate.DELIM, c.text.slice(TOKEN.TokenTemplate.DELIM_INTERP_END.length, -TOKEN.TokenTemplate.DELIM_INTERP_START.length), TOKEN.TokenTemplate.DELIM].join('') + ';')) :
					(isSyntaxNodeType      (c, 'template_tail'))   ? new AST.ASTNodeConstant(h.tokenTemplateFullFromSource([TOKEN.TokenTemplate.DELIM, c.text.slice(TOKEN.TokenTemplate.DELIM_INTERP_END.length                                                )                           ].join('') + ';')) :
					(isSyntaxNodeSupertype (c, 'expression'),        this.decorateTS(c as SyntaxNodeSupertype<'expression'>))
				)),
			),

			property: (node) => new AST.ASTNodeProperty(
				node as SyntaxNodeType<'property'>,
				this.decorateTS(node.children[0] as SyntaxNodeType<'word'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			),

			case: (node) => new AST.ASTNodeCase(
				node as SyntaxNodeType<'case'>,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			),

			expression_grouped: (node) => this.decorateTS(node.children[1] as SyntaxNodeSupertype<'expression'>),

			tuple_literal: (node) => new AST.ASTNodeTuple(
				h.tupleLiteralFromSource(node.text + ';'),
				node.children
					.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
					.map((c) => this.decorateTS(c)),
			),

			record_literal: (node) => new AST.ASTNodeRecord(
				h.recordLiteralFromSource(node.text + ';'),
				node.children
					.filter((c): c is SyntaxNodeType<'property'> => isSyntaxNodeType(c, 'property'))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeProperty>,
			),

			set_literal: (node) => new AST.ASTNodeSet(
				h.setLiteralFromSource(node.text + ';'),
				node.children
					.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
					.map((c) => this.decorateTS(c)),
			),

			map_literal: (node) => new AST.ASTNodeMap(
				h.mapLiteralFromSource(node.text + ';'),
				node.children
					.filter((c): c is SyntaxNodeType<'case'> => isSyntaxNodeType(c, 'case'))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeCase>,
			),

			property_access: (node) => (
				(isSyntaxNodeType(node.children[1], 'integer')) ? new AST.ASTNodeIndex(
					node as SyntaxNodeType<'property_access'>,
					new AST.ASTNodeConstant(h.tokenLiteralFromSource(node.children[1].text + ';') as TOKEN.TokenNumber),
				) :
				(isSyntaxNodeType     (node.children[1], 'word'))      ? this.decorateTS(node.children[1] as SyntaxNodeType<'word'>) :
				(isSyntaxNodeSupertype(node.children[2], 'expression'),  this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>))
			),

			property_assign: (node) => (
				(isSyntaxNodeType(node.children[1], 'integer')) ? new AST.ASTNodeIndex(
					node as SyntaxNodeType<'property_assign'>,
					new AST.ASTNodeConstant(h.tokenLiteralFromSource(node.children[1].text + ';') as TOKEN.TokenNumber),
				) :
				(isSyntaxNodeType     (node.children[1], 'word'))      ? this.decorateTS(node.children[1] as SyntaxNodeType<'word'>) :
				(isSyntaxNodeSupertype(node.children[2], 'expression'),  this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>))
			),

			expression_compound: (node) => (
				(isSyntaxNodeType(node.children[1], 'property_access')) ? new AST.ASTNodeAccess(
					h.compoundExpressionFromSource(node.text + ';'),
					DecoratorSolid.ACCESSORS.get(node.children[1].children[0].text as Punctuator)!,
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[1] as SyntaxNodeType<'property_access'>),
				)
				: (isSyntaxNodeType(node.children[1], 'function_call'), new AST.ASTNodeCall(
					h.compoundExpressionFromSource(node.text + ';'),
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					(node.children[1] as SyntaxNodeType<'function_call'>).children
						.find((c): c is SyntaxNodeType<'generic_arguments'> => isSyntaxNodeType(c, 'generic_arguments'))?.children
						.filter((c): c is SyntaxNodeSupertype<'type'> => isSyntaxNodeSupertype(c, 'type'))
						.map((c) => this.decorateTS(c)) || [],
					(node.children[1] as SyntaxNodeType<'function_call'>).children
						.find((c): c is SyntaxNodeType<'function_arguments'> => isSyntaxNodeType(c, 'function_arguments'))!.children
						.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
						.map((c) => this.decorateTS(c)),
				))
			),

			assignee: (node) => (node.children.length === 1)
				? new AST.ASTNodeVariable(h.tokenIdentifierFromSource(node.children[0].text + ';'))
				: new AST.ASTNodeAccess(
					h.compoundExpressionFromSource(node.text + ';'),
					Operator.DOT,
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[1] as SyntaxNodeType<'property_assign'>),
				),

			expression_unary_symbol: (node) => (node.children[0].text === Punctuator.AFF) // `+a` is a no-op
				? this.decorateTS(node.children[1] as SyntaxNodeSupertype<'expression'>)
				: new AST.ASTNodeOperationUnary(
					h.unaryExpressionFromSource(node.text + ';'),
					DecoratorSolid.OPERATORS_UNARY.get(node.children[0].text as Punctuator) as ValidOperatorUnary,
					this.decorateTS(node.children[1] as SyntaxNodeSupertype<'expression'>),
				),

			expression_exponential: (node) => new AST.ASTNodeOperationBinaryArithmetic(
				h.exponentialExpressionFromSource(node.text + ';'),
				DecoratorSolid.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			),

			expression_multiplicative: (node) => new AST.ASTNodeOperationBinaryArithmetic(
				h.multiplicativeExpressionFromSource(node.text + ';'),
				DecoratorSolid.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			),

			expression_additive: (node) => ((operator: Operator, operands: [AST.ASTNodeExpression, AST.ASTNodeExpression]) => (
				// `a - b` is syntax sugar for `a + -(b)`
				(operator === Operator.SUB) ? new AST.ASTNodeOperationBinaryArithmetic(
					h.additiveExpressionFromSource(node.text + ';'),
					Operator.ADD,
					operands[0],
					new AST.ASTNodeOperationUnary(
						h.multiplicativeExpressionFromSource(node.children[2].text + ';'),
						Operator.NEG,
						operands[1],
					),
				) :
				new AST.ASTNodeOperationBinaryArithmetic(
					h.additiveExpressionFromSource(node.text + ';'),
					operator as ValidOperatorArithmetic,
					...operands,
				)
			))(DecoratorSolid.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!, [
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			]),

			expression_comparative: (node) => ((operator: Operator, operands: [AST.ASTNodeExpression, AST.ASTNodeExpression]) => (
				// `a !< b` is syntax sugar for `!(a < b)`
				(operator === Operator.NLT) ? new AST.ASTNodeOperationUnary(
					h.comparativeExpressionFromSource(node.text + ';'),
					Operator.NOT,
					new AST.ASTNodeOperationBinaryComparative(
						h.comparativeExpressionFromSource(node.children[0].text + ';'),
						Operator.LT,
						...operands,
					),
				) :
				// `a !> b` is syntax sugar for `!(a > b)`
				(operator === Operator.NGT) ? new AST.ASTNodeOperationUnary(
					h.comparativeExpressionFromSource(node.text + ';'),
					Operator.NOT,
					new AST.ASTNodeOperationBinaryComparative(
						h.comparativeExpressionFromSource(node.children[0].text + ';'),
						Operator.GT,
						...operands,
					),
				) :
				// `a isnt b` is syntax sugar for `!(a is b)`
				(operator === Operator.ISNT) ? new AST.ASTNodeOperationUnary(
					h.comparativeExpressionFromSource(node.text + ';'),
					Operator.NOT,
					new AST.ASTNodeOperationBinaryComparative(
						h.comparativeExpressionFromSource(node.children[0].text + ';'),
						Operator.IS,
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryComparative(
					h.comparativeExpressionFromSource(node.text + ';'),
					operator as ValidOperatorComparative,
					...operands,
				)
			))(DecoratorSolid.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!, [
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			]),

			expression_equality: (node) => ((operator: Operator, operands: [AST.ASTNodeExpression, AST.ASTNodeExpression]) => (
				// `a !== b` is syntax sugar for `!(a === b)`
				(operator === Operator.NID) ? new AST.ASTNodeOperationUnary(
					h.equalityExpressionFromSource(node.text + ';'),
					Operator.NOT,
					new AST.ASTNodeOperationBinaryEquality(
						h.equalityExpressionFromSource(node.children[0].text + ';'),
						Operator.ID,
						...operands,
					),
				) :
				// `a != b` is syntax sugar for `!(a == b)`
				(operator === Operator.NEQ) ? new AST.ASTNodeOperationUnary(
					h.equalityExpressionFromSource(node.text + ';'),
					Operator.NOT,
					new AST.ASTNodeOperationBinaryEquality(
						h.equalityExpressionFromSource(node.children[0].text + ';'),
						Operator.EQ,
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryEquality(
					h.equalityExpressionFromSource(node.text + ';'),
					operator as ValidOperatorEquality,
					...operands,
				)
			))(DecoratorSolid.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!, [
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			]),

			expression_conjunctive: (node) => ((operator: Operator, operands: [AST.ASTNodeExpression, AST.ASTNodeExpression]) => (
				// `a !& b` is syntax sugar for `!(a && b)`
				(operator === Operator.NAND) ? new AST.ASTNodeOperationUnary(
					h.conjunctiveExpressionFromSource(node.text + ';'),
					Operator.NOT,
					new AST.ASTNodeOperationBinaryLogical(
						h.conjunctiveExpressionFromSource(node.children[0].text + ';'),
						Operator.AND,
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryLogical(
					h.conjunctiveExpressionFromSource(node.text + ';'),
					operator as ValidOperatorLogical,
					...operands,
				)
			))(DecoratorSolid.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!, [
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			]),

			expression_disjunctive: (node) => ((operator: Operator, operands: [AST.ASTNodeExpression, AST.ASTNodeExpression]) => (
				// `a !| b` is syntax sugar for `!(a || b)`
				(operator === Operator.NOR) ? new AST.ASTNodeOperationUnary(
					h.disjunctiveExpressionFromSource(node.text + ';'),
					Operator.NOT,
					new AST.ASTNodeOperationBinaryLogical(
						h.disjunctiveExpressionFromSource(node.children[0].text + ';'),
						Operator.OR,
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryLogical(
					h.disjunctiveExpressionFromSource(node.text + ';'),
					operator as ValidOperatorLogical,
					...operands,
				)
			))(DecoratorSolid.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!, [
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			]),

			expression_conditional: (node) => new AST.ASTNodeOperationTernary(
				h.conditionalExpressionFromSource(node.text + ';'),
				Operator.COND,
				this.decorateTS(node.children[1] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[3] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[5] as SyntaxNodeSupertype<'expression'>),
			),

			/* ## Statements */
			declaration_type: (node) => new AST.ASTNodeDeclarationType(
				h.typeDeclarationFromSource(node.text),
				new AST.ASTNodeTypeAlias(node.children[1] as SyntaxNodeType<'identifier'>),
				this.decorateTS(node.children[3] as SyntaxNodeSupertype<'type'>),
			),

			declaration_variable: (node) => new AST.ASTNodeDeclarationVariable(
				h.variableDeclarationFromSource(node.text),
				node.children.length === 8,
				new AST.ASTNodeVariable(h.tokenIdentifierFromSource(((node.children.length === 7) ? node.children[1].text : node.children[2].text) + ';')),
				this.decorateTS(((node.children.length === 7) ? node.children[3] : node.children[4]) as SyntaxNodeSupertype<'type'>),
				this.decorateTS(((node.children.length === 7) ? node.children[5] : node.children[6]) as SyntaxNodeSupertype<'expression'>),
			),

			statement_expression: (node) => new AST.ASTNodeStatementExpression(
				h.statementExpressionFromSource(node.text),
				(node.children.length === 2) ? this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>) : void 0,
			),

			statement_assignment: (node) => new AST.ASTNodeAssignment(
				h.assignmentFromSource(node.text),
				this.decorateTS(node.children[0] as SyntaxNodeType<'assignee'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			),
		})).get(node.type)?.(node) || (() => {
			throw new TypeError(`Could not find type of parse node \`${ node.type }\`.`);
		})();
	}
}



export const DECORATOR: DecoratorSolid = new DecoratorSolid();

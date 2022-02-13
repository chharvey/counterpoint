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
	Validator,
} from './index.js';
import {
	SyntaxNodeType,
	isSyntaxNodeType,
	SyntaxNodeSupertype,
	isSyntaxNodeSupertype,
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
		| PARSENODE.ParseNodeExpressionClaim
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
	override decorate(node: ParseNode): DecoratorReturnType {
		if (node instanceof PARSENODE.ParseNodeWord) {
			return new AST.ASTNodeKey(node.children[0] as TOKEN.TokenKeyword | TOKEN.TokenIdentifier);

		} else if (node instanceof PARSENODE.ParseNodePrimitiveLiteral) {
			return new AST.ASTNodeConstant(node.children[0] as TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString);

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

		} else if (node instanceof PARSENODE.ParseNodeGenericArguments) {
			return this.parseList<PARSENODE.ParseNodeType, AST.ASTNodeType>(
				node.children.find((c): c is PARSENODE.ParseNodeGenericArguments__0__List => c instanceof PARSENODE.ParseNodeGenericArguments__0__List)!,
			);

		} else if (node instanceof PARSENODE.ParseNodeTypeUnit) {
			return (node.children[0] instanceof ParseNode)
				? this.decorate(node.children[0])
				: new AST.ASTNodeTypeAlias(node.children[0] as TOKEN.TokenIdentifier);

		} else if (node instanceof PARSENODE.ParseNodeGenericCall) {
			return this.decorate(node.children[1]);

		} else if (node instanceof PARSENODE.ParseNodeTypeCompound) {
			return this.decorate(node.children[0]);

		} else if (node instanceof PARSENODE.ParseNodeTypeUnarySymbol) {
			return this.decorate(node.children[0]);

		} else if (node instanceof PARSENODE.ParseNodeTypeUnaryKeyword) {
			return this.decorate(node.children[0] as PARSENODE.ParseNodeTypeUnarySymbol);

		} else if (
			node instanceof PARSENODE.ParseNodeTypeIntersection ||
			node instanceof PARSENODE.ParseNodeTypeUnion
		) {
			return this.decorate(node.children[0]);

		} else if (node instanceof PARSENODE.ParseNodeType) {
			return this.decorate(node.children[0])

		} else if (node instanceof PARSENODE.ParseNodeStringTemplate__0__List) {
			return [...node.children].flatMap((c) =>
				(c instanceof TOKEN.TokenTemplate) ? [new AST.ASTNodeConstant(c)] :
				(c instanceof PARSENODE.ParseNodeExpression) ? [this.decorate(c)] :
				this.decorate(c as PARSENODE.ParseNodeStringTemplate__0__List)
			);

		} else if (node instanceof PARSENODE.ParseNodeExpressionGrouped) {
			return this.decorate(node.children[1]);

		} else if (node instanceof PARSENODE.ParseNodeFunctionArguments) {
			return (node.children.length === 2) ? [] : this.parseList<PARSENODE.ParseNodeExpression, AST.ASTNodeExpression>(
				node.children.find((c): c is PARSENODE.ParseNodeTupleLiteral__0__List => c instanceof PARSENODE.ParseNodeTupleLiteral__0__List)!,
			);

		} else if (node instanceof PARSENODE.ParseNodeExpressionUnit) {
			return (node.children[0] instanceof ParseNode)
				? this.decorate(node.children[0])
				: new AST.ASTNodeVariable(node.children[0] as TOKEN.TokenIdentifier);

		} else if (node instanceof PARSENODE.ParseNodeFunctionCall) {
			return (node.children.length === 2) ? [
				[],
				this.decorate(node.children[1]),
			] : [
				this.decorate(node.children[1]),
				this.decorate(node.children[2]),
			];

		} else if (node instanceof PARSENODE.ParseNodeExpressionCompound) {
			return this.decorate(node.children[0]);

		} else if (node instanceof PARSENODE.ParseNodeAssignee) {
			return new AST.ASTNodeVariable(node.children[0] as TOKEN.TokenIdentifier);

		} else if (node instanceof PARSENODE.ParseNodeExpressionUnarySymbol) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: this.decorate(node.children[1]);

		} else if (node instanceof PARSENODE.ParseNodeExpressionClaim) {
			return this.decorate(node.children[0] as PARSENODE.ParseNodeExpressionUnarySymbol);

		} else if (
			node instanceof PARSENODE.ParseNodeExpressionExponential    ||
			node instanceof PARSENODE.ParseNodeExpressionMultiplicative ||
			node instanceof PARSENODE.ParseNodeExpressionAdditive       ||
			node instanceof PARSENODE.ParseNodeExpressionComparative    ||
			node instanceof PARSENODE.ParseNodeExpressionEquality       ||
			node instanceof PARSENODE.ParseNodeExpressionConjunctive    ||
			node instanceof PARSENODE.ParseNodeExpressionDisjunctive
		) {
			return this.decorate(node.children[0])

		} else if (node instanceof PARSENODE.ParseNodeExpression) {
			return this.decorate(node.children[0])

		} else if (node instanceof PARSENODE.ParseNodeDeclaration) {
			return this.decorate(node.children[0]);

		} else if (node instanceof PARSENODE.ParseNodeStatement) {
			return this.decorate(node.children[0]);
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
	decorateTS(node: SyntaxNodeType<'expression_claim'>):                        AST.ASTNodeClaim;
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
				(isSyntaxNodeSupertype(node.parent!, 'type'))      || isSyntaxNodeType(node.parent!, /^(entry_type(__named)?(__optional)?|generic_arguments|declaration_type)$/)                                                            ? new AST.ASTNodeTypeAlias (node as SyntaxNodeType<'identifier'>) :
				(isSyntaxNodeSupertype(node.parent!, 'expression') || isSyntaxNodeType(node.parent!, /^(property|case|function_arguments|property_access|property_assign|declaration_variable|statement_expression|statement_assignment)$/),  new AST.ASTNodeVariable  (node as SyntaxNodeType<'identifier'>))
			),

			/* # PRODUCTIONS */
			word: (node) => new AST.ASTNodeKey(node as SyntaxNodeType<'word'>),

			primitive_literal: (node) => (
				(isSyntaxNodeSupertype(node.parent!, 'type'))      || isSyntaxNodeType(node.parent!, /^(entry_type(__named)?(__optional)?|generic_arguments|declaration_type)$/)                                                            ? new AST.ASTNodeTypeConstant (node as SyntaxNodeType<'primitive_literal'>) :
				(isSyntaxNodeSupertype(node.parent!, 'expression') || isSyntaxNodeType(node.parent!, /^(property|case|function_arguments|property_access|property_assign|declaration_variable|statement_expression|statement_assignment)$/),  new AST.ASTNodeConstant     (node as SyntaxNodeType<'primitive_literal'>))
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
				node as SyntaxNodeType<'type_tuple_literal'>,
				node.children
					.filter((c): c is SyntaxNodeType<'entry_type' | 'entry_type__optional'> => isSyntaxNodeType(c, /^entry_type(__optional)?$/))
					.map((c) => this.decorateTS(c)),
			),

			type_record_literal: (node) => new AST.ASTNodeTypeRecord(
				node as SyntaxNodeType<'type_record_literal'>,
				node.children
					.filter((c): c is SyntaxNodeType<'entry_type__named' | 'entry_type__named__optional'> => isSyntaxNodeType(c, /^entry_type__named(__optional)?$/))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodePropertyType>,
			),

			type_hash_literal: (node) => new AST.ASTNodeTypeHash(
				node as SyntaxNodeType<'type_hash_literal'>,
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			),

			type_map_literal: (node) => new AST.ASTNodeTypeMap(
				node as SyntaxNodeType<'type_map_literal'>,
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
					node as SyntaxNodeType<'type_compound'>,
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
					this.decorateTS(node.children[1] as SyntaxNodeType<'property_access_type'>),
				) :
				(isSyntaxNodeType(node.children[1], 'generic_call'), new AST.ASTNodeTypeCall(
					node as SyntaxNodeType<'type_compound'>,
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
					((node.children[1] as SyntaxNodeType<'generic_call'>).children[1] as SyntaxNodeType<'generic_arguments'>).children
						.filter((c): c is SyntaxNodeSupertype<'type'> => isSyntaxNodeSupertype(c, 'type'))
						.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeType>,
				))
			),

			type_unary_symbol: (node) => (
				(node.children.length === 2) ? new AST.ASTNodeTypeOperationUnary(
					node as SyntaxNodeType<'type_unary_symbol'>,
					DecoratorSolid.TYPEOPERATORS_UNARY.get(node.children[1].text as Punctuator)!,
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
				) :
				(node.children.length > 2, (node.children[1].text === Punctuator.BRAK_OPN)
					? new AST.ASTNodeTypeList(
						node as SyntaxNodeType<'type_unary_symbol'>,
						this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
						(node.children[2].text === Punctuator.BRAK_CLS)
							? null
							: BigInt(Validator.cookTokenNumber(node.children[2].text, { // TODO: add field `Decorator#config`
								...CONFIG_DEFAULT,
								languageFeatures: {
									...CONFIG_DEFAULT.languageFeatures,
									integerRadices:    true,
									numericSeparators: true,
								},
							})[0])
					)
					: new AST.ASTNodeTypeSet(
						node as SyntaxNodeType<'type_unary_symbol'>,
						this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
					)
				)
			),

			type_unary_keyword: (node) => new AST.ASTNodeTypeOperationUnary(
				node as SyntaxNodeType<'type_unary_keyword'>,
				DecoratorSolid.TYPEOPERATORS_UNARY.get(node.children[0].text as Keyword)!,
				this.decorateTS(node.children[1] as SyntaxNodeSupertype<'type'>),
			),

			type_intersection: (node) => new AST.ASTNodeTypeOperationBinary(
				node as SyntaxNodeType<'type_intersection'>,
				DecoratorSolid.TYPEOPERATORS_BINARY.get(node.children[1].text as Punctuator)!,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			),

			type_union: (node) => new AST.ASTNodeTypeOperationBinary(
				node as SyntaxNodeType<'type_union'>,
				DecoratorSolid.TYPEOPERATORS_BINARY.get(node.children[1].text as Punctuator)!,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			),

			/* ## Expressions */
			string_template: (node) => new AST.ASTNodeTemplate(
				node as SyntaxNodeType<'string_template'>,
				node.children.map((c) => (isSyntaxNodeType(c, /^template_(full|head|middle|tail)$/))
					? new AST.ASTNodeConstant(c as SyntaxNodeType<`template_${ 'full' | 'head' | 'middle' | 'tail' }`>)
					: this.decorateTS(c as SyntaxNodeSupertype<'expression'>)
				),
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
				node as SyntaxNodeType<'tuple_literal'>,
				node.children
					.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
					.map((c) => this.decorateTS(c)),
			),

			record_literal: (node) => new AST.ASTNodeRecord(
				node as SyntaxNodeType<'record_literal'>,
				node.children
					.filter((c): c is SyntaxNodeType<'property'> => isSyntaxNodeType(c, 'property'))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeProperty>,
			),

			set_literal: (node) => new AST.ASTNodeSet(
				node as SyntaxNodeType<'set_literal'>,
				node.children
					.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
					.map((c) => this.decorateTS(c)),
			),

			map_literal: (node) => new AST.ASTNodeMap(
				node as SyntaxNodeType<'map_literal'>,
				node.children
					.filter((c): c is SyntaxNodeType<'case'> => isSyntaxNodeType(c, 'case'))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeCase>,
			),

			property_access: (node) => (
				(isSyntaxNodeType(node.children[1], 'integer')) ? new AST.ASTNodeIndex(
					node as SyntaxNodeType<'property_access'>,
					new AST.ASTNodeConstant(node.children[1]),
				) :
				(isSyntaxNodeType     (node.children[1], 'word'))      ? this.decorateTS(node.children[1] as SyntaxNodeType<'word'>) :
				(isSyntaxNodeSupertype(node.children[2], 'expression'),  this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>))
			),

			property_assign: (node) => (
				(isSyntaxNodeType(node.children[1], 'integer')) ? new AST.ASTNodeIndex(
					node as SyntaxNodeType<'property_assign'>,
					new AST.ASTNodeConstant(node.children[1]),
				) :
				(isSyntaxNodeType     (node.children[1], 'word'))      ? this.decorateTS(node.children[1] as SyntaxNodeType<'word'>) :
				(isSyntaxNodeSupertype(node.children[2], 'expression'),  this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>))
			),

			expression_compound: (node) => (
				(isSyntaxNodeType(node.children[1], 'property_access')) ? new AST.ASTNodeAccess(
					node as SyntaxNodeType<'expression_compound'>,
					DecoratorSolid.ACCESSORS.get(node.children[1].children[0].text as Punctuator)!,
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[1] as SyntaxNodeType<'property_access'>),
				)
				: (isSyntaxNodeType(node.children[1], 'function_call'), new AST.ASTNodeCall(
					node as SyntaxNodeType<'expression_compound'>,
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
				? new AST.ASTNodeVariable(node.children[0] as SyntaxNodeType<'identifier'>)
				: new AST.ASTNodeAccess(
					node as SyntaxNodeType<'assignee'>,
					Operator.DOT,
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[1] as SyntaxNodeType<'property_assign'>),
				),

			expression_unary_symbol: (node) => (node.children[0].text === Punctuator.AFF) // `+a` is a no-op
				? this.decorateTS(node.children[1] as SyntaxNodeSupertype<'expression'>)
				: new AST.ASTNodeOperationUnary(
					node as SyntaxNodeType<'expression_unary_symbol'>,
					DecoratorSolid.OPERATORS_UNARY.get(node.children[0].text as Punctuator) as ValidOperatorUnary,
					this.decorateTS(node.children[1] as SyntaxNodeSupertype<'expression'>),
				),

			expression_claim: (node) => new AST.ASTNodeClaim(
				node as SyntaxNodeType<'expression_claim'>,
				this.decorateTypeNode (node.children[1] as SyntaxNodeSupertype<'type'>),
				this.decorateTS       (node.children[3] as SyntaxNodeSupertype<'expression'>),
			),

			expression_exponential: (node) => new AST.ASTNodeOperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_exponential'>,
				DecoratorSolid.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			),

			expression_multiplicative: (node) => new AST.ASTNodeOperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_multiplicative'>,
				DecoratorSolid.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			),

			expression_additive: (node) => ((operator: Operator, operands: [AST.ASTNodeExpression, AST.ASTNodeExpression]) => (
				// `a - b` is syntax sugar for `a + -(b)`
				(operator === Operator.SUB) ? new AST.ASTNodeOperationBinaryArithmetic(
					node as SyntaxNodeType<'expression_additive'>,
					Operator.ADD,
					operands[0],
					new AST.ASTNodeOperationUnary(
						node.children[2] as SyntaxNodeSupertype<'expression'>,
						Operator.NEG,
						operands[1],
					),
				) :
				new AST.ASTNodeOperationBinaryArithmetic(
					node as SyntaxNodeType<'expression_additive'>,
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
					node as SyntaxNodeType<'expression_comparative'>,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryComparative(
						node.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.LT,
						...operands,
					),
				) :
				// `a !> b` is syntax sugar for `!(a > b)`
				(operator === Operator.NGT) ? new AST.ASTNodeOperationUnary(
					node as SyntaxNodeType<'expression_comparative'>,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryComparative(
						node.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.GT,
						...operands,
					),
				) :
				// `a isnt b` is syntax sugar for `!(a is b)`
				(operator === Operator.ISNT) ? new AST.ASTNodeOperationUnary(
					node as SyntaxNodeType<'expression_comparative'>,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryComparative(
						node.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.IS,
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryComparative(
					node as SyntaxNodeType<'expression_comparative'>,
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
					node as SyntaxNodeType<'expression_equality'>,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryEquality(
						node.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.ID,
						...operands,
					),
				) :
				// `a != b` is syntax sugar for `!(a == b)`
				(operator === Operator.NEQ) ? new AST.ASTNodeOperationUnary(
					node as SyntaxNodeType<'expression_equality'>,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryEquality(
						node.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.EQ,
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryEquality(
					node as SyntaxNodeType<'expression_equality'>,
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
					node as SyntaxNodeType<'expression_conjunctive'>,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryLogical(
						node.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.AND,
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryLogical(
					node as SyntaxNodeType<'expression_conjunctive'>,
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
					node as SyntaxNodeType<'expression_disjunctive'>,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryLogical(
						node.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.OR,
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryLogical(
					node as SyntaxNodeType<'expression_disjunctive'>,
					operator as ValidOperatorLogical,
					...operands,
				)
			))(DecoratorSolid.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!, [
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			]),

			expression_conditional: (node) => new AST.ASTNodeOperationTernary(
				node as SyntaxNodeType<'expression_conditional'>,
				Operator.COND,
				this.decorateTS(node.children[1] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[3] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[5] as SyntaxNodeSupertype<'expression'>),
			),

			/* ## Statements */
			declaration_type: (node) => new AST.ASTNodeDeclarationType(
				node as SyntaxNodeType<'declaration_type'>,
				new AST.ASTNodeTypeAlias(node.children[1] as SyntaxNodeType<'identifier'>),
				this.decorateTS(node.children[3] as SyntaxNodeSupertype<'type'>),
			),

			declaration_variable: (node) => new AST.ASTNodeDeclarationVariable(
				node as SyntaxNodeType<'declaration_variable'>,
				node.children.length === 8,
				new AST.ASTNodeVariable (((node.children.length === 7) ? node.children[1] : node.children[2]) as SyntaxNodeType<'identifier'>),
				this.decorateTypeNode   (((node.children.length === 7) ? node.children[3] : node.children[4]) as SyntaxNodeSupertype<'type'>),
				this.decorateTS         (((node.children.length === 7) ? node.children[5] : node.children[6]) as SyntaxNodeSupertype<'expression'>),
			),

			statement_expression: (node) => new AST.ASTNodeStatementExpression(
				node as SyntaxNodeType<'statement_expression'>,
				(node.children.length === 2) ? this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>) : void 0,
			),

			statement_assignment: (node) => new AST.ASTNodeAssignment(
				node as SyntaxNodeType<'statement_assignment'>,
				this.decorateTS(node.children[0] as SyntaxNodeType<'assignee'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			),
		})).get(node.type)?.(node) || (() => {
			throw new TypeError(`Could not find type of parse node \`${ node.type }\`.`);
		})();
	}

	private decorateTypeNode(typenode: SyntaxNodeSupertype<'type'>): AST.ASTNodeType {
		return (
			(isSyntaxNodeType(typenode, 'identifier'))        ? new AST.ASTNodeTypeAlias    (typenode) :
			(isSyntaxNodeType(typenode, 'primitive_literal')) ? new AST.ASTNodeTypeConstant (typenode) :
			this.decorateTS(typenode)
		);
	}
}



export const DECORATOR: DecoratorSolid = new DecoratorSolid();

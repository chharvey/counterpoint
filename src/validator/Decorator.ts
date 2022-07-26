import type {SyntaxNode} from 'tree-sitter';
import {
	NonemptyArray,
	CPConfig,
	CONFIG_DEFAULT,
	Punctuator,
	Keyword,
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
} from './Operator.js';
import * as AST from './astnode-solid/index.js';



class Decorator {
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


	decorateTS(node: SyntaxNodeType<'keyword_type'>):                            AST.ASTNodeTypeConstant;
	decorateTS(node: SyntaxNodeType<'identifier'>):                              AST.ASTNodeTypeAlias | AST.ASTNodeVariable;
	decorateTS(node: SyntaxNodeType<'word'>):                                    AST.ASTNodeKey;
	decorateTS(node: SyntaxNodeType<'primitive_literal'>):                       AST.ASTNodeTypeConstant | AST.ASTNodeConstant;
	decorateTS(node: SyntaxNodeType<`entry_type${ '' | '__optional' }`>):        AST.ASTNodeItemType;
	decorateTS(node: SyntaxNodeType<`entry_type__named${ '' | '__optional' }`>): AST.ASTNodePropertyType;
	decorateTS(node: SyntaxNodeType<'type_grouped'>):                            AST.ASTNodeType;
	decorateTS(node: SyntaxNodeType<'type_tuple_literal'>):                      AST.ASTNodeTypeTuple;
	decorateTS(node: SyntaxNodeType<'type_record_literal'>):                     AST.ASTNodeTypeRecord;
	decorateTS(node: SyntaxNodeType<'type_dict_literal'>):                       AST.ASTNodeTypeDict;
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
	decorateTS(node: SyntaxNodeType<'source_file'>, config?: CPConfig):          AST.ASTNodeGoal;
	decorateTS(node: SyntaxNode): AST.ASTNodeSolid;
	decorateTS(node: SyntaxNode, config: CPConfig = CONFIG_DEFAULT): AST.ASTNodeSolid {
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

			type_dict_literal: (node) => new AST.ASTNodeTypeDict(
				node as SyntaxNodeType<'type_dict_literal'>,
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
					Decorator.TYPEOPERATORS_UNARY.get(node.children[1].text as Punctuator)!,
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
				Decorator.TYPEOPERATORS_UNARY.get(node.children[0].text as Keyword)!,
				this.decorateTS(node.children[1] as SyntaxNodeSupertype<'type'>),
			),

			type_intersection: (node) => new AST.ASTNodeTypeOperationBinary(
				node as SyntaxNodeType<'type_intersection'>,
				Decorator.TYPEOPERATORS_BINARY.get(node.children[1].text as Punctuator)!,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			),

			type_union: (node) => new AST.ASTNodeTypeOperationBinary(
				node as SyntaxNodeType<'type_union'>,
				Decorator.TYPEOPERATORS_BINARY.get(node.children[1].text as Punctuator)!,
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
					Decorator.ACCESSORS.get(node.children[1].children[0].text as Punctuator)!,
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
					Decorator.OPERATORS_UNARY.get(node.children[0].text as Punctuator) as ValidOperatorUnary,
					this.decorateTS(node.children[1] as SyntaxNodeSupertype<'expression'>),
				),

			expression_claim: (node) => new AST.ASTNodeClaim(
				node as SyntaxNodeType<'expression_claim'>,
				this.decorateTypeNode (node.children[1] as SyntaxNodeSupertype<'type'>),
				this.decorateTS       (node.children[3] as SyntaxNodeSupertype<'expression'>),
			),

			expression_exponential: (node) => new AST.ASTNodeOperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_exponential'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			),

			expression_multiplicative: (node) => new AST.ASTNodeOperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_multiplicative'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
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
			))(Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!, [
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
			))(Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!, [
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
			))(Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!, [
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
			))(Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!, [
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
			))(Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!, [
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



export const DECORATOR: Decorator = new Decorator();

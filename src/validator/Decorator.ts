import type {SyntaxNode} from 'tree-sitter';
import type {NonemptyArray} from '../lib/index.js';
import {
	CPConfig,
	CONFIG_DEFAULT,
} from '../core/index.js';
import {
	Punctuator,
	Keyword,
} from '../parser/index.js';
import {Validator} from './index.js';
import {
	SyntaxNodeType,
	isSyntaxNodeType,
	SyntaxNodeFamily,
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
import * as AST from './astnode-cp/index.js';



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
	]);

	private static readonly TYPEOPERATORS_BINARY: ReadonlyMap<Punctuator, ValidTypeOperator> = new Map<Punctuator, ValidTypeOperator>([
		[Punctuator.INTER, Operator.AND],
		[Punctuator.UNION, Operator.OR],
	]);

	private static readonly OPERATORS_UNARY: ReadonlyMap<Punctuator, Operator> = new Map<Punctuator, Operator>([
		[Punctuator.NOT, Operator.NOT],
		[Punctuator.EMP, Operator.EMP],
		[Punctuator.AFF, Operator.AFF],
		[Punctuator.NEG, Operator.NEG],
	]);

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
	]);


	public decorateTS(syntaxnode: SyntaxNodeType<'keyword_type'>):                              AST.ASTNodeTypeConstant;
	public decorateTS(syntaxnode: SyntaxNodeType<'identifier'>):                                AST.ASTNodeTypeAlias | AST.ASTNodeVariable;
	public decorateTS(syntaxnode: SyntaxNodeType<'word'>):                                      AST.ASTNodeKey;
	public decorateTS(syntaxnode: SyntaxNodeType<'primitive_literal'>):                         AST.ASTNodeTypeConstant | AST.ASTNodeConstant;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'entry_type',        ['optional']>):         AST.ASTNodeItemType;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'entry_type__named', ['optional']>):         AST.ASTNodePropertyType;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_grouped'>):                              AST.ASTNodeType;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_tuple_literal'>):                        AST.ASTNodeTypeTuple;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_record_literal'>):                       AST.ASTNodeTypeRecord;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_dict_literal'>):                         AST.ASTNodeTypeDict;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_map_literal'>):                          AST.ASTNodeTypeMap;
	public decorateTS(syntaxnode: SyntaxNodeType<'property_access_type'>):                      AST.ASTNodeIndexType | AST.ASTNodeKey;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_compound'>):                             AST.ASTNodeTypeAccess | AST.ASTNodeTypeCall;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_unary_symbol'>):                         AST.ASTNodeTypeOperationUnary | AST.ASTNodeTypeList | AST.ASTNodeTypeSet;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_unary_keyword'>):                        AST.ASTNodeTypeOperationUnary;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_intersection'>):                         AST.ASTNodeTypeOperationBinary;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_union'>):                                AST.ASTNodeTypeOperationBinary;
	public decorateTS(syntaxnode: SyntaxNodeSupertype<'type'>):                                 AST.ASTNodeType;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'string_template', ['variable']>):           AST.ASTNodeTemplate;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'property',        ['variable']>):           AST.ASTNodeProperty;
	public decorateTS(syntaxnode: SyntaxNodeType<'case'>):                                      AST.ASTNodeCase;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'expression_grouped', ['variable']>):        AST.ASTNodeExpression;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'tuple_literal',      ['variable']>):        AST.ASTNodeTuple;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'record_literal',     ['variable']>):        AST.ASTNodeRecord;
	public decorateTS(syntaxnode: SyntaxNodeType<'set_literal'>):                               AST.ASTNodeSet;
	public decorateTS(syntaxnode: SyntaxNodeType<'map_literal'>):                               AST.ASTNodeMap;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'property_access', ['variable']>):           AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression;
	public decorateTS(syntaxnode: SyntaxNodeType<'property_assign'>):                           AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'expression_compound', ['variable']>):       AST.ASTNodeAccess | AST.ASTNodeCall;
	public decorateTS(syntaxnode: SyntaxNodeType<'assignee'>):                                  AST.ASTNodeVariable | AST.ASTNodeAccess;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'expression_unary_symbol',   ['variable']>): AST.ASTNodeExpression | AST.ASTNodeOperationUnary;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'expression_claim',          ['variable']>): AST.ASTNodeClaim;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'expression_exponential',    ['variable']>): AST.ASTNodeOperationBinaryArithmetic;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'expression_multiplicative', ['variable']>): AST.ASTNodeOperationBinaryArithmetic;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'expression_additive',       ['variable']>): AST.ASTNodeOperationBinaryArithmetic;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'expression_comparative',    ['variable']>): AST.ASTNodeOperationUnary | AST.ASTNodeOperationBinaryComparative;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'expression_equality',       ['variable']>): AST.ASTNodeOperationUnary | AST.ASTNodeOperationBinaryEquality;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'expression_conjunctive',    ['variable']>): AST.ASTNodeOperationUnary | AST.ASTNodeOperationBinaryLogical;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'expression_disjunctive',    ['variable']>): AST.ASTNodeOperationUnary | AST.ASTNodeOperationBinaryLogical;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'expression_conditional',    ['variable']>): AST.ASTNodeOperationTernary;
	public decorateTS(syntaxnode: SyntaxNodeSupertype<'expression'>):                           AST.ASTNodeExpression;
	public decorateTS(syntaxnode: SyntaxNodeType<'declaration_type'>):                          AST.ASTNodeDeclarationType;
	public decorateTS(syntaxnode: SyntaxNodeType<'declaration_variable'>):                      AST.ASTNodeDeclarationVariable;
	public decorateTS(syntaxnode: SyntaxNodeSupertype<'declaration'>):                          AST.ASTNodeDeclaration;
	public decorateTS(syntaxnode: SyntaxNodeType<'statement_expression'>):                      AST.ASTNodeStatementExpression;
	public decorateTS(syntaxnode: SyntaxNodeType<'statement_assignment'>):                      AST.ASTNodeAssignment;
	public decorateTS(syntaxnode: SyntaxNodeSupertype<'statement'>):                            AST.ASTNodeStatement;
	public decorateTS(syntaxnode: SyntaxNodeType<'source_file'>, config?: CPConfig):            AST.ASTNodeGoal;
	public decorateTS(syntaxnode: SyntaxNode): AST.ASTNodeCP;
	public decorateTS(syntaxnode: SyntaxNode, config: CPConfig = CONFIG_DEFAULT): AST.ASTNodeCP {
		const decorators = new Map<string | RegExp, (node: SyntaxNode) => AST.ASTNodeCP>([
			['source_file', (node) => new AST.ASTNodeGoal(
				node as SyntaxNodeType<'source_file'>,
				node.children
					.filter((c): c is SyntaxNodeSupertype<'statement'> => isSyntaxNodeSupertype(c, 'statement'))
					.map((c) => this.decorateTS(c)),
				config,
			)],

			/* # TERMINALS */
			['keyword_type', (node) => new AST.ASTNodeTypeConstant(node as SyntaxNodeType<'keyword_type'>)],

			['identifier', (node) => (
				(isSyntaxNodeSupertype(node.parent!, 'type'))      || isSyntaxNodeType(node.parent!, /^(entry_type(__named)?(__optional)?|generic_arguments|declaration_type)$/)                                                            ? new AST.ASTNodeTypeAlias(node as SyntaxNodeType<'identifier'>) :
				(isSyntaxNodeSupertype(node.parent!, 'expression') || isSyntaxNodeType(node.parent!, /^(property|case|function_arguments|property_access|property_assign|declaration_variable|statement_expression|statement_assignment)$/),  new AST.ASTNodeVariable (node as SyntaxNodeType<'identifier'>))
			)],

			/* # PRODUCTIONS */
			['word', (node) => new AST.ASTNodeKey(node as SyntaxNodeType<'word'>)],

			['primitive_literal', (node) => (
				(isSyntaxNodeSupertype(node.parent!, 'type'))      || isSyntaxNodeType(node.parent!, /^(entry_type(__named)?(__optional)?|generic_arguments|declaration_type)$/)                                                            ? new AST.ASTNodeTypeConstant(node as SyntaxNodeType<'primitive_literal'>) :
				(isSyntaxNodeSupertype(node.parent!, 'expression') || isSyntaxNodeType(node.parent!, /^(property|case|function_arguments|property_access|property_assign|declaration_variable|statement_expression|statement_assignment)$/),  new AST.ASTNodeConstant    (node as SyntaxNodeType<'primitive_literal'>))
			)],

			/* ## Types */
			['entry_type', (node) => new AST.ASTNodeItemType(
				node as SyntaxNodeType<'entry_type'>,
				false,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
			)],

			['entry_type__optional', (node) => new AST.ASTNodeItemType(
				node as SyntaxNodeType<'entry_type__optional'>,
				true,
				this.decorateTS(node.children[1] as SyntaxNodeSupertype<'type'>),
			)],

			['entry_type__named', (node) => new AST.ASTNodePropertyType(
				node as SyntaxNodeType<'entry_type__named'>,
				false,
				this.decorateTS(node.children[0] as SyntaxNodeType<'word'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			['entry_type__named__optional', (node) => new AST.ASTNodePropertyType(
				node as SyntaxNodeType<'entry_type__named__optional'>,
				true,
				this.decorateTS(node.children[0] as SyntaxNodeType<'word'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			['type_grouped', (node) => this.decorateTS(node.children[1] as SyntaxNodeSupertype<'type'>)],

			['type_tuple_literal', (node) => new AST.ASTNodeTypeTuple(
				node as SyntaxNodeType<'type_tuple_literal'>,
				node.children
					.filter((c): c is SyntaxNodeType<'entry_type' | 'entry_type__optional'> => isSyntaxNodeType(c, /^entry_type(__optional)?$/))
					.map((c) => this.decorateTS(c)),
			)],

			['type_record_literal', (node) => new AST.ASTNodeTypeRecord(
				node as SyntaxNodeType<'type_record_literal'>,
				node.children
					.filter((c): c is SyntaxNodeType<'entry_type__named' | 'entry_type__named__optional'> => isSyntaxNodeType(c, /^entry_type__named(__optional)?$/))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodePropertyType>,
			)],

			['type_dict_literal', (node) => new AST.ASTNodeTypeDict(
				node as SyntaxNodeType<'type_dict_literal'>,
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			['type_map_literal', (node) => new AST.ASTNodeTypeMap(
				node as SyntaxNodeType<'type_map_literal'>,
				this.decorateTS(node.children[1] as SyntaxNodeSupertype<'type'>),
				this.decorateTS(node.children[3] as SyntaxNodeSupertype<'type'>),
			)],

			['property_access_type', (node) => (
				(isSyntaxNodeType(node.children[1], 'integer')) ? new AST.ASTNodeIndexType(
					node as SyntaxNodeType<'property_access_type'>,
					new AST.ASTNodeTypeConstant(node.children[1]),
				) :
				(isSyntaxNodeType(node.children[1], 'word'), this.decorateTS(node.children[1] as SyntaxNodeType<'word'>))
			)],

			['type_compound', (node) => (
				(isSyntaxNodeType(node.children[1], 'property_access_type')) ? new AST.ASTNodeTypeAccess(
					node as SyntaxNodeType<'type_compound'>,
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
					this.decorateTS(node.children[1]),
				) :
				(isSyntaxNodeType(node.children[1], 'generic_call'), new AST.ASTNodeTypeCall(
					node as SyntaxNodeType<'type_compound'>,
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
					((node.children[1] as SyntaxNodeType<'generic_call'>).children[1] as SyntaxNodeType<'generic_arguments'>).children
						.filter((c): c is SyntaxNodeSupertype<'type'> => isSyntaxNodeSupertype(c, 'type'))
						.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeType>,
				))
			)],

			['type_unary_symbol', (node) => (
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
							})[0]),
					)
					: new AST.ASTNodeTypeSet(
						node as SyntaxNodeType<'type_unary_symbol'>,
						this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
					)
				)
			)],

			['type_unary_keyword', (node) => new AST.ASTNodeTypeOperationUnary(
				node as SyntaxNodeType<'type_unary_keyword'>,
				Decorator.TYPEOPERATORS_UNARY.get(node.children[0].text as Keyword)!,
				this.decorateTS(node.children[1] as SyntaxNodeSupertype<'type'>),
			)],

			['type_intersection', (node) => new AST.ASTNodeTypeOperationBinary(
				node as SyntaxNodeType<'type_intersection'>,
				Decorator.TYPEOPERATORS_BINARY.get(node.children[1].text as Punctuator)!,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			['type_union', (node) => new AST.ASTNodeTypeOperationBinary(
				node as SyntaxNodeType<'type_union'>,
				Decorator.TYPEOPERATORS_BINARY.get(node.children[1].text as Punctuator)!,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			/* ## Expressions */
			[/^string_template(__variable)?$/, (node) => new AST.ASTNodeTemplate(
				node as SyntaxNodeFamily<'string_template', ['variable']>,
				node.children.map((c) => ((isSyntaxNodeType(c, /^template_(full|head|middle|tail)$/))
					? new AST.ASTNodeConstant(c as SyntaxNodeType<`template_${ 'full' | 'head' | 'middle' | 'tail' }`>)
					: this.decorateTS(c as SyntaxNodeSupertype<'expression'>)
				)),
			)],

			[/^property(__variable)?$/, (node) => new AST.ASTNodeProperty(
				node as SyntaxNodeFamily<'property', ['variable']>,
				this.decorateTS(node.children[0] as SyntaxNodeType<'word'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			['case', (node) => new AST.ASTNodeCase(
				node as SyntaxNodeType<'case'>,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			[/^expression_grouped(__variable)?$/, (node) => this.decorateTS(node.children[1] as SyntaxNodeSupertype<'expression'>)],

			[/^tuple_literal(__variable)?$/, (node) => new AST.ASTNodeTuple(
				node as SyntaxNodeFamily<'tuple_literal', ['variable']>,
				node.children
					.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
					.map((c) => this.decorateTS(c)),
			)],

			[/^record_literal(__variable)?$/, (node) => new AST.ASTNodeRecord(
				node as SyntaxNodeFamily<'record_literal', ['variable']>,
				node.children
					.filter((c): c is SyntaxNodeFamily<'property', ['variable']> => isSyntaxNodeType(c, /^property(__variable)?$/))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeProperty>,
			)],

			['set_literal', (node) => new AST.ASTNodeSet(
				node as SyntaxNodeType<'set_literal'>,
				node.children
					.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
					.map((c) => this.decorateTS(c)),
			)],

			['map_literal', (node) => new AST.ASTNodeMap(
				node as SyntaxNodeType<'map_literal'>,
				node.children
					.filter((c): c is SyntaxNodeType<'case'> => isSyntaxNodeType(c, 'case'))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeCase>,
			)],

			[/^property_access(__variable)?$/, (node) => (
				(isSyntaxNodeType(node.children[1], 'integer')) ? new AST.ASTNodeIndex(
					node as SyntaxNodeFamily<'property_access', ['variable']>,
					new AST.ASTNodeConstant(node.children[1]),
				) :
				(isSyntaxNodeType     (node.children[1], 'word'))      ? this.decorateTS(node.children[1]) :
				(isSyntaxNodeSupertype(node.children[2], 'expression'),  this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>))
			)],

			['property_assign', (node) => (
				(isSyntaxNodeType(node.children[1], 'integer')) ? new AST.ASTNodeIndex(
					node as SyntaxNodeType<'property_assign'>,
					new AST.ASTNodeConstant(node.children[1]),
				) :
				(isSyntaxNodeType     (node.children[1], 'word'))      ? this.decorateTS(node.children[1]) :
				(isSyntaxNodeSupertype(node.children[2], 'expression'),  this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>))
			)],

			[/^expression_compound(__variable)?$/, (node) => (
				(isSyntaxNodeType(node.children[1], /^property_access(__variable)?$/)) ? new AST.ASTNodeAccess(
					node as SyntaxNodeFamily<'expression_compound', ['variable']>,
					Decorator.ACCESSORS.get(node.children[1].children[0].text as Punctuator)!,
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[1] as SyntaxNodeFamily<'property_access', ['variable']>),
				)
				: (isSyntaxNodeType(node.children[1], 'function_call'), ((
					n:                      SyntaxNodeType<'expression_compound__variable'>,
					function_call_children: SyntaxNode[],
				) => new AST.ASTNodeCall(
					n,
					this.decorateTS(n.children[0] as SyntaxNodeSupertype<'expression'>),
					function_call_children
						.find((c): c is SyntaxNodeType<'generic_arguments'> => isSyntaxNodeType(c, 'generic_arguments'))?.children
						.filter((c): c is SyntaxNodeSupertype<'type'> => isSyntaxNodeSupertype(c, 'type'))
						.map((c) => this.decorateTS(c)) || [],
					function_call_children
						.find((c): c is SyntaxNodeType<'function_arguments'> => isSyntaxNodeType(c, 'function_arguments'))!.children
						.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
						.map((c) => this.decorateTS(c)),
				))(
					node as SyntaxNodeType<'expression_compound__variable'>,
					(node.children[1] as SyntaxNodeType<'function_call'>).children,
				))
			)],

			['assignee', (node) => (node.children.length === 1)
				? new AST.ASTNodeVariable(node.children[0] as SyntaxNodeType<'identifier'>)
				: new AST.ASTNodeAccess(
					node as SyntaxNodeType<'assignee'>,
					Operator.DOT,
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[1] as SyntaxNodeType<'property_assign'>),
				)],

			[/^expression_unary_symbol(__variable)?$/, (node) => (node.children[0].text === Punctuator.AFF) // `+a` is a no-op
				? this.decorateTS(node.children[1] as SyntaxNodeSupertype<'expression'>)
				: new AST.ASTNodeOperationUnary(
					node as SyntaxNodeFamily<'expression_unary_symbol', ['variable']>,
					Decorator.OPERATORS_UNARY.get(node.children[0].text as Punctuator) as ValidOperatorUnary,
					this.decorateTS(node.children[1] as SyntaxNodeSupertype<'expression'>),
				)],

			[/^expression_claim(__variable)?$/, (node) => new AST.ASTNodeClaim(
				node as SyntaxNodeFamily<'expression_claim', ['variable']>,
				this.decorateTypeNode(node.children[1] as SyntaxNodeSupertype<'type'>),
				this.decorateTS      (node.children[3] as SyntaxNodeSupertype<'expression'>),
			)],

			[/^expression_exponential(__variable)?$/, (node) => new AST.ASTNodeOperationBinaryArithmetic(
				node as SyntaxNodeFamily<'expression_exponential', ['variable']>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			[/^expression_multiplicative(__variable)?$/, (node) => new AST.ASTNodeOperationBinaryArithmetic(
				node as SyntaxNodeFamily<'expression_multiplicative', ['variable']>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			[/^expression_additive(__variable)?$/, (node) => ((
				n:        SyntaxNodeFamily<'expression_additive', ['variable']>,
				operator: Operator,
				operands: readonly [AST.ASTNodeExpression, AST.ASTNodeExpression],
			) => (
				// `a - b` is syntax sugar for `a + -(b)`
				(operator === Operator.SUB) ? new AST.ASTNodeOperationBinaryArithmetic(
					n,
					Operator.ADD,
					operands[0],
					new AST.ASTNodeOperationUnary(
						n.children[2] as SyntaxNodeSupertype<'expression'>,
						Operator.NEG,
						operands[1],
					),
				) :
				new AST.ASTNodeOperationBinaryArithmetic(
					n,
					operator as ValidOperatorArithmetic,
					...operands,
				)
			))(
				node as SyntaxNodeFamily<'expression_additive', ['variable']>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
				],
			)],

			[/^expression_comparative(__variable)?$/, (node) => ((
				n:        SyntaxNodeFamily<'expression_comparative', ['variable']>,
				operator: Operator,
				operands: readonly [AST.ASTNodeExpression, AST.ASTNodeExpression],
			) => (
				// `a !< b` is syntax sugar for `!(a < b)`
				(operator === Operator.NLT) ? new AST.ASTNodeOperationUnary(
					n,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryComparative(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.LT,
						...operands,
					),
				) :
				// `a !> b` is syntax sugar for `!(a > b)`
				(operator === Operator.NGT) ? new AST.ASTNodeOperationUnary(
					n,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryComparative(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.GT,
						...operands,
					),
				) :
				// `a isnt b` is syntax sugar for `!(a is b)`
				(operator === Operator.ISNT) ? new AST.ASTNodeOperationUnary(
					n,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryComparative(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.IS,
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryComparative(
					n,
					operator as ValidOperatorComparative,
					...operands,
				)
			))(
				node as SyntaxNodeFamily<'expression_comparative', ['variable']>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
				],
			)],

			[/^expression_equality(__variable)?$/, (node) => ((
				n:        SyntaxNodeFamily<'expression_equality', ['variable']>,
				operator: Operator,
				operands: readonly [AST.ASTNodeExpression, AST.ASTNodeExpression],
			) => (
				// `a !== b` is syntax sugar for `!(a === b)`
				(operator === Operator.NID) ? new AST.ASTNodeOperationUnary(
					n,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryEquality(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.ID,
						...operands,
					),
				) :
				// `a != b` is syntax sugar for `!(a == b)`
				(operator === Operator.NEQ) ? new AST.ASTNodeOperationUnary(
					n,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryEquality(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.EQ,
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryEquality(
					n,
					operator as ValidOperatorEquality,
					...operands,
				)
			))(
				node as SyntaxNodeFamily<'expression_equality', ['variable']>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
				],
			)],

			[/^expression_conjunctive(__variable)?$/, (node) => ((
				n:        SyntaxNodeFamily<'expression_conjunctive', ['variable']>,
				operator: Operator,
				operands: readonly [AST.ASTNodeExpression, AST.ASTNodeExpression],
			) => (
				// `a !& b` is syntax sugar for `!(a && b)`
				(operator === Operator.NAND) ? new AST.ASTNodeOperationUnary(
					n,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryLogical(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.AND,
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryLogical(
					n,
					operator as ValidOperatorLogical,
					...operands,
				)
			))(
				node as SyntaxNodeFamily<'expression_conjunctive', ['variable']>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
				],
			)],

			[/^expression_disjunctive(__variable)?$/, (node) => ((
				n:        SyntaxNodeFamily<'expression_disjunctive', ['variable']>,
				operator: Operator,
				operands: readonly [AST.ASTNodeExpression, AST.ASTNodeExpression],
			) => (
				// `a !| b` is syntax sugar for `!(a || b)`
				(operator === Operator.NOR) ? new AST.ASTNodeOperationUnary(
					n,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryLogical(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.OR,
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryLogical(
					n,
					operator as ValidOperatorLogical,
					...operands,
				)
			))(
				node as SyntaxNodeFamily<'expression_disjunctive', ['variable']>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
				],
			)],

			[/^expression_conditional(__variable)?$/, (node) => new AST.ASTNodeOperationTernary(
				node as SyntaxNodeType<'expression_conditional'>,
				Operator.COND,
				this.decorateTS(node.children[1] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[3] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[5] as SyntaxNodeSupertype<'expression'>),
			)],

			/* ## Statements */
			['declaration_type', (node) => new AST.ASTNodeDeclarationType(
				node as SyntaxNodeType<'declaration_type'>,
				new AST.ASTNodeTypeAlias(node.children[1] as SyntaxNodeType<'identifier'>),
				this.decorateTS(node.children[3] as SyntaxNodeSupertype<'type'>),
			)],

			['declaration_variable', (node) => new AST.ASTNodeDeclarationVariable(
				node as SyntaxNodeType<'declaration_variable'>,
				node.children.length === 8,
				new AST.ASTNodeVariable(((node.children.length === 7) ? node.children[1] : node.children[2]) as SyntaxNodeType<'identifier'>),
				this.decorateTypeNode  (((node.children.length === 7) ? node.children[3] : node.children[4]) as SyntaxNodeSupertype<'type'>),
				this.decorateTS        (((node.children.length === 7) ? node.children[5] : node.children[6]) as SyntaxNodeSupertype<'expression'>),
			)],

			['statement_expression', (node) => new AST.ASTNodeStatementExpression(
				node as SyntaxNodeType<'statement_expression'>,
				(node.children.length === 2) ? this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>) : void 0,
			)],

			['statement_assignment', (node) => new AST.ASTNodeAssignment(
				node as SyntaxNodeType<'statement_assignment'>,
				this.decorateTS(node.children[0] as SyntaxNodeType<'assignee'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],
		]);
		return (
			   decorators.get(syntaxnode.type)
			?? [...decorators].find(([key]) => key instanceof RegExp && isSyntaxNodeType(syntaxnode, key))?.[1]
			?? ((node) => {
				throw new TypeError(`Could not find type of parse node \`${ node.type }\`.`);
			})
		)(syntaxnode);
	}

	private decorateTypeNode(typenode: SyntaxNodeSupertype<'type'>): AST.ASTNodeType {
		return (
			(isSyntaxNodeType(typenode, 'identifier'))        ? new AST.ASTNodeTypeAlias   (typenode) :
			(isSyntaxNodeType(typenode, 'primitive_literal')) ? new AST.ASTNodeTypeConstant(typenode) :
			this.decorateTS(typenode)
		);
	}
}



export const DECORATOR: Decorator = new Decorator();

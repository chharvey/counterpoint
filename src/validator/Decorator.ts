import * as assert from 'node:assert';
import type {SyntaxNode} from 'tree-sitter';
import type {NonemptyArray} from '../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../core/index.ts';
import {
	Punctuator,
	Keyword,
} from '../parser/index.ts';
import {AST} from './index.ts';
import {
	type SyntaxNodeType,
	isSyntaxNodeType,
	type SyntaxNodeFamily,
	isSyntaxNodeFamily,
	type SyntaxNodeSupertype,
	isSyntaxNodeSupertype,
} from './utils-private.ts';
import {
	Operator,
	type ValidTypeAccessOperator,
	type ValidAccessOperator,
	type ValidTypeOperator,
	type ValidOperatorUnary,
	type ValidOperatorCast,
	type ValidOperatorArithmetic,
	type ValidOperatorComparative,
	type ValidOperatorEquality,
	type ValidOperatorLogical,
} from './Operator.ts';



export class Decorator {
	private static readonly ACCESSORS: ReadonlyMap<Punctuator, ValidAccessOperator> = new Map<Punctuator, ValidAccessOperator>([
		[Punctuator.DOT,     Operator.DOT],
		[Punctuator.DOT_MAY, Operator.DOT_MAY],
		[Punctuator.DOT_RES, Operator.DOT_RES],
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

	private static readonly OPERATORS_UNARY: ReadonlyMap<Punctuator | Keyword, Operator> = new Map<Punctuator | Keyword, Operator>([
		[Punctuator.NOT, Operator.NOT],
		[Punctuator.EMP, Operator.EMP],
		[Punctuator.AFF, Operator.AFF],
		[Punctuator.NEG, Operator.NEG],
		[Keyword.INT,    Operator.INT],
		[Keyword.NAT,    Operator.NAT],
		[Keyword.FLOAT,  Operator.FLOAT],
	]);

	private static readonly OPERATORS_BINARY: ReadonlyMap<Punctuator | Keyword, Operator> = new Map<Punctuator | Keyword, Operator>([
		[Keyword   .AS,     Operator.CAST],
		[Keyword   .AS_MAY, Operator.CAST_MAY],
		[Keyword   .AS_RES, Operator.CAST_RES],
		[Punctuator.EXP,    Operator.EXP],
		[Punctuator.MUL,    Operator.MUL],
		[Punctuator.DIV,    Operator.DIV],
		[Punctuator.ADD,    Operator.ADD],
		[Punctuator.SUB,    Operator.SUB],
		[Punctuator.LT,     Operator.LT],
		[Punctuator.GT,     Operator.GT],
		[Punctuator.LE,     Operator.LE],
		[Punctuator.GE,     Operator.GE],
		[Punctuator.NLT,    Operator.NLT],
		[Punctuator.NGT,    Operator.NGT],
		[Keyword   .IS,     Operator.IS],
		[Keyword   .ISNT,   Operator.ISNT],
		[Punctuator.ID,     Operator.ID],
		[Punctuator.NID,    Operator.NID],
		[Punctuator.EQ,     Operator.EQ],
		[Punctuator.NEQ,    Operator.NEQ],
		[Punctuator.AND,    Operator.AND],
		[Punctuator.NAND,   Operator.NAND],
		[Punctuator.OR,     Operator.OR],
		[Punctuator.NOR,    Operator.NOR],
	]);


	public constructor(private readonly config: CPConfig = CONFIG_DEFAULT) {
	}

	/* eslint-disable @typescript-eslint/unified-signatures */
	public decorateTS(syntaxnode: SyntaxNodeType<'identifier'>):                                    AST.ASTNodeTypeAlias | AST.ASTNodeVariable;
	public decorateTS(syntaxnode: SyntaxNodeType<'keyword_type'>):                                  AST.ASTNodeTypeConstant;
	public decorateTS(syntaxnode: SyntaxNodeType<'word'>):                                          AST.ASTNodeKey;
	public decorateTS(syntaxnode: SyntaxNodeType<'primitive_literal'>):                             AST.ASTNodeTypeConstant | AST.ASTNodeConstant;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'entry_type',        ['optional']>):             AST.ASTNodeItemType;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'entry_type__named', ['optional']>):             AST.ASTNodePropertyType;
	public decorateTS(syntaxnode: SyntaxNodeType<'property_accessor_type'>):                        AST.ASTNodeIndex | AST.ASTNodeKey;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_grouped'>):                                  AST.ASTNodeType;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_tuple_literal'>):                            AST.ASTNodeTypeTuple;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_record_literal'>):                           AST.ASTNodeTypeRecord;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_list_literal'>):                             AST.ASTNodeTypeList;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_dict_literal'>):                             AST.ASTNodeTypeDict;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_set_literal'>):                              AST.ASTNodeTypeSet;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_map_literal'>):                              AST.ASTNodeTypeMap;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_compound'>):                                 AST.ASTNodeTypeAccess | AST.ASTNodeTypeCall;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_unary_symbol'>):                             AST.ASTNodeTypeOperationUnary | AST.ASTNodeTypeList | AST.ASTNodeTypeSet;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_unary_keyword'>):                            AST.ASTNodeTypeOperationUnary;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_intersection'>):                             AST.ASTNodeTypeOperationBinary;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_union'>):                                    AST.ASTNodeTypeOperationBinary;
	public decorateTS(syntaxnode: SyntaxNodeSupertype<'type'>):                                     AST.ASTNodeType;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'string_template',    ['break']>):               AST.ASTNodeTemplate;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'property',           ['break']>):               AST.ASTNodeProperty;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'case',               ['break']>):               AST.ASTNodeCase;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'property_accessor',  ['break']>):               AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'expression_grouped', ['break']>):               AST.ASTNodeExpression;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'tuple_literal',      ['break']>):               AST.ASTNodeTuple;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'record_literal',     ['break']>):               AST.ASTNodeRecord;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'list_literal',       ['break']>):               AST.ASTNodeList;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'dict_literal',       ['break']>):               AST.ASTNodeDict;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'set_literal',        ['break']>):               AST.ASTNodeSet;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'map_literal',        ['break']>):               AST.ASTNodeMap;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_block'>):                              AST.ASTNodeExpressionBlock;
	public decorateTS(syntaxnode: SyntaxNodeType<'property_assign'>):                               AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_compound'>):                           AST.ASTNodeAccess | AST.ASTNodeCall;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_unary_symbol'>):                       AST.ASTNodeExpression | AST.ASTNodeOperationUnary;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_cast'>):                               AST.ASTNodeOperationBinaryCast | AST.ASTNodeClaim;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_exponential'>):                        AST.ASTNodeOperationBinaryArithmetic;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_multiplicative'>):                     AST.ASTNodeOperationBinaryArithmetic;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_additive'>):                           AST.ASTNodeOperationBinaryArithmetic;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_comparative'>):                        AST.ASTNodeOperationUnary | AST.ASTNodeOperationBinaryComparative;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_equality'>):                           AST.ASTNodeOperationUnary | AST.ASTNodeOperationBinaryEquality;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_conjunctive'>):                        AST.ASTNodeOperationUnary | AST.ASTNodeOperationBinaryLogical;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_disjunctive'>):                        AST.ASTNodeOperationUnary | AST.ASTNodeOperationBinaryLogical;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'expression_conditional', ['break']>):           AST.ASTNodeOperationTernary;
	public decorateTS(syntaxnode: SyntaxNodeSupertype<'expression'>):                               AST.ASTNodeExpression;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'assignee',               ['break']>):           AST.ASTNodeVariable | AST.ASTNodeAccess;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'statement_expression',   ['break']>):           AST.ASTNodeStatementExpression;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'statement_claim',        ['break']>):           AST.ASTNodeStatementClaim;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'statement_reassignment', ['break']>):           AST.ASTNodeStatementReassignment;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'statement_conditional',  ['unless', 'break']>): AST.ASTNodeStatementConditional;
	public decorateTS(syntaxnode: SyntaxNodeType<'statement_loop'>):                                AST.ASTNodeStatementLoop;
	public decorateTS(syntaxnode: SyntaxNodeType<'statement_iteration'>):                           AST.ASTNodeStatementIteration;
	public decorateTS(syntaxnode: SyntaxNodeType<'statement_break'>):                               AST.ASTNodeStatementBreak;
	public decorateTS(syntaxnode: SyntaxNodeSupertype<'statement'>):                                AST.ASTNodeStatement;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'block', ['break']>):                            AST.ASTNodeBlock;
	public decorateTS(syntaxnode: SyntaxNodeType<'declaration_type'>):                              AST.ASTNodeDeclarationType;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'declaration_variable', ['break']>):             AST.ASTNodeDeclarationVariable;
	public decorateTS(syntaxnode: SyntaxNodeSupertype<'declaration'>):                              AST.ASTNodeDeclaration;
	public decorateTS(syntaxnode: SyntaxNodeType<'source_file'>):                                   AST.ASTNodeGoal;
	public decorateTS(syntaxnode: SyntaxNode):                                                      AST.ASTNodeCP;
	/* eslint-enable @typescript-eslint/unified-signatures */
	public decorateTS(syntaxnode: SyntaxNode): AST.ASTNodeCP {
		const decorators = new Map<string | RegExp, (node: SyntaxNode) => AST.ASTNodeCP>([
			['source_file', (node) => new AST.ASTNodeGoal(
				node as SyntaxNodeType<'source_file'>,
				node.children.length ? this.decorateTS(node.children[0] as SyntaxNodeType<'block'>) : null,
				this.config,
			)],

			/* # TERMINALS */
			['identifier', (node) => (
				(isSyntaxNodeSupertype(node.parent, 'type')       || isSyntaxNodeType(node.parent, /^(entry_type(__named)?(__optional)?|generic_arguments|declaration_(type|claim(__break)?))$/))                                                                                 ? new AST.ASTNodeTypeAlias(node as SyntaxNodeType<'identifier'>) :
				(isSyntaxNodeSupertype(node.parent, 'expression') || isSyntaxNodeType(node.parent, /^(property(__break)?|case(__break)?|function_arguments|property_accessor(__break)?|assignee(__break)?|statement_expression|declaration_(variable|reassignment(__break)?))$/)) ? new AST.ASTNodeVariable (node as SyntaxNodeType<'identifier'>) :
				assert.fail(`Expected ${ node.parent } to be a node that contains an identifier.`)
			)],

			/* # PRODUCTIONS */
			['keyword_type', (node) => new AST.ASTNodeTypeConstant(node as SyntaxNodeType<'keyword_type'>)],

			['word', (node) => new AST.ASTNodeKey(node as SyntaxNodeType<'word'>)],

			['primitive_literal', (node) => (
				(isSyntaxNodeSupertype(node.parent, 'type')       || isSyntaxNodeType(node.parent, /^(entry_type(__named)?(__optional)?|generic_arguments|declaration_(type|claim(__break)?))$/))                                                                                 ? new AST.ASTNodeTypeConstant(node as SyntaxNodeType<'primitive_literal'>) :
				(isSyntaxNodeSupertype(node.parent, 'expression') || isSyntaxNodeType(node.parent, /^(property(__break)?|case(__break)?|function_arguments|property_accessor(__break)?|assignee(__break)?|statement_expression|declaration_(variable|reassignment(__break)?))$/)) ? new AST.ASTNodeConstant    (node as SyntaxNodeType<'primitive_literal'>) :
				assert.fail(`Expected ${ node.parent } to be a node that contains a primitive literal.`)
			)],

			/* ## Types */
			['entry_type', (node) => new AST.ASTNodeItemType(
				node as SyntaxNodeType<'entry_type'>,
				false,
				this.decorateTypeNode(node.childForFieldName('type_0') as SyntaxNodeSupertype<'type'>),
			)],

			['entry_type__optional', (node) => new AST.ASTNodeItemType(
				node as SyntaxNodeType<'entry_type__optional'>,
				true,
				this.decorateTypeNode(node.childForFieldName('type_0') as SyntaxNodeSupertype<'type'>),
			)],

			['entry_type__named', (node) => new AST.ASTNodePropertyType(
				node as SyntaxNodeType<'entry_type__named'>,
				false,
				this.decorateTS(node.childForFieldName('word_0') as SyntaxNodeType<'word'>),
				this.decorateTypeNode(node.childForFieldName('type_0') as SyntaxNodeSupertype<'type'>),
			)],

			['entry_type__named__optional', (node) => new AST.ASTNodePropertyType(
				node as SyntaxNodeType<'entry_type__named__optional'>,
				true,
				this.decorateTS(node.childForFieldName('word_0') as SyntaxNodeType<'word'>),
				this.decorateTypeNode(node.childForFieldName('type_0') as SyntaxNodeSupertype<'type'>),
			)],

			['property_accessor_type', (node) => (
				isSyntaxNodeType(node.children[0], /integer|natural/) ? new AST.ASTNodeIndex(node.children[0] as SyntaxNodeType<'integer' | 'natural'>) :
				(assert.ok(
					isSyntaxNodeType(node.children[0], 'word'),
					`Expected ${ node.children[0] } to be a \`SyntaxNodeType<'word'>\`.`,
				), this.decorateTS(node.children[0]))
			)],

			['type_grouped', (node) => this.decorateTypeNode(node.children[1] as SyntaxNodeSupertype<'type'>)],

			['type_tuple_literal', (node) => new AST.ASTNodeTypeTuple(
				node as SyntaxNodeType<'type_tuple_literal'>,
				node.children
					.filter((c): c is SyntaxNodeFamily<'entry_type', ['optional']> => isSyntaxNodeFamily(c, 'entry_type', ['optional']))
					.map((c) => this.decorateTS(c)),
			)],

			['type_record_literal', (node) => new AST.ASTNodeTypeRecord(
				node as SyntaxNodeType<'type_record_literal'>,
				node.children
					.filter((c): c is SyntaxNodeFamily<'entry_type__named', ['optional']> => isSyntaxNodeFamily(c, 'entry_type__named', ['optional']))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodePropertyType>,
			)],

			['type_list_literal', (node) => new AST.ASTNodeTypeList(
				node as SyntaxNodeType<'type_list_literal'>,
				this.decorateTypeNode(node.children[1] as SyntaxNodeSupertype<'type'>),
			)],

			['type_dict_literal', (node) => new AST.ASTNodeTypeDict(
				node as SyntaxNodeType<'type_dict_literal'>,
				this.decorateTypeNode(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			['type_set_literal', (node) => new AST.ASTNodeTypeSet(
				node as SyntaxNodeType<'type_set_literal'>,
				this.decorateTypeNode(node.children[1] as SyntaxNodeSupertype<'type'>),
			)],

			['type_map_literal', (node) => new AST.ASTNodeTypeMap(
				node as SyntaxNodeType<'type_map_literal'>,
				this.decorateTypeNode(node.children[1] as SyntaxNodeSupertype<'type'>),
				this.decorateTypeNode(node.children[3] as SyntaxNodeSupertype<'type'>),
			)],

			['type_compound', (node) => {
				const type_0                   = node.childForFieldName('type_0')                   as SyntaxNodeSupertype<'type'>;
				const property_accessor_type_0 = node.childForFieldName('property_accessor_type_0') as SyntaxNodeType<'property_accessor_type'> | null;
				return property_accessor_type_0 ? new AST.ASTNodeTypeAccess(
					node as SyntaxNodeType<'type_compound'>,
					Decorator.ACCESSORS.get(node.children[1].text as Punctuator) as ValidTypeAccessOperator,
					this.decorateTypeNode(type_0),
					this.decorateTS(property_accessor_type_0),
				) : new AST.ASTNodeTypeCall(
					node as SyntaxNodeType<'type_compound'>,
					this.decorateTypeNode(type_0),
					node.childForFieldName('generic_arguments_0')!.namedChildren.map((c) => this.decorateTypeNode(c as SyntaxNodeSupertype<'type'>)) as NonemptyArray<AST.ASTNodeType>,
				);
			}],

			['type_unary_symbol', (node) => new AST.ASTNodeTypeOperationUnary(
				node as SyntaxNodeType<'type_unary_symbol'>,
				Decorator.TYPEOPERATORS_UNARY.get(node.children[1].text as Punctuator)!,
				this.decorateTypeNode(node.children[0] as SyntaxNodeSupertype<'type'>),
			)],

			['type_unary_keyword', (node) => new AST.ASTNodeTypeOperationUnary(
				node as SyntaxNodeType<'type_unary_keyword'>,
				Decorator.TYPEOPERATORS_UNARY.get(node.children[0].text as Keyword)!,
				this.decorateTypeNode(node.children[1] as SyntaxNodeSupertype<'type'>),
			)],

			['type_intersection', (node) => new AST.ASTNodeTypeOperationBinary(
				node as SyntaxNodeType<'type_intersection'>,
				Decorator.TYPEOPERATORS_BINARY.get(node.children[1].text as Punctuator)!,
				this.decorateTypeNode(node.children[0] as SyntaxNodeSupertype<'type'>),
				this.decorateTypeNode(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			['type_union', (node) => new AST.ASTNodeTypeOperationBinary(
				node as SyntaxNodeType<'type_union'>,
				Decorator.TYPEOPERATORS_BINARY.get(node.children[1].text as Punctuator)!,
				this.decorateTypeNode(node.children[0] as SyntaxNodeSupertype<'type'>),
				this.decorateTypeNode(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			/* ## Expressions */
			[/^string_template(__break)?$/, (node) => new AST.ASTNodeTemplate(
				node as SyntaxNodeFamily<'string_template', ['break']>,
				node.children.map((c) => ((isSyntaxNodeType(c, /^template_(full|head|middle|tail)$/))
					? new AST.ASTNodeConstant(c as SyntaxNodeType<`template_${ 'full' | 'head' | 'middle' | 'tail' }`>)
					: this.decorateExprNode(c as SyntaxNodeSupertype<'expression'>)
				)),
			)],

			[/^property(__break)?$/, (node) => new AST.ASTNodeProperty(
				node as SyntaxNodeFamily<'property', ['break']>,
				this.decorateTS(node.children[0] as SyntaxNodeType<'word'>),
				this.decorateExprNode(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			[/^case(__break)?$/, (node) => new AST.ASTNodeCase(
				node as SyntaxNodeFamily<'case', ['break']>,
				this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			[/^property_accessor(__break)?$/, (node) => (
				isSyntaxNodeType(node.children[0], /integer|natural/) ? new AST.ASTNodeIndex(node.children[0] as SyntaxNodeType<'integer' | 'natural'>) :
				(isSyntaxNodeType(node.children[0], 'word'))    ? this.decorateTS(node.children[0]) :
				(assert.ok(isSyntaxNodeSupertype(node.children[1], 'expression'), `Expected ${ node.children[1] } to be an expression node.`), this.decorateExprNode(node.children[1]))
			)],

			[/^expression_grouped(__break)?$/, (node) => this.decorateExprNode(node.children[1] as SyntaxNodeSupertype<'expression'>)],

			[/^tuple_literal(__break)?$/, (node) => new AST.ASTNodeTuple(
				node as SyntaxNodeFamily<'tuple_literal', ['break']>,
				node.children
					.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
					.map((c) => this.decorateExprNode(c)),
			)],

			[/^record_literal(__break)?$/, (node) => new AST.ASTNodeRecord(
				node as SyntaxNodeFamily<'record_literal', ['break']>,
				node.children
					.filter((c): c is SyntaxNodeType<'property'> => isSyntaxNodeType(c, 'property'))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeProperty>,
			)],

			[/^list_literal(__break)?$/, (node) => new AST.ASTNodeList(
				node as SyntaxNodeFamily<'list_literal', ['break']>,
				node.children
					.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
					.map((c) => this.decorateExprNode(c)),
			)],

			[/^dict_literal(__break)?$/, (node) => new AST.ASTNodeDict(
				node as SyntaxNodeFamily<'dict_literal', ['break']>,
				node.children
					.filter((c): c is SyntaxNodeType<'property'> => isSyntaxNodeType(c, 'property'))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeProperty>,
			)],

			[/^set_literal(__break)?$/, (node) => new AST.ASTNodeSet(
				node as SyntaxNodeFamily<'set_literal', ['break']>,
				node.children
					.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
					.map((c) => this.decorateExprNode(c)),
			)],

			[/^map_literal(__break)?$/, (node) => new AST.ASTNodeMap(
				node as SyntaxNodeFamily<'map_literal', ['break']>,
				node.children
					.filter((c): c is SyntaxNodeType<'case'> => isSyntaxNodeType(c, 'case'))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeCase>,
			)],

			['expression_block', (node) => new AST.ASTNodeExpressionBlock(
				node as SyntaxNodeType<'expression_block'>,
				this.decorateBlockNode(node as SyntaxNodeFamily<'block', ['break']>),
			)],

			['expression_compound', (node) => {
				const expression_0        = node.childForFieldName('expression_0')        as SyntaxNodeSupertype<'expression'>;
				const property_accessor_0 = node.childForFieldName('property_accessor_0') as SyntaxNodeFamily<'property_accessor', ['break']> | null;
				return property_accessor_0 ? new AST.ASTNodeAccess(
					node as SyntaxNodeType<'expression_compound'>,
					Decorator.ACCESSORS.get(node.children[1].text as Punctuator)!,
					this.decorateExprNode(expression_0),
					this.decorateTS(property_accessor_0),
				) : new AST.ASTNodeCall(
					node as SyntaxNodeType<'expression_compound'>,
					this.decorateExprNode(expression_0),
					node.childForFieldName('generic_arguments_0') ?.namedChildren.map((c) => this.decorateTypeNode(c as SyntaxNodeSupertype<'type'>)) ?? [],
					node.childForFieldName('function_arguments_0')!.namedChildren.map((c) => this.decorateExprNode(c as SyntaxNodeSupertype<'expression'>)),
				);
			}],

			['expression_unary_symbol', (node) => (node.children[0].text === Punctuator.AFF // `+a` is a no-op
				? this.decorateExprNode(node.children[1] as SyntaxNodeSupertype<'expression'>)
				: new AST.ASTNodeOperationUnary(
					node as SyntaxNodeType<'expression_unary_symbol'>,
					Decorator.OPERATORS_UNARY.get(node.children[0].text as Punctuator) as ValidOperatorUnary,
					this.decorateExprNode(node.children[1] as SyntaxNodeSupertype<'expression'>),
				)
			)],

			['expression_unary_keyword', (node) => new AST.ASTNodeOperationUnary(
				node as SyntaxNodeType<'expression_unary_symbol'>,
				Decorator.OPERATORS_UNARY.get(node.children[0].text as Keyword) as ValidOperatorUnary,
				this.decorateExprNode(node.children[1] as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_cast', (node) => {
				const expression_0 = node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>;
				const expression_1 = node.childForFieldName('expression_1') as SyntaxNodeSupertype<'expression'> | null;
				return expression_1
					? new AST.ASTNodeOperationBinaryCast(
						node as SyntaxNodeType<'expression_cast'>,
						Decorator.OPERATORS_BINARY.get(node.children[1].text as Keyword)! as ValidOperatorCast,
						this.decorateExprNode(expression_0),
						this.decorateExprNode(expression_1),
					)
					: new AST.ASTNodeClaim(
						node as SyntaxNodeType<'expression_cast'>,
						this.decorateExprNode(expression_0),
						this.decorateTypeNode(node.childForFieldName('type_0') as SyntaxNodeSupertype<'type'>),
					);
			}],

			['expression_exponential', (node) => new AST.ASTNodeOperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_exponential'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_multiplicative', (node) => new AST.ASTNodeOperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_multiplicative'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_additive', (node) => new AST.ASTNodeOperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_additive'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_comparative', (node) => ((
				n:        SyntaxNodeType<'expression_comparative'>,
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
				// `a !is b` is syntax sugar for `!(a is b)`
				(operator === Operator.ISNT) ? new AST.ASTNodeOperationUnary(
					n,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryComparative(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.IS as ValidOperatorComparative, // TODO: make a new class for comparing object instances
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryComparative(
					n,
					operator as ValidOperatorComparative,
					...operands,
				)
			))(
				node as SyntaxNodeType<'expression_comparative'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateExprNode(node.children[2] as SyntaxNodeSupertype<'expression'>),
				],
			)],

			['expression_equality', (node) => ((
				n:        SyntaxNodeType<'expression_equality'>,
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
				node as SyntaxNodeType<'expression_equality'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateExprNode(node.children[2] as SyntaxNodeSupertype<'expression'>),
				],
			)],

			['expression_conjunctive', (node) => ((
				n:        SyntaxNodeType<'expression_conjunctive'>,
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
				node as SyntaxNodeType<'expression_conjunctive'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateExprNode(node.children[2] as SyntaxNodeSupertype<'expression'>),
				],
			)],

			['expression_disjunctive', (node) => ((
				n:        SyntaxNodeType<'expression_disjunctive'>,
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
				node as SyntaxNodeType<'expression_disjunctive'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateExprNode(node.children[2] as SyntaxNodeSupertype<'expression'>),
				],
			)],

			[/^expression_conditional(__break)?$/, (node) => new AST.ASTNodeOperationTernary(
				node as SyntaxNodeFamily<'expression_conditional', ['break']>,
				Operator.COND,
				this.decorateExprNode(node.children[1] as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.children[3] as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.children[5] as SyntaxNodeSupertype<'expression'>),
			)],

			/* ## Statements */
			[/^assignee(__break)?$/, (node) => {
				const identifier_0 = node.childForFieldName('identifier_0') as SyntaxNodeType<'identifier'> | null;
				return identifier_0
					? new AST.ASTNodeVariable(identifier_0)
					: new AST.ASTNodeAccess(
						node as SyntaxNodeFamily<'assignee', ['break']>,
						Operator.DOT,
						this.decorateExprNode(node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>),
						this.decorateTS(node.childForFieldName('property_accessor_0') as SyntaxNodeFamily<'property_accessor', ['break']>),
					);
			}],

			[/^statement_expression(__break)?$/, (node) => new AST.ASTNodeStatementExpression(
				node as SyntaxNodeFamily<'statement_expression', ['break']>,
				(node.children.length === 2) ? this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>) : void 0,
			)],

			[/^statement_claim(__break)?$/, (node) => new AST.ASTNodeStatementClaim(
				node as SyntaxNodeFamily<'statement_claim', ['break']>,
				this.decorateTS(node.children[1] as SyntaxNodeFamily<'assignee', ['break']>),
				this.decorateTypeNode(node.children[3] as SyntaxNodeSupertype<'type'>),
			)],

			[/^statement_reassignment(__break)?$/, (node) => new AST.ASTNodeStatementReassignment(
				node as SyntaxNodeFamily<'statement_reassignment', ['break']>,
				this.decorateTS(node.children[1] as SyntaxNodeFamily<'assignee', ['break']>),
				this.decorateExprNode(node.children[3] as SyntaxNodeSupertype<'expression'>),
			)],

			[/^statement_conditional(__break)?$/, (node) => {
				const block_1                 = node.childForFieldName('block_1')                 as SyntaxNodeFamily<'block', ['break']>                 | null;
				const statement_conditional_0 = node.childForFieldName('statement_conditional_0') as SyntaxNodeFamily<'statement_conditional', ['break']> | null;
				return new AST.ASTNodeStatementConditional(
					node as SyntaxNodeFamily<'statement_conditional', ['break']>,
					false,
					this.decorateExprNode(node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.childForFieldName('block_0') as SyntaxNodeFamily<'block', ['break']>),
					block_1 ? this.decorateTS(block_1) : statement_conditional_0 ? this.decorateTS(statement_conditional_0) : undefined,
				);
			}],

			[/^statement_conditional__unless(__break)?$/, (node) => new AST.ASTNodeStatementConditional(
				node as SyntaxNodeFamily<'statement_conditional__unless', ['break']>,
				true,
				this.decorateExprNode(node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.childForFieldName('block_0') as SyntaxNodeFamily<'block', ['break']>),
			)],

			['statement_loop', (node) => {
				const expression_0 = node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>;
				const block_0      = node.childForFieldName('block_0')      as SyntaxNodeType<'block__break'>;
				return node.children[0].text === Keyword.DO ? new AST.ASTNodeStatementLoop(
					// we have `"do" Block ("while" | "until") Expression ";"` (bottom-tested)
					node as SyntaxNodeType<'statement_loop'>,
					true,
					node.children[2].text === Keyword.UNTIL,
					this.decorateExprNode(expression_0),
					this.decorateTS(block_0),
				) : new AST.ASTNodeStatementLoop(
					// we have `("while" | "until") Expression "do" Block ";"` (top-tested)
					node as SyntaxNodeType<'statement_loop'>,
					false,
					node.children[0].text === Keyword.UNTIL,
					this.decorateExprNode(expression_0),
					this.decorateTS(block_0),
				);
			}],

			['statement_iteration', (node) => new AST.ASTNodeStatementIteration(
				node as SyntaxNodeType<'statement_iteration'>,
				isSyntaxNodeType(node.children[1], 'identifier') ? new AST.ASTNodeVariable(node.children[1]) : null,
				this.decorateTypeNode(node.children[3] as SyntaxNodeSupertype<'type'>),
				this.decorateExprNode(node.children[5] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[7] as SyntaxNodeType<'block__break'>),
			)],

			['statement_break', (node) => new AST.ASTNodeStatementBreak(
				node as SyntaxNodeType<'statement_break'>,
				node.children[0].text === Keyword.SKIP,
			)],

			[/^block(__break)?$/, (node) => this.decorateBlockNode(node as SyntaxNodeFamily<'block', ['break']>)],

			['declaration_type', (node) => new AST.ASTNodeDeclarationType(
				node as SyntaxNodeType<'declaration_type'>,
				(isSyntaxNodeType(node.children[1], 'identifier')) ? new AST.ASTNodeTypeAlias(node.children[1]) : null,
				this.decorateTypeNode(node.children[3] as SyntaxNodeSupertype<'type'>),
			)],

			[/^declaration_variable(__break)?$/, (node) => (
				// "val" "mut" IDENTIFIER "?" ":" Type ";"
				node.children[3].text === '?' ? new AST.ASTNodeDeclarationVariable(
					node as SyntaxNodeFamily<'declaration_variable', ['break']>,
					true,
					new AST.ASTNodeVariable(node.children[2] as SyntaxNodeType<'identifier'>),
					this.decorateTypeNode(node.children[5] as SyntaxNodeSupertype<'type'>),
					null,
				) :
				// "val" ("_" | IDENTIFIER) (":" Type)? "=" Expression<+Block><?Break> ";"
				[5, 7].includes(node.children.length) ? new AST.ASTNodeDeclarationVariable(
					node as SyntaxNodeFamily<'declaration_variable', ['break']>,
					false,
					isSyntaxNodeType(node.children[1], 'identifier') ? new AST.ASTNodeVariable(node.children[1]) : null,
					node.children.length === 7 ? this.decorateTypeNode(node.children[3] as SyntaxNodeSupertype<'type'>) : null,
					this.decorateExprNode(node.children[node.children.length - 2] as SyntaxNodeSupertype<'expression'>),
				) :
				// "val" "mut" IDENTIFIER (":" Type)? "=" Expression<+Block><?Break> ";"
				(assert.ok([6, 8].includes(node.children.length)), new AST.ASTNodeDeclarationVariable(
					node as SyntaxNodeFamily<'declaration_variable', ['break']>,
					true,
					new AST.ASTNodeVariable(node.children[2] as SyntaxNodeType<'identifier'>),
					node.children.length === 8 ? this.decorateTypeNode(node.children[4] as SyntaxNodeSupertype<'type'>) : null,
					this.decorateExprNode(node.children[node.children.length - 2] as SyntaxNodeSupertype<'expression'>),
				))
			)],
		]);
		return (
			decorators.get(syntaxnode.type) ??
			[...decorators].find(([key]) => key instanceof RegExp && isSyntaxNodeType(syntaxnode, key))?.[1] ??
			((node) => {
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

	private decorateExprNode(exprnode: SyntaxNodeSupertype<'expression'>): AST.ASTNodeExpression {
		return (
			(isSyntaxNodeType(exprnode, 'identifier'))        ? new AST.ASTNodeVariable(exprnode) :
			(isSyntaxNodeType(exprnode, 'primitive_literal')) ? new AST.ASTNodeConstant(exprnode) :
			this.decorateTS(exprnode)
		);
	}

	private decorateBlockNode(blocknode: SyntaxNodeFamily<'block', ['break']>): AST.ASTNodeBlock {
		return new AST.ASTNodeBlock(
			blocknode,
			blocknode.children
				.filter((c): c is SyntaxNodeSupertype<'statement'> => isSyntaxNodeSupertype(c, 'statement'))
				.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeStatement>,
			this.config,
		);
	}
}

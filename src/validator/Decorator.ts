import * as assert from 'node:assert';
import type {SyntaxNode} from 'tree-sitter';
import type {NonemptyArray} from '../lib/index.ts';
import {
	type CplConfig,
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


	public constructor(private readonly config: CplConfig = CONFIG_DEFAULT) {
	}

	/* eslint-disable @typescript-eslint/unified-signatures */
	public decorateTS(syntaxnode: SyntaxNodeType<'identifier'>):                                    AST.TypeAlias | AST.Variable;
	public decorateTS(syntaxnode: SyntaxNodeType<'keyword_type'>):                                  AST.TypeConstant;
	public decorateTS(syntaxnode: SyntaxNodeType<'word'>):                                          AST.Key;
	public decorateTS(syntaxnode: SyntaxNodeType<'primitive_literal'>):                             AST.TypeConstant | AST.Constant;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'entry_type',        ['optional']>):             AST.ItemType;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'entry_type__named', ['optional']>):             AST.PropertyType;
	public decorateTS(syntaxnode: SyntaxNodeType<'property_accessor_type'>):                        AST.Index | AST.Key;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_grouped'>):                                  AST.Type;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_tuple_literal'>):                            AST.TypeTuple;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_record_literal'>):                           AST.TypeRecord;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_list_literal'>):                             AST.TypeList;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_dict_literal'>):                             AST.TypeDict;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_set_literal'>):                              AST.TypeSet;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_map_literal'>):                              AST.TypeMap;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_compound'>):                                 AST.TypeAccess | AST.TypeCall;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_unary_symbol'>):                             AST.TypeOperationUnary | AST.TypeList | AST.TypeSet;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_unary_keyword'>):                            AST.TypeOperationUnary;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_intersection'>):                             AST.TypeOperationBinary;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_union'>):                                    AST.TypeOperationBinary;
	public decorateTS(syntaxnode: SyntaxNodeSupertype<'type'>):                                     AST.Type;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'string_template',    ['break']>):               AST.Template;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'property',           ['break']>):               AST.Property;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'case',               ['break']>):               AST.Case;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'property_accessor',  ['break']>):               AST.Index | AST.Key | AST.Expression;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'expression_grouped', ['break']>):               AST.Expression;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'tuple_literal',      ['break']>):               AST.Tuple;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'record_literal',     ['break']>):               AST.Record;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'list_literal',       ['break']>):               AST.List;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'dict_literal',       ['break']>):               AST.Dict;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'set_literal',        ['break']>):               AST.Set;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'map_literal',        ['break']>):               AST.Map;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_block'>):                              AST.ExpressionBlock;
	public decorateTS(syntaxnode: SyntaxNodeType<'property_assign'>):                               AST.Index | AST.Key | AST.Expression;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_compound'>):                           AST.Access | AST.Call;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_unary_symbol'>):                       AST.Expression | AST.OperationUnary;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_cast'>):                               AST.OperationBinaryCast | AST.Claim;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_exponential'>):                        AST.OperationBinaryArithmetic;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_multiplicative'>):                     AST.OperationBinaryArithmetic;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_additive'>):                           AST.OperationBinaryArithmetic;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_comparative'>):                        AST.OperationUnary | AST.OperationBinaryComparative;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_equality'>):                           AST.OperationUnary | AST.OperationBinaryEquality;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_conjunctive'>):                        AST.OperationUnary | AST.OperationBinaryLogical;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_disjunctive'>):                        AST.OperationUnary | AST.OperationBinaryLogical;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'expression_conditional', ['break']>):           AST.OperationTernary;
	public decorateTS(syntaxnode: SyntaxNodeSupertype<'expression'>):                               AST.Expression;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'assignee',               ['break']>):           AST.Variable | AST.Access;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'statement_expression',   ['break']>):           AST.StatementExpression;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'statement_claim',        ['break']>):           AST.StatementClaim;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'statement_reassignment', ['break']>):           AST.StatementReassignment;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'statement_conditional',  ['unless', 'break']>): AST.StatementConditional;
	public decorateTS(syntaxnode: SyntaxNodeType<'statement_loop'>):                                AST.StatementLoop;
	public decorateTS(syntaxnode: SyntaxNodeType<'statement_iteration'>):                           AST.StatementIteration;
	public decorateTS(syntaxnode: SyntaxNodeType<'statement_break'>):                               AST.StatementBreak;
	public decorateTS(syntaxnode: SyntaxNodeSupertype<'statement'>):                                AST.Statement;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'block', ['break']>):                            AST.Block;
	public decorateTS(syntaxnode: SyntaxNodeType<'declaration_type'>):                              AST.DeclarationType;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'declaration_variable', ['break']>):             AST.DeclarationVariable;
	public decorateTS(syntaxnode: SyntaxNodeSupertype<'declaration'>):                              AST.Declaration;
	public decorateTS(syntaxnode: SyntaxNodeType<'source_file'>):                                   AST.Goal;
	public decorateTS(syntaxnode: SyntaxNode):                                                      AST.ASTNodeCP;
	/* eslint-enable @typescript-eslint/unified-signatures */
	public decorateTS(syntaxnode: SyntaxNode): AST.ASTNodeCP {
		const decorators = new Map<string | RegExp, (node: SyntaxNode) => AST.ASTNodeCP>([
			['source_file', (node) => new AST.Goal(
				node as SyntaxNodeType<'source_file'>,
				node.children.length ? this.decorateTS(node.children[0] as SyntaxNodeType<'block'>) : null,
				this.config,
			)],

			/* # TERMINALS */
			['identifier', (node) => (
				(isSyntaxNodeSupertype(node.parent!, 'type')       || isSyntaxNodeType(node.parent!, /^(entry_type(__named)?(__optional)?|generic_arguments|declaration_(type|claim(__break)?))$/))                                                                                 ? new AST.TypeAlias(node as SyntaxNodeType<'identifier'>) :
				(isSyntaxNodeSupertype(node.parent!, 'expression') || isSyntaxNodeType(node.parent!, /^(property(__break)?|case(__break)?|function_arguments|property_accessor(__break)?|assignee(__break)?|statement_expression|declaration_(variable|reassignment(__break)?))$/)) ? new AST.Variable (node as SyntaxNodeType<'identifier'>) :
				assert.fail(`Expected ${ node.parent } to be a node that contains an identifier.`)
			)],

			/* # PRODUCTIONS */
			['keyword_type', (node) => new AST.TypeConstant(node as SyntaxNodeType<'keyword_type'>)],

			['word', (node) => new AST.Key(node as SyntaxNodeType<'word'>)],

			['primitive_literal', (node) => (
				(isSyntaxNodeSupertype(node.parent!, 'type')       || isSyntaxNodeType(node.parent!, /^(entry_type(__named)?(__optional)?|generic_arguments|declaration_(type|claim(__break)?))$/))                                                                                 ? new AST.TypeConstant(node as SyntaxNodeType<'primitive_literal'>) :
				(isSyntaxNodeSupertype(node.parent!, 'expression') || isSyntaxNodeType(node.parent!, /^(property(__break)?|case(__break)?|function_arguments|property_accessor(__break)?|assignee(__break)?|statement_expression|declaration_(variable|reassignment(__break)?))$/)) ? new AST.Constant    (node as SyntaxNodeType<'primitive_literal'>) :
				assert.fail(`Expected ${ node.parent } to be a node that contains a primitive literal.`)
			)],

			/* ## Types */
			['entry_type', (node) => new AST.ItemType(
				node as SyntaxNodeType<'entry_type'>,
				false,
				this.decorateTypeNode(node.children[0] as SyntaxNodeSupertype<'type'>),
			)],

			['entry_type__optional', (node) => new AST.ItemType(
				node as SyntaxNodeType<'entry_type__optional'>,
				true,
				this.decorateTypeNode(node.children[1] as SyntaxNodeSupertype<'type'>),
			)],

			['entry_type__named', (node) => new AST.PropertyType(
				node as SyntaxNodeType<'entry_type__named'>,
				false,
				this.decorateTS(node.children[0] as SyntaxNodeType<'word'>),
				this.decorateTypeNode(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			['entry_type__named__optional', (node) => new AST.PropertyType(
				node as SyntaxNodeType<'entry_type__named__optional'>,
				true,
				this.decorateTS(node.children[0] as SyntaxNodeType<'word'>),
				this.decorateTypeNode(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			['property_accessor_type', (node) => (
				isSyntaxNodeType(node.children[0], /integer|natural/) ? new AST.Index(node.children[0] as SyntaxNodeType<'integer' | 'natural'>) :
				(assert.ok(
					isSyntaxNodeType(node.children[0], 'word'),
					`Expected ${ node.children[0] } to be a \`SyntaxNodeType<'word'>\`.`,
				), this.decorateTS(node.children[0]))
			)],

			['type_grouped', (node) => this.decorateTypeNode(node.children[1] as SyntaxNodeSupertype<'type'>)],

			['type_tuple_literal', (node) => new AST.TypeTuple(
				node as SyntaxNodeType<'type_tuple_literal'>,
				node.children
					.filter((c): c is SyntaxNodeFamily<'entry_type', ['optional']> => isSyntaxNodeFamily(c, 'entry_type', ['optional']))
					.map((c) => this.decorateTS(c)),
			)],

			['type_record_literal', (node) => new AST.TypeRecord(
				node as SyntaxNodeType<'type_record_literal'>,
				node.children
					.filter((c): c is SyntaxNodeFamily<'entry_type__named', ['optional']> => isSyntaxNodeFamily(c, 'entry_type__named', ['optional']))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.PropertyType>,
			)],

			['type_list_literal', (node) => new AST.TypeList(
				node as SyntaxNodeType<'type_list_literal'>,
				this.decorateTypeNode(node.children[1] as SyntaxNodeSupertype<'type'>),
			)],

			['type_dict_literal', (node) => new AST.TypeDict(
				node as SyntaxNodeType<'type_dict_literal'>,
				this.decorateTypeNode(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			['type_set_literal', (node) => new AST.TypeSet(
				node as SyntaxNodeType<'type_set_literal'>,
				this.decorateTypeNode(node.children[1] as SyntaxNodeSupertype<'type'>),
			)],

			['type_map_literal', (node) => new AST.TypeMap(
				node as SyntaxNodeType<'type_map_literal'>,
				this.decorateTypeNode(node.children[1] as SyntaxNodeSupertype<'type'>),
				this.decorateTypeNode(node.children[3] as SyntaxNodeSupertype<'type'>),
			)],

			['type_compound', (node) => (
				(isSyntaxNodeType(node.children[2], 'property_accessor_type')) ? new AST.TypeAccess(
					node as SyntaxNodeType<'type_compound'>,
					Decorator.ACCESSORS.get(node.children[1].text as Punctuator) as ValidTypeAccessOperator,
					this.decorateTypeNode(node.children[0] as SyntaxNodeSupertype<'type'>),
					this.decorateTS(node.children[2]),
				) : (assert.ok(
					isSyntaxNodeType(node.children[2], 'generic_arguments'),
					`Expected ${ node.children[2] } to be a \`SyntaxNodeType<'generic_arguments'>\`.`,
				), new AST.TypeCall(
					node as SyntaxNodeType<'type_compound'>,
					this.decorateTypeNode(node.children[0] as SyntaxNodeSupertype<'type'>),
					node.children[2].children
						.filter((c): c is SyntaxNodeSupertype<'type'> => isSyntaxNodeSupertype(c, 'type'))
						.map((c) => this.decorateTypeNode(c)) as NonemptyArray<AST.Type>,
				))
			)],

			['type_unary_symbol', (node) => new AST.TypeOperationUnary(
				node as SyntaxNodeType<'type_unary_symbol'>,
				Decorator.TYPEOPERATORS_UNARY.get(node.children[1].text as Punctuator)!,
				this.decorateTypeNode(node.children[0] as SyntaxNodeSupertype<'type'>),
			)],

			['type_unary_keyword', (node) => new AST.TypeOperationUnary(
				node as SyntaxNodeType<'type_unary_keyword'>,
				Decorator.TYPEOPERATORS_UNARY.get(node.children[0].text as Keyword)!,
				this.decorateTypeNode(node.children[1] as SyntaxNodeSupertype<'type'>),
			)],

			['type_intersection', (node) => new AST.TypeOperationBinary(
				node as SyntaxNodeType<'type_intersection'>,
				Decorator.TYPEOPERATORS_BINARY.get(node.children[1].text as Punctuator)!,
				this.decorateTypeNode(node.children[0] as SyntaxNodeSupertype<'type'>),
				this.decorateTypeNode(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			['type_union', (node) => new AST.TypeOperationBinary(
				node as SyntaxNodeType<'type_union'>,
				Decorator.TYPEOPERATORS_BINARY.get(node.children[1].text as Punctuator)!,
				this.decorateTypeNode(node.children[0] as SyntaxNodeSupertype<'type'>),
				this.decorateTypeNode(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			/* ## Expressions */
			[/^string_template(__break)?$/, (node) => new AST.Template(
				node as SyntaxNodeFamily<'string_template', ['break']>,
				node.children.map((c) => ((isSyntaxNodeType(c, /^template_(full|head|middle|tail)$/))
					? new AST.Constant(c as SyntaxNodeType<`template_${ 'full' | 'head' | 'middle' | 'tail' }`>)
					: this.decorateExprNode(c as SyntaxNodeSupertype<'expression'>)
				)),
			)],

			[/^property(__break)?$/, (node) => new AST.Property(
				node as SyntaxNodeFamily<'property', ['break']>,
				this.decorateTS(node.children[0] as SyntaxNodeType<'word'>),
				this.decorateExprNode(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			[/^case(__break)?$/, (node) => new AST.Case(
				node as SyntaxNodeFamily<'case', ['break']>,
				this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			[/^property_accessor(__break)?$/, (node) => (
				isSyntaxNodeType(node.children[0], /integer|natural/) ? new AST.Index(node.children[0] as SyntaxNodeType<'integer' | 'natural'>) :
				(isSyntaxNodeType(node.children[0], 'word'))    ? this.decorateTS(node.children[0]) :
				(assert.ok(isSyntaxNodeSupertype(node.children[1], 'expression'), `Expected ${ node.children[1] } to be an expression node.`), this.decorateExprNode(node.children[1]))
			)],

			[/^expression_grouped(__break)?$/, (node) => this.decorateExprNode(node.children[1] as SyntaxNodeSupertype<'expression'>)],

			[/^tuple_literal(__break)?$/, (node) => new AST.Tuple(
				node as SyntaxNodeFamily<'tuple_literal', ['break']>,
				node.children
					.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
					.map((c) => this.decorateExprNode(c)),
			)],

			[/^record_literal(__break)?$/, (node) => new AST.Record(
				node as SyntaxNodeFamily<'record_literal', ['break']>,
				node.children
					.filter((c): c is SyntaxNodeType<'property'> => isSyntaxNodeType(c, 'property'))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.Property>,
			)],

			[/^list_literal(__break)?$/, (node) => new AST.List(
				node as SyntaxNodeFamily<'list_literal', ['break']>,
				node.children
					.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
					.map((c) => this.decorateExprNode(c)),
			)],

			[/^dict_literal(__break)?$/, (node) => new AST.Dict(
				node as SyntaxNodeFamily<'dict_literal', ['break']>,
				node.children
					.filter((c): c is SyntaxNodeType<'property'> => isSyntaxNodeType(c, 'property'))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.Property>,
			)],

			[/^set_literal(__break)?$/, (node) => new AST.Set(
				node as SyntaxNodeFamily<'set_literal', ['break']>,
				node.children
					.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
					.map((c) => this.decorateExprNode(c)),
			)],

			[/^map_literal(__break)?$/, (node) => new AST.Map(
				node as SyntaxNodeFamily<'map_literal', ['break']>,
				node.children
					.filter((c): c is SyntaxNodeType<'case'> => isSyntaxNodeType(c, 'case'))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.Case>,
			)],

			['expression_block', (node) => new AST.ExpressionBlock(
				node as SyntaxNodeType<'expression_block'>,
				this.decorateBlockNode(node as SyntaxNodeFamily<'block', ['break']>),
			)],

			['expression_compound', (node) => (
				(isSyntaxNodeFamily(node.children[2], 'property_accessor', ['break'])) ? new AST.Access(
					node as SyntaxNodeType<'expression_compound'>,
					Decorator.ACCESSORS.get(node.children[1].text as Punctuator)!,
					this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[2]),
				) : new AST.Call(
					node as SyntaxNodeType<'expression_compound'>,
					this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
					isSyntaxNodeType(node.children[2], 'generic_arguments') ? node.children[2].children
						.filter((c) => isSyntaxNodeSupertype(c, 'type'))
						.map((c) => this.decorateTypeNode(c)) : [],
					(isSyntaxNodeType(node.children[2], 'generic_arguments') ? node.children[3] : node.children[2]).children
						.filter((c) => isSyntaxNodeSupertype(c, 'expression'))
						.map((c) => this.decorateExprNode(c)),
				)
			)],

			['expression_unary_symbol', (node) => (node.children[0].text === Punctuator.AFF // `+a` is a no-op
				? this.decorateExprNode(node.children[1] as SyntaxNodeSupertype<'expression'>)
				: new AST.OperationUnary(
					node as SyntaxNodeType<'expression_unary_symbol'>,
					Decorator.OPERATORS_UNARY.get(node.children[0].text as Punctuator) as ValidOperatorUnary,
					this.decorateExprNode(node.children[1] as SyntaxNodeSupertype<'expression'>),
				)
			)],

			['expression_unary_keyword', (node) => new AST.OperationUnary(
				node as SyntaxNodeType<'expression_unary_symbol'>,
				Decorator.OPERATORS_UNARY.get(node.children[0].text as Keyword) as ValidOperatorUnary,
				this.decorateExprNode(node.children[1] as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_cast', (node) => (node.children.length === 3
				? new AST.OperationBinaryCast(
					node as SyntaxNodeType<'expression_cast'>,
					Decorator.OPERATORS_BINARY.get(node.children[1].text as Keyword)! as ValidOperatorCast,
					this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateExprNode(node.children[2] as SyntaxNodeSupertype<'expression'>),
				)
				: (assert.strictEqual(node.children.length, 5, `Expected \`${ node }\` to have 5 children.`), new AST.Claim(
					node as SyntaxNodeType<'expression_cast'>,
					this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTypeNode(node.children[3] as SyntaxNodeSupertype<'type'>),
				))
			)],

			['expression_exponential', (node) => new AST.OperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_exponential'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_multiplicative', (node) => new AST.OperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_multiplicative'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_additive', (node) => new AST.OperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_additive'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_comparative', (node) => ((
				n:        SyntaxNodeType<'expression_comparative'>,
				operator: Operator,
				operands: readonly [AST.Expression, AST.Expression],
			) => (
				// `a !< b` is syntax sugar for `!(a < b)`
				(operator === Operator.NLT) ? new AST.OperationUnary(
					n,
					Operator.NOT,
					new AST.OperationBinaryComparative(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.LT,
						...operands,
					),
				) :
				// `a !> b` is syntax sugar for `!(a > b)`
				(operator === Operator.NGT) ? new AST.OperationUnary(
					n,
					Operator.NOT,
					new AST.OperationBinaryComparative(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.GT,
						...operands,
					),
				) :
				// `a !is b` is syntax sugar for `!(a is b)`
				(operator === Operator.ISNT) ? new AST.OperationUnary(
					n,
					Operator.NOT,
					new AST.OperationBinaryComparative(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.IS,
						...operands,
					),
				) :
				new AST.OperationBinaryComparative(
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
				operands: readonly [AST.Expression, AST.Expression],
			) => (
				// `a !== b` is syntax sugar for `!(a === b)`
				(operator === Operator.NID) ? new AST.OperationUnary(
					n,
					Operator.NOT,
					new AST.OperationBinaryEquality(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.ID,
						...operands,
					),
				) :
				// `a != b` is syntax sugar for `!(a == b)`
				(operator === Operator.NEQ) ? new AST.OperationUnary(
					n,
					Operator.NOT,
					new AST.OperationBinaryEquality(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.EQ,
						...operands,
					),
				) :
				new AST.OperationBinaryEquality(
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
				operands: readonly [AST.Expression, AST.Expression],
			) => (
				// `a !& b` is syntax sugar for `!(a && b)`
				(operator === Operator.NAND) ? new AST.OperationUnary(
					n,
					Operator.NOT,
					new AST.OperationBinaryLogical(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.AND,
						...operands,
					),
				) :
				new AST.OperationBinaryLogical(
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
				operands: readonly [AST.Expression, AST.Expression],
			) => (
				// `a !| b` is syntax sugar for `!(a || b)`
				(operator === Operator.NOR) ? new AST.OperationUnary(
					n,
					Operator.NOT,
					new AST.OperationBinaryLogical(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.OR,
						...operands,
					),
				) :
				new AST.OperationBinaryLogical(
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

			[/^expression_conditional(__break)?$/, (node) => new AST.OperationTernary(
				node as SyntaxNodeFamily<'expression_conditional', ['break']>,
				Operator.COND,
				this.decorateExprNode(node.children[1] as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.children[3] as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.children[5] as SyntaxNodeSupertype<'expression'>),
			)],

			/* ## Statements */
			[/^assignee(__break)?$/, (node) => (node.children.length === 1
				? new AST.Variable(node.children[0] as SyntaxNodeType<'identifier'>)
				: new AST.Access(
					node as SyntaxNodeFamily<'assignee', ['break']>,
					Operator.DOT,
					this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[2] as SyntaxNodeFamily<'property_accessor', ['break']>),
				)
			)],

			[/^statement_expression(__break)?$/, (node) => new AST.StatementExpression(
				node as SyntaxNodeFamily<'statement_expression', ['break']>,
				(node.children.length === 2) ? this.decorateExprNode(node.children[0] as SyntaxNodeSupertype<'expression'>) : void 0,
			)],

			[/^statement_claim(__break)?$/, (node) => new AST.StatementClaim(
				node as SyntaxNodeFamily<'statement_claim', ['break']>,
				this.decorateTS(node.children[1] as SyntaxNodeFamily<'assignee', ['break']>),
				this.decorateTypeNode(node.children[3] as SyntaxNodeSupertype<'type'>),
			)],

			[/^statement_reassignment(__break)?$/, (node) => new AST.StatementReassignment(
				node as SyntaxNodeFamily<'statement_reassignment', ['break']>,
				this.decorateTS(node.children[1] as SyntaxNodeFamily<'assignee', ['break']>),
				this.decorateExprNode(node.children[3] as SyntaxNodeSupertype<'expression'>),
			)],

			[/^statement_conditional(__break)?$/, (node) => node.children.length === 5 ? new AST.StatementConditional(
				node as SyntaxNodeFamily<'statement_conditional', ['break']>,
				false,
				this.decorateExprNode(node.children[1] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[3] as SyntaxNodeFamily<'block', ['break']>),
			) : new AST.StatementConditional(
				node as SyntaxNodeFamily<'statement_conditional', ['break']>,
				false,
				this.decorateExprNode(node.children[1] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[3] as SyntaxNodeFamily<'block', ['break']>),
				(node.children.length === 7
					? this.decorateTS(node.children[5] as SyntaxNodeFamily<'block', ['break']>)
					: this.decorateTS(node.children[5] as SyntaxNodeFamily<'statement_conditional', ['break']>)
				),
			)],

			[/^statement_conditional__unless(__break)?$/, (node) => new AST.StatementConditional(
				node as SyntaxNodeFamily<'statement_conditional__unless', ['break']>,
				true,
				this.decorateExprNode(node.children[1] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[3] as SyntaxNodeFamily<'block', ['break']>),
			)],

			['statement_loop', (node) => node.children[0].text === Keyword.DO ? new AST.StatementLoop(
				// we have `"do" Block ("while" | "until") Expression ";"`
				node as SyntaxNodeType<'statement_loop'>,
				true,
				node.children[2].text === Keyword.UNTIL,
				this.decorateExprNode(node.children[3] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[1] as SyntaxNodeType<'block__break'>),
			) : new AST.StatementLoop(
				// we have `("while" | "until") Expression "do" Block ";"`
				node as SyntaxNodeType<'statement_loop'>,
				false,
				node.children[0].text === Keyword.UNTIL,
				this.decorateExprNode(node.children[1] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[3] as SyntaxNodeType<'block__break'>),
			)],

			['statement_iteration', (node) => new AST.StatementIteration(
				node as SyntaxNodeType<'statement_iteration'>,
				isSyntaxNodeType(node.children[1], 'identifier') ? new AST.Variable(node.children[1]) : null,
				this.decorateTypeNode(node.children[3] as SyntaxNodeSupertype<'type'>),
				this.decorateExprNode(node.children[5] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[7] as SyntaxNodeType<'block__break'>),
			)],

			['statement_break', (node) => new AST.StatementBreak(
				node as SyntaxNodeType<'statement_break'>,
				node.children[0].text === Keyword.SKIP,
			)],

			[/^block(__break)?$/, (node) => this.decorateBlockNode(node as SyntaxNodeFamily<'block', ['break']>)],

			['declaration_type', (node) => new AST.DeclarationType(
				node as SyntaxNodeType<'declaration_type'>,
				(isSyntaxNodeType(node.children[1], 'identifier')) ? new AST.TypeAlias(node.children[1]) : null,
				this.decorateTypeNode(node.children[3] as SyntaxNodeSupertype<'type'>),
			)],

			[/^declaration_variable(__break)?$/, (node) => (
				// "val" "mut" IDENTIFIER "?" ":" Type ";"
				node.children[3].text === '?' ? new AST.DeclarationVariable(
					node as SyntaxNodeFamily<'declaration_variable', ['break']>,
					true,
					new AST.Variable(node.children[2] as SyntaxNodeType<'identifier'>),
					this.decorateTypeNode(node.children[5] as SyntaxNodeSupertype<'type'>),
					null,
				) :
				// "val" ("_" | IDENTIFIER) (":" Type)? "=" Expression<+Block><?Break> ";"
				[5, 7].includes(node.children.length) ? new AST.DeclarationVariable(
					node as SyntaxNodeFamily<'declaration_variable', ['break']>,
					false,
					isSyntaxNodeType(node.children[1], 'identifier') ? new AST.Variable(node.children[1]) : null,
					node.children.length === 7 ? this.decorateTypeNode(node.children[3] as SyntaxNodeSupertype<'type'>) : null,
					this.decorateExprNode(node.children[node.children.length - 2] as SyntaxNodeSupertype<'expression'>),
				) :
				// "val" "mut" IDENTIFIER (":" Type)? "=" Expression<+Block><?Break> ";"
				(assert.ok([6, 8].includes(node.children.length)), new AST.DeclarationVariable(
					node as SyntaxNodeFamily<'declaration_variable', ['break']>,
					true,
					new AST.Variable(node.children[2] as SyntaxNodeType<'identifier'>),
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

	private decorateTypeNode(typenode: SyntaxNodeSupertype<'type'>): AST.Type {
		return (
			(isSyntaxNodeType(typenode, 'identifier'))        ? new AST.TypeAlias   (typenode) :
			(isSyntaxNodeType(typenode, 'primitive_literal')) ? new AST.TypeConstant(typenode) :
			this.decorateTS(typenode)
		);
	}

	private decorateExprNode(exprnode: SyntaxNodeSupertype<'expression'>): AST.Expression {
		return (
			(isSyntaxNodeType(exprnode, 'identifier'))        ? new AST.Variable(exprnode) :
			(isSyntaxNodeType(exprnode, 'primitive_literal')) ? new AST.Constant(exprnode) :
			this.decorateTS(exprnode)
		);
	}

	private decorateBlockNode(blocknode: SyntaxNodeFamily<'block', ['break']>): AST.Block {
		return new AST.Block(
			blocknode,
			blocknode.children
				.filter((c): c is SyntaxNodeSupertype<'statement'> => isSyntaxNodeSupertype(c, 'statement'))
				.map((c) => this.decorateTS(c)) as NonemptyArray<AST.Statement>,
			this.config,
		);
	}
}

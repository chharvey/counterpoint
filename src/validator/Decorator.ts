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
	to_serializable,
} from '../parser/index.ts';
import {AST} from './index.ts';
import {
	type SyntaxNodeType,
	isSyntaxNodeType,
	type SyntaxNodeFamily,
	isSyntaxNodeFamily,
	type SyntaxNodeSupertype,
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
} from './Operator.ts';



export class Decorator {
	private static readonly ACCESSORS: ReadonlyMap<Punctuator, ValidAccessOperator> = new Map<Punctuator, ValidAccessOperator>([
		[Punctuator.DOT,      Operator.DOT],
		[Punctuator.QUST_DOT, Operator.DOT_MAYBE],
		[Punctuator.BANG_DOT, Operator.DOT_RESULT],
	]);

	private static readonly TYPEOPERATORS_UNARY: ReadonlyMap<Punctuator | Keyword, ValidTypeOperator> = new Map<Punctuator | Keyword, ValidTypeOperator>([
		[Punctuator.QUST,    Operator.MAYBE],
		[Punctuator.BANG,    Operator.RESULT],
		[Keyword   .MUTABLE, Operator.MUTABLE],
	]);

	private static readonly TYPEOPERATORS_BINARY: ReadonlyMap<Punctuator, ValidTypeOperator> = new Map<Punctuator, ValidTypeOperator>([
		[Punctuator.AMP, Operator.AND],
		[Punctuator.BAR, Operator.OR],
	]);

	private static readonly OPERATORS_UNARY: ReadonlyMap<Punctuator, ValidOperatorUnary> = new Map<Punctuator, ValidOperatorUnary>([
		[Punctuator.TILD_QST, Operator.UN_MAYBE],
		[Punctuator.TILD_BNG, Operator.UN_RESULT],
		[Punctuator.BANG,     Operator.NOT],
		[Punctuator.QUST,     Operator.EMP],
		[Punctuator.MINUS,    Operator.NEG],
	]);

	private static readonly OPERATORS_CAST: ReadonlyMap<Keyword, ValidOperatorCast> = new Map<Keyword, ValidOperatorCast>([
		[Keyword.AS,     Operator.CAST],
		[Keyword.AS_MAY, Operator.CAST_MAYBE],
		[Keyword.AS_RES, Operator.CAST_RESULT],
	]);

	private static readonly OPERATORS_ARITHMETIC: ReadonlyMap<Punctuator, ValidOperatorArithmetic> = new Map<Punctuator, ValidOperatorArithmetic>([
		[Punctuator.CFLEX, Operator.EXP],
		[Punctuator.ASTK,  Operator.MUL],
		[Punctuator.SLASH, Operator.DIV],
		[Punctuator.PLUS,  Operator.ADD],
		[Punctuator.MINUS, Operator.SUB],
	]);

	private static readonly OPERATORS_COMPARATIVE: ReadonlyMap<Punctuator | Keyword, ValidOperatorComparative> = new Map<Punctuator | Keyword, ValidOperatorComparative>([
		[Punctuator.LT,    Operator.LT],
		[Punctuator.GT,    Operator.GT],
		[Punctuator.LT_EQ, Operator.LE],
		[Punctuator.GT_EQ, Operator.GE],
	]);

	private static readonly OPERATORS_EQUALITY: ReadonlyMap<Punctuator, ValidOperatorEquality> = new Map<Punctuator, ValidOperatorEquality>([
		[Punctuator.EQ3, Operator.ID],
		[Punctuator.EQ2, Operator.EQ],
	]);


	public constructor(private readonly config: CplConfig = CONFIG_DEFAULT) {
	}

	/* eslint-disable @typescript-eslint/unified-signatures */
	public decorate(syntaxnode: SyntaxNodeType<'identifier'>):                                             AST.TYPE.TypeAlias | AST.EXPR.Variable;
	public decorate(syntaxnode: SyntaxNodeType<'keyword_type'>):                                           AST.TYPE.Constant;
	public decorate(syntaxnode: SyntaxNodeType<'word'>):                                                   AST.Key;
	public decorate(syntaxnode: SyntaxNodeType<'primitive_literal'>):                                      AST.TYPE.Constant | AST.EXPR.Constant;
	public decorate(syntaxnode: SyntaxNodeFamily<'entry_type',        ['optional']>):                      AST.ItemType;
	public decorate(syntaxnode: SyntaxNodeFamily<'entry_type__named', ['optional']>):                      AST.PropertyType;
	public decorate(syntaxnode: SyntaxNodeType<'property_accessor_type'>):                                 AST.Index | AST.Key;
	public decorate(syntaxnode: SyntaxNodeType<'type_grouped'>):                                           AST.TYPE.Type;
	public decorate(syntaxnode: SyntaxNodeType<'type_tuple_literal'>):                                     AST.TYPE.Tuple;
	public decorate(syntaxnode: SyntaxNodeType<'type_record_literal'>):                                    AST.TYPE.Record;
	public decorate(syntaxnode: SyntaxNodeType<'type_list_literal'>):                                      AST.TYPE.List;
	public decorate(syntaxnode: SyntaxNodeType<'type_dict_literal'>):                                      AST.TYPE.Dict;
	public decorate(syntaxnode: SyntaxNodeType<'type_set_literal'>):                                       AST.TYPE.Set;
	public decorate(syntaxnode: SyntaxNodeType<'type_map_literal'>):                                       AST.TYPE.Map;
	public decorate(syntaxnode: SyntaxNodeType<'type_compound'>):                                          AST.TYPE.Access | AST.TYPE.Call;
	public decorate(syntaxnode: SyntaxNodeType<'type_unary_symbol'>):                                      AST.TYPE.OperationUnary | AST.TYPE.List | AST.TYPE.Set;
	public decorate(syntaxnode: SyntaxNodeType<'type_unary_keyword'>):                                     AST.TYPE.OperationUnary;
	public decorate(syntaxnode: SyntaxNodeType<'type_intersection'>):                                      AST.TYPE.OperationBinary;
	public decorate(syntaxnode: SyntaxNodeType<'type_union'>):                                             AST.TYPE.OperationBinary;
	public decorate(syntaxnode: SyntaxNodeType<'type_function'>):                                          AST.TYPE.Function;
	public decorate(syntaxnode: SyntaxNodeSupertype<'type'>):                                              AST.TYPE.Type;
	public decorate(syntaxnode: SyntaxNodeFamily<'string_template', ['break', 'return']>):                 AST.EXPR.Template;
	public decorate(syntaxnode: SyntaxNodeFamily<'property',        ['break', 'return']>):                 AST.Property;
	public decorate(syntaxnode: SyntaxNodeFamily<'case_map',        ['break', 'return']>):                 AST.Case;
	public decorate(syntaxnode: SyntaxNodeFamily<'case_switch',     ['break', 'return']>):                 AST.Case;
	public decorate(syntaxnode: SyntaxNodeFamily<'parameter_function', ['named']>):                        AST.ParameterFunction;
	public decorate(syntaxnode: SyntaxNodeFamily<'property_accessor',         ['break', 'return']>):       AST.Index | AST.Key | AST.EXPR.Expression;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_grouped',        ['break', 'return']>):       AST.EXPR.Expression;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_tuple_literal',  ['break', 'return']>):       AST.EXPR.Tuple;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_record_literal', ['break', 'return']>):       AST.EXPR.Record;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_list_literal',   ['break', 'return']>):       AST.EXPR.List;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_dict_literal',   ['break', 'return']>):       AST.EXPR.Dict;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_set_literal',    ['break', 'return']>):       AST.EXPR.Set;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_map_literal',    ['break', 'return']>):       AST.EXPR.Map;
	public decorate(syntaxnode: SyntaxNodeType<'expression_block'>):                                       AST.EXPR.ExpressionBlock;
	public decorate(syntaxnode: SyntaxNodeType<'property_assign'>):                                        AST.Index | AST.Key | AST.EXPR.Expression;
	public decorate(syntaxnode: SyntaxNodeType<'expression_compound'>):                                    AST.EXPR.Access | AST.EXPR.Call | AST.EXPR.OperationUnary;
	public decorate(syntaxnode: SyntaxNodeType<'expression_unary_symbol'>):                                AST.EXPR.Expression | AST.EXPR.OperationUnary;
	public decorate(syntaxnode: SyntaxNodeType<'expression_cast'>):                                        AST.EXPR.OperationBinaryCast | AST.EXPR.Claim;
	public decorate(syntaxnode: SyntaxNodeType<'expression_exponential'>):                                 AST.EXPR.OperationBinaryArithmetic;
	public decorate(syntaxnode: SyntaxNodeType<'expression_multiplicative'>):                              AST.EXPR.OperationBinaryArithmetic;
	public decorate(syntaxnode: SyntaxNodeType<'expression_additive'>):                                    AST.EXPR.OperationBinaryArithmetic;
	public decorate(syntaxnode: SyntaxNodeType<'expression_comparative'>):                                 AST.EXPR.OperationUnary | AST.EXPR.OperationBinaryComparative | AST.EXPR.OperationBinaryCast;
	public decorate(syntaxnode: SyntaxNodeType<'expression_equality'>):                                    AST.EXPR.OperationUnary | AST.EXPR.OperationBinaryEquality;
	public decorate(syntaxnode: SyntaxNodeType<'expression_conjunctive'>):                                 AST.EXPR.OperationUnary | AST.EXPR.OperationBinaryLogical;
	public decorate(syntaxnode: SyntaxNodeType<'expression_disjunctive'>):                                 AST.EXPR.OperationUnary | AST.EXPR.OperationBinaryLogical;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_conditional', ['break', 'return']>):          AST.EXPR.OperationTernary;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_switch',      ['break', 'return']>):          AST.EXPR.Switch;
	public decorate(syntaxnode: SyntaxNodeType<'expression_function'>):                                    AST.EXPR.Function;
	public decorate(syntaxnode: SyntaxNodeSupertype<'expression'>):                                        AST.EXPR.Expression;
	public decorate(syntaxnode: SyntaxNodeFamily<'assignee',              [          'break', 'return']>): AST.EXPR.Variable | AST.EXPR.Access;
	public decorate(syntaxnode: SyntaxNodeFamily<'statement_expression',  [          'break', 'return']>): AST.STMT.StatementExpression;
	public decorate(syntaxnode: SyntaxNodeFamily<'statement_claim',       [          'break', 'return']>): AST.STMT.StatementClaim;
	public decorate(syntaxnode: SyntaxNodeFamily<'statement_set',         [          'break', 'return']>): AST.STMT.StatementReassignment;
	public decorate(syntaxnode: SyntaxNodeFamily<'statement_delete',      [          'break', 'return']>): AST.STMT.StatementReassignment;
	public decorate(syntaxnode: SyntaxNodeFamily<'statement_conditional', ['unless', 'break', 'return']>): AST.STMT.StatementConditional;
	public decorate(syntaxnode: SyntaxNodeFamily<'statement_loop',        [                   'return']>): AST.STMT.StatementLoop;
	public decorate(syntaxnode: SyntaxNodeFamily<'statement_iteration',   [                   'return']>): AST.STMT.StatementIteration;
	public decorate(syntaxnode: SyntaxNodeType<'statement_break'>):                                        AST.STMT.StatementBreak;
	public decorate(syntaxnode: SyntaxNodeFamily<'statement_return', ['break']>):                          AST.STMT.StatementReturn;
	public decorate(syntaxnode: SyntaxNodeSupertype<'statement'>):                                         AST.STMT.Statement;
	public decorate(syntaxnode: SyntaxNodeFamily<'block', ['break', 'return']>):                           AST.Block;
	public decorate(syntaxnode: SyntaxNodeType<'declaration_type'>):                                       AST.STMT.DeclarationType;
	public decorate(syntaxnode: SyntaxNodeFamily<'declaration_variable', ['break', 'return']>):            AST.STMT.DeclarationVariable;
	public decorate(syntaxnode: SyntaxNodeType<'declaration_function'>):                                   AST.STMT.DeclarationFunction;
	public decorate(syntaxnode: SyntaxNodeSupertype<'declaration'>):                                       AST.STMT.Declaration;
	public decorate(syntaxnode: SyntaxNodeType<'source_file'>):                                            AST.Goal;
	public decorate(syntaxnode: SyntaxNode):                                                               AST.AstNode;
	/* eslint-enable @typescript-eslint/unified-signatures */
	public decorate(syntaxnode: SyntaxNode): AST.AstNode {
		const decorators = new Map<string | RegExp, (node: SyntaxNode) => AST.AstNode>([
			['source_file', (node) => new AST.Goal(
				node as SyntaxNodeType<'source_file'>,
				node.firstNamedChild && this.decorateBlockNode(node.firstNamedChild as SyntaxNodeType<'block'>),
				this.config,
			)],

			/* # TERMINALS */

			/* # PRODUCTIONS */
			['keyword_type', (node) => new AST.TYPE.Constant(node as SyntaxNodeType<'keyword_type'>)],

			['word', (node) => new AST.Key(node as SyntaxNodeType<'word'>)],


			/* ## Types */
			['entry_type', (node) => new AST.ItemType(
				node as SyntaxNodeType<'entry_type'>,
				false,
				this.decorateTypeNode(node.childForFieldName('type_0') as SyntaxNodeSupertype<'type'>),
			)],

			['entry_type__optional', (node) => new AST.ItemType(
				node as SyntaxNodeType<'entry_type__optional'>,
				true,
				this.decorateTypeNode(node.childForFieldName('type_0') as SyntaxNodeSupertype<'type'>),
			)],

			['entry_type__named', (node) => new AST.PropertyType(
				node as SyntaxNodeType<'entry_type__named'>,
				false,
				this.decorate(node.childForFieldName('word_0') as SyntaxNodeType<'word'>),
				this.decorateTypeNode(node.childForFieldName('type_0') as SyntaxNodeSupertype<'type'>),
			)],

			['entry_type__named__optional', (node) => new AST.PropertyType(
				node as SyntaxNodeType<'entry_type__named__optional'>,
				true,
				this.decorate(node.childForFieldName('word_0') as SyntaxNodeType<'word'>),
				this.decorateTypeNode(node.childForFieldName('type_0') as SyntaxNodeSupertype<'type'>),
			)],

			['property_accessor_type', (node) => (
				isSyntaxNodeType(node.firstNamedChild, /integer|natural/) ? new AST.Index(node.firstNamedChild as SyntaxNodeType<'integer' | 'natural'>) :
				this.decorate(node.firstNamedChild as SyntaxNodeType<'word'>)
			)],

			['type_grouped', (node) => this.decorateTypeNode(node.firstNamedChild as SyntaxNodeSupertype<'type'>)],

			['type_tuple_literal', (node) => new AST.TYPE.Tuple(
				node as SyntaxNodeType<'type_tuple_literal'>,
				node.namedChildren.map((c) => this.decorate(c as SyntaxNodeFamily<'entry_type', ['optional']>)),
			)],

			['type_record_literal', (node) => new AST.TYPE.Record(
				node as SyntaxNodeType<'type_record_literal'>,
				node.namedChildren.map((c) => this.decorate(c as SyntaxNodeFamily<'entry_type__named', ['optional']>)) as NonemptyArray<AST.PropertyType>,
			)],

			['type_list_literal', (node) => new AST.TYPE.List(
				node as SyntaxNodeType<'type_list_literal'>,
				this.decorateTypeNode(node.firstNamedChild as SyntaxNodeSupertype<'type'>),
			)],

			['type_dict_literal', (node) => new AST.TYPE.Dict(
				node as SyntaxNodeType<'type_dict_literal'>,
				this.decorateTypeNode(node.firstNamedChild as SyntaxNodeSupertype<'type'>),
			)],

			['type_set_literal', (node) => new AST.TYPE.Set(
				node as SyntaxNodeType<'type_set_literal'>,
				this.decorateTypeNode(node.firstNamedChild as SyntaxNodeSupertype<'type'>),
			)],

			['type_map_literal', (node) => new AST.TYPE.Map(
				node as SyntaxNodeType<'type_map_literal'>,
				this.decorateTypeNode(node.namedChild(0) as SyntaxNodeSupertype<'type'>),
				this.decorateTypeNode(node.namedChild(1) as SyntaxNodeSupertype<'type'>),
			)],

			['type_compound', (node) => {
				const type_0                   = node.childForFieldName('type_0')                   as SyntaxNodeSupertype<'type'>;
				const property_accessor_type_0 = node.childForFieldName('property_accessor_type_0') as SyntaxNodeType<'property_accessor_type'> | null;
				return property_accessor_type_0 ? new AST.TYPE.Access(
					node as SyntaxNodeType<'type_compound'>,
					Decorator.ACCESSORS.get(node.children[1].type as Punctuator) as ValidTypeAccessOperator,
					this.decorateTypeNode(type_0),
					this.decorate(property_accessor_type_0),
				) : new AST.TYPE.Call(
					node as SyntaxNodeType<'type_compound'>,
					this.decorateTypeNode(type_0),
					node.childForFieldName('generic_arguments_0')!.namedChildren.map((c) => this.decorateTypeNode(c as SyntaxNodeSupertype<'type'>)) as NonemptyArray<AST.TYPE.Type>,
				);
			}],

			['type_unary_symbol', (node) => new AST.TYPE.OperationUnary(
				node as SyntaxNodeType<'type_unary_symbol'>,
				Decorator.TYPEOPERATORS_UNARY.get(node.children[1].type as Punctuator)!,
				this.decorateTypeNode(node.firstNamedChild as SyntaxNodeSupertype<'type'>),
			)],

			['type_unary_keyword', (node) => new AST.TYPE.OperationUnary(
				node as SyntaxNodeType<'type_unary_keyword'>,
				Decorator.TYPEOPERATORS_UNARY.get(node.children[0].type as Keyword)!,
				this.decorateTypeNode(node.firstNamedChild as SyntaxNodeSupertype<'type'>),
			)],

			['type_intersection', (node) => new AST.TYPE.OperationBinary(
				node as SyntaxNodeType<'type_intersection'>,
				Decorator.TYPEOPERATORS_BINARY.get(node.children[1].type as Punctuator)!,
				this.decorateTypeNode(node.namedChild(0) as SyntaxNodeSupertype<'type'>),
				this.decorateTypeNode(node.namedChild(1) as SyntaxNodeSupertype<'type'>),
			)],

			['type_union', (node) => new AST.TYPE.OperationBinary(
				node as SyntaxNodeType<'type_union'>,
				Decorator.TYPEOPERATORS_BINARY.get(node.children[1].type as Punctuator)!,
				this.decorateTypeNode(node.namedChild(0) as SyntaxNodeSupertype<'type'>),
				this.decorateTypeNode(node.namedChild(1) as SyntaxNodeSupertype<'type'>),
			)],

			['type_function', (node) => new AST.TYPE.Function(
				node as SyntaxNodeType<'type_function'>,
				node.namedChildren.filter((c) => isSyntaxNodeType(c, 'entry_type'))        .map((c) => this.decorate(c)),
				node.namedChildren.filter((c) => isSyntaxNodeType(c, 'entry_type__named')) .map((c) => this.decorate(c)),
				node.childForFieldName('type_0') && this.decorateTypeNode(node.childForFieldName('type_0') as SyntaxNodeSupertype<'type'>),
			)],

			/* ## Expressions */
			[/^string_template(__break)?(__return)?$/, (node) => new AST.EXPR.Template(
				node as SyntaxNodeFamily<'string_template', ['break', 'return']>,
				node.namedChildren.map((c) => ((isSyntaxNodeType(c, /^template_(full|head|middle|tail)$/))
					? new AST.EXPR.Constant(c as SyntaxNodeType<`template_${ 'full' | 'head' | 'middle' | 'tail' }`>)
					: this.decorateExprNode(c as SyntaxNodeSupertype<'expression'>)
				)),
			)],

			[/^property(__break)?(__return)?$/, (node) => new AST.Property(
				node as SyntaxNodeFamily<'property', ['break', 'return']>,
				this.decorate(node.namedChild(0) as SyntaxNodeType<'word'>),
				this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
			)],

			[/^case_map(__break)?(__return)?$/, (node) => new AST.Case(
				node as SyntaxNodeFamily<'case_map', ['break', 'return']>,
				[this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>)],
				this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
			)],

			[/^case_switch(__break)?(__return)?$/, (node) => new AST.Case(
				node as SyntaxNodeFamily<'case_switch', ['break', 'return']>,
				node.namedChildren.slice(0, -1).map((ant) => this.decorateExprNode(ant as SyntaxNodeSupertype<'expression'>)) as NonemptyArray<AST.EXPR.Expression>,
				this.decorateExprNode(node.namedChildren.at(-1) as SyntaxNodeSupertype<'expression'>),
			)],

			[/^parameter_function(__named)?$/, (node) => {
				const identifier_0 = node.childForFieldName('identifier_0') as SyntaxNodeType<'identifier'> | null;
				const word_0       = node.childForFieldName('word_0')       as SyntaxNodeType<'word'>       | null;
				return new AST.ParameterFunction(
					node as SyntaxNodeFamily<'parameter_function', ['named']>,
					!!(word_0 ?? node.childForFieldName('pun_0')),
					!!node.childForFieldName('mut_0'),
					identifier_0 && to_serializable(identifier_0),
					word_0 && this.decorate(word_0),
					this.decorateTypeNode(node.childForFieldName('type_0') as SyntaxNodeSupertype<'type'>),
				);
			}],

			[/^property_accessor(__break)?(__return)?$/, (node) => (
				isSyntaxNodeType(node.firstNamedChild, /integer|natural/) ? new AST.Index(node.firstNamedChild as SyntaxNodeType<'integer' | 'natural'>) :
				isSyntaxNodeType(node.firstNamedChild, 'word')            ? this.decorate(node.firstNamedChild) :
				this.decorateExprNode(node.firstNamedChild as SyntaxNodeSupertype<'expression'>)
			)],

			[/^expression_grouped(__break)?(__return)?$/, (node) => this.decorateExprNode(node.firstNamedChild as SyntaxNodeSupertype<'expression'>)],

			[/^expression_tuple_literal(__break)?(__return)?$/, (node) => new AST.EXPR.Tuple(
				node as SyntaxNodeFamily<'expression_tuple_literal', ['break', 'return']>,
				node.namedChildren.map((c) => this.decorateExprNode(c as SyntaxNodeSupertype<'expression'>)),
			)],

			[/^expression_record_literal(__break)?(__return)?$/, (node) => new AST.EXPR.Record(
				node as SyntaxNodeFamily<'expression_record_literal', ['break', 'return']>,
				node.namedChildren.map((c) => this.decorate(c as SyntaxNodeFamily<'property', ['break', 'return']>)) as NonemptyArray<AST.Property>,
			)],

			[/^expression_list_literal(__break)?(__return)?$/, (node) => new AST.EXPR.List(
				node as SyntaxNodeFamily<'expression_list_literal', ['break', 'return']>,
				node.namedChildren.map((c) => this.decorateExprNode(c as SyntaxNodeSupertype<'expression'>)),
			)],

			[/^expression_dict_literal(__break)?(__return)?$/, (node) => new AST.EXPR.Dict(
				node as SyntaxNodeFamily<'expression_dict_literal', ['break', 'return']>,
				node.namedChildren.map((c) => this.decorate(c as SyntaxNodeFamily<'property', ['break', 'return']>)) as NonemptyArray<AST.Property>,
			)],

			[/^expression_set_literal(__break)?(__return)?$/, (node) => new AST.EXPR.Set(
				node as SyntaxNodeFamily<'expression_set_literal', ['break', 'return']>,
				node.namedChildren.map((c) => this.decorateExprNode(c as SyntaxNodeSupertype<'expression'>)),
			)],

			[/^expression_map_literal(__break)?(__return)?$/, (node) => new AST.EXPR.Map(
				node as SyntaxNodeFamily<'expression_map_literal', ['break', 'return']>,
				node.namedChildren.map((c) => this.decorate(c as SyntaxNodeFamily<'case_map', ['break', 'return']>)) as NonemptyArray<AST.Case>,
			)],

			// NOTE: the following expression types (`_block` through `_disjunctive`) refer to aliases in the grammar --- no need for suffices

			['expression_block', (node) => new AST.EXPR.ExpressionBlock(
				node as SyntaxNodeType<'expression_block'>,
				this.decorateBlockNode(node as SyntaxNodeFamily<'block', ['break', 'return']>),
			)],

			['expression_compound', (node) => {
				const expression_0        = node.childForFieldName('expression_0')        as SyntaxNodeSupertype<'expression'>;
				const property_accessor_0 = node.childForFieldName('property_accessor_0') as SyntaxNodeFamily<'property_accessor', ['break', 'return']> | null;
				const is_function_call    = !!(node.childForFieldName('generic_arguments_0') ?? node.childForFieldName('function_arguments_0'));
				return property_accessor_0 ? new AST.EXPR.Access(
					node as SyntaxNodeType<'expression_compound'>,
					Decorator.ACCESSORS.get(node.children[1].type as Punctuator)!,
					this.decorateExprNode(expression_0),
					this.decorate(property_accessor_0),
				) : is_function_call ? new AST.EXPR.Call(
					node as SyntaxNodeType<'expression_compound'>,
					this.decorateExprNode(expression_0),
					node.childForFieldName('generic_arguments_0') ?.namedChildren.map((c) => this.decorateTypeNode(c as SyntaxNodeSupertype<'type'>)) ?? [],
					node.childForFieldName('function_arguments_0')!.namedChildren.map((c) => this.decorateExprNode(c as SyntaxNodeSupertype<'expression'>)),
				) : new AST.EXPR.OperationUnary(
					node as SyntaxNodeType<'expression_compound'>,
					Decorator.OPERATORS_UNARY.get(node.children[1].type as Punctuator)!,
					this.decorateExprNode(expression_0),
				);
			}],

			['expression_unary_symbol', (node) => (node.children[0].type === Punctuator.PLUS // `+a` is a no-op
				? this.decorateExprNode(node.firstNamedChild as SyntaxNodeSupertype<'expression'>)
				: new AST.EXPR.OperationUnary(
					node as SyntaxNodeType<'expression_unary_symbol'>,
					Decorator.OPERATORS_UNARY.get(node.children[0].type as Punctuator)!,
					this.decorateExprNode(node.firstNamedChild as SyntaxNodeSupertype<'expression'>),
				)
			)],

			['expression_cast', (node) => {
				const expression_0 = node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>;
				const expression_1 = node.childForFieldName('expression_1') as SyntaxNodeSupertype<'expression'> | null;
				return expression_1
					? new AST.EXPR.OperationBinaryCast(
						node as SyntaxNodeType<'expression_cast'>,
						Decorator.OPERATORS_CAST.get(node.children[1].type as Keyword)!,
						this.decorateExprNode(expression_0),
						this.decorateExprNode(expression_1),
					)
					: new AST.EXPR.Claim(
						node as SyntaxNodeType<'expression_cast'>,
						this.decorateExprNode(expression_0),
						this.decorateTypeNode(node.childForFieldName('type_0') as SyntaxNodeSupertype<'type'>),
					);
			}],

			['expression_exponential', (node) => new AST.EXPR.OperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_exponential'>,
				Operator.EXP,
				this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_multiplicative', (node) => new AST.EXPR.OperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_multiplicative'>,
				Decorator.OPERATORS_ARITHMETIC.get(node.children[1].type as Punctuator)!,
				this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_additive', (node) => new AST.EXPR.OperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_additive'>,
				Decorator.OPERATORS_ARITHMETIC.get(node.children[1].type as Punctuator)!,
				this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_comparative', (node) => ((
				n:        SyntaxNodeType<'expression_comparative'>,
				punct:    Punctuator | Keyword,
				operands: readonly [AST.EXPR.Expression, AST.EXPR.Expression],
			) => (
				// `a !< b` is syntax sugar for `!(a < b)`
				punct === Punctuator.BANG_LT ? new AST.EXPR.OperationUnary(
					n,
					Operator.NOT,
					new AST.EXPR.OperationBinaryComparative(n, Operator.LT, ...operands),
				) :
				// `a !> b` is syntax sugar for `!(a > b)`
				punct === Punctuator.BANG_GT ? new AST.EXPR.OperationUnary(
					n,
					Operator.NOT,
					new AST.EXPR.OperationBinaryComparative(n, Operator.GT, ...operands),
				) :
				punct === Keyword.IS ? new AST.EXPR.OperationBinaryCast(
					n,
					Operator.IS,
					...operands,
				) :
				// `a !is b` is syntax sugar for `!(a is b)`
				punct === Keyword.ISNT ? new AST.EXPR.OperationUnary(
					n,
					Operator.NOT,
					new AST.EXPR.OperationBinaryCast(
						n,
						Operator.IS,
						...operands,
					),
				) :
				new AST.EXPR.OperationBinaryComparative(
					n,
					Decorator.OPERATORS_COMPARATIVE.get(punct)!,
					...operands,
				)
			))(
				node as SyntaxNodeType<'expression_comparative'>,
				node.children[1].type as Punctuator | Keyword,
				[
					this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
					this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
				],
			)],

			['expression_equality', (node) => ((
				n:        SyntaxNodeType<'expression_equality'>,
				punct:    Punctuator,
				operands: readonly [AST.EXPR.Expression, AST.EXPR.Expression],
			) => (
				// `a !== b` is syntax sugar for `!(a === b)`
				punct === Punctuator.BANG_EQ2 ? new AST.EXPR.OperationUnary(
					n,
					Operator.NOT,
					new AST.EXPR.OperationBinaryEquality(n, Operator.ID, ...operands),
				) :
				// `a != b` is syntax sugar for `!(a == b)`
				punct === Punctuator.BANG_EQ ? new AST.EXPR.OperationUnary(
					n,
					Operator.NOT,
					new AST.EXPR.OperationBinaryEquality(n, Operator.EQ, ...operands),
				) :
				new AST.EXPR.OperationBinaryEquality(
					n,
					Decorator.OPERATORS_EQUALITY.get(punct)!,
					...operands,
				)
			))(
				node as SyntaxNodeType<'expression_equality'>,
				node.children[1].type as Punctuator,
				[
					this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
					this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
				],
			)],

			['expression_conjunctive', (node) => ((
				n:        SyntaxNodeType<'expression_conjunctive'>,
				punct:    Punctuator,
				operands: readonly [AST.EXPR.Expression, AST.EXPR.Expression],
			) => (
				// `a !& b` is syntax sugar for `!(a && b)`
				punct === Punctuator.BANG_AMP ? new AST.EXPR.OperationUnary(
					n,
					Operator.NOT,
					new AST.EXPR.OperationBinaryLogical(n, Operator.AND, ...operands),
				) :
				new AST.EXPR.OperationBinaryLogical(n, Operator.AND, ...operands)
			))(
				node as SyntaxNodeType<'expression_conjunctive'>,
				node.children[1].type as Punctuator,
				[
					this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
					this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
				],
			)],

			['expression_disjunctive', (node) => ((
				n:        SyntaxNodeType<'expression_disjunctive'>,
				punct:    Punctuator,
				operands: readonly [AST.EXPR.Expression, AST.EXPR.Expression],
			) => (
				// `a !| b` is syntax sugar for `!(a || b)`
				punct === Punctuator.BANG_BAR ? new AST.EXPR.OperationUnary(
					n,
					Operator.NOT,
					new AST.EXPR.OperationBinaryLogical(n, Operator.OR, ...operands),
				) :
				new AST.EXPR.OperationBinaryLogical(n, Operator.OR, ...operands)
			))(
				node as SyntaxNodeType<'expression_disjunctive'>,
				node.children[1].type as Punctuator,
				[
					this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
					this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
				],
			)],

			[/^expression_conditional(__break)?(__return)?$/, (node) => new AST.EXPR.OperationTernary(
				node as SyntaxNodeFamily<'expression_conditional', ['break', 'return']>,
				Operator.COND,
				this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.namedChild(2) as SyntaxNodeSupertype<'expression'>),
			)],

			[/^expression_switch(__break)?(__return)?$/, (node) => new AST.EXPR.Switch(
				node as SyntaxNodeFamily<'expression_switch', ['break', 'return']>,
				this.decorateExprNode(node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>),
				node.namedChildren.slice(1, -1).map((kase) => this.decorate(kase as SyntaxNodeFamily<'case_switch', ['break', 'return']>)),
				this.decorateExprNode(node.childForFieldName('expression_1') as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_function', (node) => {
				const type_0       = node.childForFieldName('type_0')       as SyntaxNodeSupertype<'type'>       | null;
				const expression_0 = node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'> | null;
				return expression_0 ? AST.EXPR.Function.fromSource(`\\(
					${ node.namedChildren.filter((c) => isSyntaxNodeFamily(c, 'parameter_function', ['named'])).map((c) => c.text).join(', ') }
				): ${ type_0?.text ?? 'void' } {
					return ${ expression_0.text };
				}`) : new AST.EXPR.Function(
					node as SyntaxNodeType<'expression_function'>,
					node.namedChildren.filter((c) => isSyntaxNodeFamily(c, 'parameter_function', ['named'])).map((c) => this.decorate(c)),
					type_0 && this.decorateTypeNode(type_0),
					this.decorateBlockNode(node.childForFieldName('block_0') as SyntaxNodeFamily<'block', ['return']>, true),
				);
			}],

			/* ## Statements */
			[/^assignee(__break)?(__return)?$/, (node) => {
				const identifier_0 = node.childForFieldName('identifier_0') as SyntaxNodeType<'identifier'> | null;
				return identifier_0
					? new AST.EXPR.Variable(identifier_0)
					: new AST.EXPR.Access(
						node as SyntaxNodeFamily<'assignee', ['break', 'return']>,
						Operator.DOT,
						this.decorateExprNode(node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>),
						this.decorate(node.childForFieldName('property_accessor_0') as SyntaxNodeFamily<'property_accessor', ['break', 'return']>),
					);
			}],

			[/^statement_expression(__break)?(__return)?$/, (node) => new AST.STMT.StatementExpression(
				node as SyntaxNodeFamily<'statement_expression', ['break', 'return']>,
				node.firstNamedChild ? this.decorateExprNode(node.firstNamedChild as SyntaxNodeSupertype<'expression'>) : undefined,
			)],

			[/^statement_claim(__break)?(__return)?$/, (node) => new AST.STMT.StatementClaim(
				node as SyntaxNodeFamily<'statement_claim', ['break', 'return']>,
				this.decorate(node.namedChild(0) as SyntaxNodeFamily<'assignee', ['break', 'return']>),
				this.decorateTypeNode(node.namedChild(1) as SyntaxNodeSupertype<'type'>),
			)],

			[/^statement_set(__break)?(__return)?$/, (node) => new AST.STMT.StatementReassignment(
				node as SyntaxNodeFamily<'statement_set', ['break', 'return']>,
				this.decorate(node.namedChild(0) as SyntaxNodeFamily<'assignee', ['break', 'return']>),
				this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
			)],

			[/^statement_delete(__break)?(__return)?$/, (node) => new AST.STMT.StatementReassignment(
				node as SyntaxNodeFamily<'statement_delete', ['break', 'return']>,
				this.decorate(node.namedChild(0) as SyntaxNodeFamily<'assignee', ['break', 'return']>),
			)],

			[/^statement_conditional(__break)?(__return)?$/, (node) => {
				const block_1                 = node.childForFieldName('block_1')                 as SyntaxNodeFamily<'block', ['break', 'return']>                 | null;
				const statement_conditional_0 = node.childForFieldName('statement_conditional_0') as SyntaxNodeFamily<'statement_conditional', ['break', 'return']> | null;
				return new AST.STMT.StatementConditional(
					node as SyntaxNodeFamily<'statement_conditional', ['break', 'return']>,
					false,
					this.decorateExprNode(node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>),
					this.decorateBlockNode(node.childForFieldName('block_0')     as SyntaxNodeFamily<'block', ['break', 'return']>),
					block_1 ? this.decorateBlockNode(block_1) : statement_conditional_0 ? this.decorate(statement_conditional_0) : undefined,
				);
			}],

			[/^statement_conditional__unless(__break)?(__return)?$/, (node) => new AST.STMT.StatementConditional(
				node as SyntaxNodeFamily<'statement_conditional__unless', ['break', 'return']>,
				true,
				this.decorateExprNode(node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>),
				this.decorateBlockNode(node.childForFieldName('block_0')     as SyntaxNodeFamily<'block', ['break', 'return']>),
			)],

			[/^statement_loop(__return)?$/, (node) => new AST.STMT.StatementLoop(
				node as SyntaxNodeFamily<'statement_loop', ['return']>,
				node.children[0].type === Keyword.DO,
				!!node.childForFieldName('until_0'),
				this.decorateExprNode(node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>),
				this.decorateBlockNode(node.childForFieldName('block_0')     as SyntaxNodeType<'block__break'>),
			)],

			[/^statement_iteration(__return)?$/, (node) => {
				const identifier_0 = node.childForFieldName('identifier_0') as SyntaxNodeType<'identifier'> | null;
				return new AST.STMT.StatementIteration(
					node as SyntaxNodeFamily<'statement_iteration', ['return']>,
					identifier_0 && to_serializable(identifier_0),
					this.decorateTypeNode(node.childForFieldName('type_0')       as SyntaxNodeSupertype<'type'>),
					this.decorateExprNode(node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>),
					this.decorateBlockNode(node.childForFieldName('block_0')     as SyntaxNodeType<'block__break'>),
				);
			}],

			['statement_break', (node) => new AST.STMT.StatementBreak(
				node as SyntaxNodeType<'statement_break'>,
				node.children[0].type === Keyword.SKIP,
			)],

			[/^statement_return(__break)?$/, (node) => new AST.STMT.StatementReturn(
				node as SyntaxNodeType<'statement_return'>,
				node.childForFieldName('expression_0') && this.decorateExprNode(node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>),
			)],

			[/^block(__break)?(__return)?$/, (node) => this.decorateBlockNode(node as SyntaxNodeFamily<'block', ['break', 'return']>)],

			['declaration_type', (node) => {
				const identifier_0 = node.childForFieldName('identifier_0') as SyntaxNodeType<'identifier'> | null;
				return new AST.STMT.DeclarationType(
					node as SyntaxNodeType<'declaration_type'>,
					identifier_0 && to_serializable(identifier_0),
					this.decorateTypeNode(node.childForFieldName('type_0') as SyntaxNodeSupertype<'type'>),
				);
			}],

			[/^declaration_variable(__break)?(__return)?$/, (node) => {
				const is_writable: boolean = !!node.childForFieldName('mut_0');
				const identifier_0 = node.childForFieldName('identifier_0') as SyntaxNodeType<'identifier'>      | null;
				const type_0       = node.childForFieldName('type_0')       as SyntaxNodeSupertype<'type'>       | null;
				const expression_0 = node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'> | null;

				if (is_writable) {
					assert.ok(identifier_0);
				} else {
					assert.ok(expression_0);
				}
				if (!identifier_0) {
					assert.ok(!is_writable);
					assert.ok(expression_0);
				}
				if (!expression_0) {
					assert.ok(is_writable);
					assert.ok(identifier_0);
				}
				return new AST.STMT.DeclarationVariable(
					node as SyntaxNodeFamily<'declaration_variable', ['break', 'return']>,
					is_writable,
					identifier_0 && to_serializable(identifier_0),
					type_0       && this.decorateTypeNode(type_0),
					expression_0 && this.decorateExprNode(expression_0),
				);
			}],

			['declaration_function', (node) => {
				const identifier_0 = node.childForFieldName('identifier_0') as SyntaxNodeType<'identifier'> | null;
				return new AST.STMT.DeclarationFunction(
					node as SyntaxNodeType<'declaration_function'>,
					identifier_0 && to_serializable(identifier_0),
					node.namedChildren.filter((c) => isSyntaxNodeFamily(c, 'parameter_function', ['named'])).map((c) => this.decorate(c)),
					this.decorateBlockNode(node.childForFieldName('block_0') as SyntaxNodeFamily<'block', ['return']>, true),
				);
			}],
		]);
		return (
			decorators.get(syntaxnode.type) ??
			[...decorators].find(([key]) => key instanceof RegExp && isSyntaxNodeType(syntaxnode, key))?.[1] ??
			((node) => {
				throw new TypeError(`Could not find type of parse node \`${ node.type }\`.`);
			})
		)(syntaxnode);
	}

	public decorateTypeNode(typenode: SyntaxNodeSupertype<'type'>): AST.TYPE.Type {
		return (
			(isSyntaxNodeType(typenode, 'identifier'))        ? new AST.TYPE.TypeAlias (typenode) :
			(isSyntaxNodeType(typenode, 'primitive_literal')) ? new AST.TYPE.Constant  (typenode) :
			this.decorate(typenode)
		);
	}

	public decorateExprNode(exprnode: SyntaxNodeSupertype<'expression'>): AST.EXPR.Expression {
		return (
			(isSyntaxNodeType(exprnode, 'identifier'))        ? new AST.EXPR.Variable(exprnode) :
			(isSyntaxNodeType(exprnode, 'primitive_literal')) ? new AST.EXPR.Constant(exprnode) :
			this.decorate(exprnode)
		);
	}

	private decorateBlockNode(blocknode: SyntaxNodeFamily<'block', ['break', 'return']>, is_func_block: boolean = false): AST.Block {
		return new AST.Block(
			blocknode,
			blocknode.namedChildren.map((c) => this.decorate(c as SyntaxNodeSupertype<'statement'>)) as NonemptyArray<AST.STMT.Statement>,
			this.config,
			is_func_block,
		);
	}
}

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
	public decorate(syntaxnode: SyntaxNodeType<'identifier'>):                                    AST.TYPE.TypeAlias | AST.EXPR.Variable;
	public decorate(syntaxnode: SyntaxNodeType<'keyword_type'>):                                  AST.TYPE.Constant;
	public decorate(syntaxnode: SyntaxNodeType<'word'>):                                          AST.Key;
	public decorate(syntaxnode: SyntaxNodeType<'primitive_literal'>):                             AST.TYPE.Constant | AST.EXPR.Constant;
	public decorate(syntaxnode: SyntaxNodeFamily<'entry_type',        ['optional']>):             AST.ItemType;
	public decorate(syntaxnode: SyntaxNodeFamily<'entry_type__named', ['optional']>):             AST.PropertyType;
	public decorate(syntaxnode: SyntaxNodeType<'property_accessor_type'>):                        AST.Index | AST.Key;
	public decorate(syntaxnode: SyntaxNodeType<'type_grouped'>):                                  AST.TYPE.Type;
	public decorate(syntaxnode: SyntaxNodeType<'type_tuple_literal'>):                            AST.TYPE.Tuple;
	public decorate(syntaxnode: SyntaxNodeType<'type_record_literal'>):                           AST.TYPE.Record;
	public decorate(syntaxnode: SyntaxNodeType<'type_list_literal'>):                             AST.TYPE.List;
	public decorate(syntaxnode: SyntaxNodeType<'type_dict_literal'>):                             AST.TYPE.Dict;
	public decorate(syntaxnode: SyntaxNodeType<'type_set_literal'>):                              AST.TYPE.Set;
	public decorate(syntaxnode: SyntaxNodeType<'type_map_literal'>):                              AST.TYPE.Map;
	public decorate(syntaxnode: SyntaxNodeType<'type_compound'>):                                 AST.TYPE.Access | AST.TYPE.Call;
	public decorate(syntaxnode: SyntaxNodeType<'type_unary_symbol'>):                             AST.TYPE.OperationUnary | AST.TYPE.List | AST.TYPE.Set;
	public decorate(syntaxnode: SyntaxNodeType<'type_unary_keyword'>):                            AST.TYPE.OperationUnary;
	public decorate(syntaxnode: SyntaxNodeType<'type_intersection'>):                             AST.TYPE.OperationBinary;
	public decorate(syntaxnode: SyntaxNodeType<'type_union'>):                                    AST.TYPE.OperationBinary;
	public decorate(syntaxnode: SyntaxNodeSupertype<'type'>):                                     AST.TYPE.Type;
	public decorate(syntaxnode: SyntaxNodeFamily<'string_template',           ['break']>):        AST.EXPR.Template;
	public decorate(syntaxnode: SyntaxNodeFamily<'property',                  ['break']>):        AST.Property;
	public decorate(syntaxnode: SyntaxNodeFamily<'case',                      ['break']>):        AST.Case;
	public decorate(syntaxnode: SyntaxNodeFamily<'property_accessor',         ['break']>):        AST.Index | AST.Key | AST.EXPR.Expression;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_grouped',        ['break']>):        AST.EXPR.Expression;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_tuple_literal',  ['break']>):        AST.EXPR.Tuple;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_record_literal', ['break']>):        AST.EXPR.Record;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_list_literal',   ['break']>):        AST.EXPR.List;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_dict_literal',   ['break']>):        AST.EXPR.Dict;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_set_literal',    ['break']>):        AST.EXPR.Set;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_map_literal',    ['break']>):        AST.EXPR.Map;
	public decorate(syntaxnode: SyntaxNodeType<'expression_block'>):                              AST.EXPR.ExpressionBlock;
	public decorate(syntaxnode: SyntaxNodeType<'property_assign'>):                               AST.Index | AST.Key | AST.EXPR.Expression;
	public decorate(syntaxnode: SyntaxNodeType<'expression_compound'>):                           AST.EXPR.Access | AST.EXPR.Call;
	public decorate(syntaxnode: SyntaxNodeType<'expression_unary_symbol'>):                       AST.EXPR.Expression | AST.EXPR.OperationUnary;
	public decorate(syntaxnode: SyntaxNodeType<'expression_cast'>):                               AST.EXPR.OperationBinaryCast | AST.EXPR.Claim;
	public decorate(syntaxnode: SyntaxNodeType<'expression_exponential'>):                        AST.EXPR.OperationBinaryArithmetic;
	public decorate(syntaxnode: SyntaxNodeType<'expression_multiplicative'>):                     AST.EXPR.OperationBinaryArithmetic;
	public decorate(syntaxnode: SyntaxNodeType<'expression_additive'>):                           AST.EXPR.OperationBinaryArithmetic;
	public decorate(syntaxnode: SyntaxNodeType<'expression_comparative'>):                        AST.EXPR.OperationUnary | AST.EXPR.OperationBinaryComparative;
	public decorate(syntaxnode: SyntaxNodeType<'expression_equality'>):                           AST.EXPR.OperationUnary | AST.EXPR.OperationBinaryEquality;
	public decorate(syntaxnode: SyntaxNodeType<'expression_conjunctive'>):                        AST.EXPR.OperationUnary | AST.EXPR.OperationBinaryLogical;
	public decorate(syntaxnode: SyntaxNodeType<'expression_disjunctive'>):                        AST.EXPR.OperationUnary | AST.EXPR.OperationBinaryLogical;
	public decorate(syntaxnode: SyntaxNodeFamily<'expression_conditional', ['break']>):           AST.EXPR.OperationTernary;
	public decorate(syntaxnode: SyntaxNodeSupertype<'expression'>):                               AST.EXPR.Expression;
	public decorate(syntaxnode: SyntaxNodeFamily<'assignee',               ['break']>):           AST.EXPR.Variable | AST.EXPR.Access;
	public decorate(syntaxnode: SyntaxNodeFamily<'statement_expression',   ['break']>):           AST.STMT.StatementExpression;
	public decorate(syntaxnode: SyntaxNodeFamily<'statement_claim',        ['break']>):           AST.STMT.StatementClaim;
	public decorate(syntaxnode: SyntaxNodeFamily<'statement_reassignment', ['break']>):           AST.STMT.StatementReassignment;
	public decorate(syntaxnode: SyntaxNodeFamily<'statement_conditional',  ['unless', 'break']>): AST.STMT.StatementConditional;
	public decorate(syntaxnode: SyntaxNodeType<'statement_loop'>):                                AST.STMT.StatementLoop;
	public decorate(syntaxnode: SyntaxNodeType<'statement_iteration'>):                           AST.STMT.StatementIteration;
	public decorate(syntaxnode: SyntaxNodeType<'statement_break'>):                               AST.STMT.StatementBreak;
	public decorate(syntaxnode: SyntaxNodeSupertype<'statement'>):                                AST.STMT.Statement;
	public decorate(syntaxnode: SyntaxNodeFamily<'block', ['break']>):                            AST.Block;
	public decorate(syntaxnode: SyntaxNodeType<'declaration_type'>):                              AST.STMT.DeclarationType;
	public decorate(syntaxnode: SyntaxNodeFamily<'declaration_variable', ['break']>):             AST.STMT.DeclarationVariable;
	public decorate(syntaxnode: SyntaxNodeSupertype<'declaration'>):                              AST.STMT.Declaration;
	public decorate(syntaxnode: SyntaxNodeType<'source_file'>):                                   AST.Goal;
	public decorate(syntaxnode: SyntaxNode):                                                      AST.AstNode;
	/* eslint-enable @typescript-eslint/unified-signatures */
	public decorate(syntaxnode: SyntaxNode): AST.AstNode {
		const decorators = new Map<string | RegExp, (node: SyntaxNode) => AST.AstNode>([
			['source_file', (node) => new AST.Goal(
				node as SyntaxNodeType<'source_file'>,
				node.firstNamedChild && this.decorateBlockNode(node.firstNamedChild as SyntaxNodeType<'block'>),
				this.config,
			)],

			/* # TERMINALS */
			['identifier', (node) => (
				(isSyntaxNodeSupertype(node.parent, 'type')       || isSyntaxNodeType(node.parent, /^(entry_type(__named)?(__optional)?|generic_arguments|declaration_(type|claim(__break)?))$/))                                                                                 ? new AST.TYPE.TypeAlias(node as SyntaxNodeType<'identifier'>) :
				(isSyntaxNodeSupertype(node.parent, 'expression') || isSyntaxNodeType(node.parent, /^(property(__break)?|case(__break)?|function_arguments|property_accessor(__break)?|assignee(__break)?|statement_expression|declaration_(variable|reassignment(__break)?))$/)) ? new AST.EXPR.Variable (node as SyntaxNodeType<'identifier'>) :
				assert.fail(`Expected ${ node.parent } to be a node that contains an identifier.`)
			)],

			/* # PRODUCTIONS */
			['keyword_type', (node) => new AST.TYPE.Constant(node as SyntaxNodeType<'keyword_type'>)],

			['word', (node) => new AST.Key(node as SyntaxNodeType<'word'>)],

			['primitive_literal', (node) => (
				(isSyntaxNodeSupertype(node.parent, 'type')       || isSyntaxNodeType(node.parent, /^(entry_type(__named)?(__optional)?|generic_arguments|declaration_(type|claim(__break)?))$/))                                                                                 ? new AST.TYPE.Constant(node as SyntaxNodeType<'primitive_literal'>) :
				(isSyntaxNodeSupertype(node.parent, 'expression') || isSyntaxNodeType(node.parent, /^(property(__break)?|case(__break)?|function_arguments|property_accessor(__break)?|assignee(__break)?|statement_expression|declaration_(variable|reassignment(__break)?))$/)) ? new AST.EXPR.Constant(node as SyntaxNodeType<'primitive_literal'>) :
				assert.fail(`Expected ${ node.parent } to be a node that contains a primitive literal.`)
			)],

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
					Decorator.ACCESSORS.get(node.children[1].text as Punctuator) as ValidTypeAccessOperator,
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
				Decorator.TYPEOPERATORS_UNARY.get(node.children[1].text as Punctuator)!,
				this.decorateTypeNode(node.firstNamedChild as SyntaxNodeSupertype<'type'>),
			)],

			['type_unary_keyword', (node) => new AST.TYPE.OperationUnary(
				node as SyntaxNodeType<'type_unary_keyword'>,
				Decorator.TYPEOPERATORS_UNARY.get(node.children[0].text as Keyword)!,
				this.decorateTypeNode(node.firstNamedChild as SyntaxNodeSupertype<'type'>),
			)],

			['type_intersection', (node) => new AST.TYPE.OperationBinary(
				node as SyntaxNodeType<'type_intersection'>,
				Decorator.TYPEOPERATORS_BINARY.get(node.children[1].text as Punctuator)!,
				this.decorateTypeNode(node.namedChild(0) as SyntaxNodeSupertype<'type'>),
				this.decorateTypeNode(node.namedChild(1) as SyntaxNodeSupertype<'type'>),
			)],

			['type_union', (node) => new AST.TYPE.OperationBinary(
				node as SyntaxNodeType<'type_union'>,
				Decorator.TYPEOPERATORS_BINARY.get(node.children[1].text as Punctuator)!,
				this.decorateTypeNode(node.namedChild(0) as SyntaxNodeSupertype<'type'>),
				this.decorateTypeNode(node.namedChild(1) as SyntaxNodeSupertype<'type'>),
			)],

			/* ## Expressions */
			[/^string_template(__break)?$/, (node) => new AST.EXPR.Template(
				node as SyntaxNodeFamily<'string_template', ['break']>,
				node.namedChildren.map((c) => ((isSyntaxNodeType(c, /^template_(full|head|middle|tail)$/))
					? new AST.EXPR.Constant(c as SyntaxNodeType<`template_${ 'full' | 'head' | 'middle' | 'tail' }`>)
					: this.decorateExprNode(c as SyntaxNodeSupertype<'expression'>)
				)),
			)],

			[/^property(__break)?$/, (node) => new AST.Property(
				node as SyntaxNodeFamily<'property', ['break']>,
				this.decorate(node.namedChild(0) as SyntaxNodeType<'word'>),
				this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
			)],

			[/^case(__break)?$/, (node) => new AST.Case(
				node as SyntaxNodeFamily<'case', ['break']>,
				this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
			)],

			[/^property_accessor(__break)?$/, (node) => (
				isSyntaxNodeType(node.firstNamedChild, /integer|natural/) ? new AST.Index(node.firstNamedChild as SyntaxNodeType<'integer' | 'natural'>) :
				isSyntaxNodeType(node.firstNamedChild, 'word')            ? this.decorate(node.firstNamedChild) :
				this.decorateExprNode(node.firstNamedChild as SyntaxNodeSupertype<'expression'>)
			)],

			[/^expression_grouped(__break)?$/, (node) => this.decorateExprNode(node.firstNamedChild as SyntaxNodeSupertype<'expression'>)],

			[/^expression_tuple_literal(__break)?$/, (node) => new AST.EXPR.Tuple(
				node as SyntaxNodeFamily<'expression_tuple_literal', ['break']>,
				node.namedChildren.map((c) => this.decorateExprNode(c as SyntaxNodeSupertype<'expression'>)),
			)],

			[/^expression_record_literal(__break)?$/, (node) => new AST.EXPR.Record(
				node as SyntaxNodeFamily<'expression_record_literal', ['break']>,
				node.namedChildren.map((c) => this.decorate(c as SyntaxNodeType<'property'>)) as NonemptyArray<AST.Property>,
			)],

			[/^expression_list_literal(__break)?$/, (node) => new AST.EXPR.List(
				node as SyntaxNodeFamily<'expression_list_literal', ['break']>,
				node.namedChildren.map((c) => this.decorateExprNode(c as SyntaxNodeSupertype<'expression'>)),
			)],

			[/^expression_dict_literal(__break)?$/, (node) => new AST.EXPR.Dict(
				node as SyntaxNodeFamily<'expression_dict_literal', ['break']>,
				node.namedChildren.map((c) => this.decorate(c as SyntaxNodeType<'property'>)) as NonemptyArray<AST.Property>,
			)],

			[/^expression_set_literal(__break)?$/, (node) => new AST.EXPR.Set(
				node as SyntaxNodeFamily<'expression_set_literal', ['break']>,
				node.namedChildren.map((c) => this.decorateExprNode(c as SyntaxNodeSupertype<'expression'>)),
			)],

			[/^expression_map_literal(__break)?$/, (node) => new AST.EXPR.Map(
				node as SyntaxNodeFamily<'expression_map_literal', ['break']>,
				node.namedChildren.map((c) => this.decorate(c as SyntaxNodeType<'case'>)) as NonemptyArray<AST.Case>,
			)],

			['expression_block', (node) => new AST.EXPR.ExpressionBlock(
				node as SyntaxNodeType<'expression_block'>,
				this.decorateBlockNode(node as SyntaxNodeFamily<'block', ['break']>),
			)],

			['expression_compound', (node) => {
				const expression_0        = node.childForFieldName('expression_0')        as SyntaxNodeSupertype<'expression'>;
				const property_accessor_0 = node.childForFieldName('property_accessor_0') as SyntaxNodeFamily<'property_accessor', ['break']> | null;
				return property_accessor_0 ? new AST.EXPR.Access(
					node as SyntaxNodeType<'expression_compound'>,
					Decorator.ACCESSORS.get(node.children[1].text as Punctuator)!,
					this.decorateExprNode(expression_0),
					this.decorate(property_accessor_0),
				) : new AST.EXPR.Call(
					node as SyntaxNodeType<'expression_compound'>,
					this.decorateExprNode(expression_0),
					node.childForFieldName('generic_arguments_0') ?.namedChildren.map((c) => this.decorateTypeNode(c as SyntaxNodeSupertype<'type'>)) ?? [],
					node.childForFieldName('function_arguments_0')!.namedChildren.map((c) => this.decorateExprNode(c as SyntaxNodeSupertype<'expression'>)),
				);
			}],

			['expression_unary_symbol', (node) => (node.children[0].text === Punctuator.AFF // `+a` is a no-op
				? this.decorateExprNode(node.firstNamedChild as SyntaxNodeSupertype<'expression'>)
				: new AST.EXPR.OperationUnary(
					node as SyntaxNodeType<'expression_unary_symbol'>,
					Decorator.OPERATORS_UNARY.get(node.children[0].text as Punctuator) as ValidOperatorUnary,
					this.decorateExprNode(node.firstNamedChild as SyntaxNodeSupertype<'expression'>),
				)
			)],

			['expression_unary_keyword', (node) => new AST.EXPR.OperationUnary(
				node as SyntaxNodeType<'expression_unary_symbol'>,
				Decorator.OPERATORS_UNARY.get(node.children[0].text as Keyword) as ValidOperatorUnary,
				this.decorateExprNode(node.firstNamedChild as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_cast', (node) => {
				const expression_0 = node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>;
				const expression_1 = node.childForFieldName('expression_1') as SyntaxNodeSupertype<'expression'> | null;
				return expression_1
					? new AST.EXPR.OperationBinaryCast(
						node as SyntaxNodeType<'expression_cast'>,
						Decorator.OPERATORS_BINARY.get(node.children[1].text as Keyword)! as ValidOperatorCast,
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
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_multiplicative', (node) => new AST.EXPR.OperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_multiplicative'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_additive', (node) => new AST.EXPR.OperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_additive'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_comparative', (node) => ((
				n:        SyntaxNodeType<'expression_comparative'>,
				operator: Operator,
				operands: readonly [AST.EXPR.Expression, AST.EXPR.Expression],
			) => (
				// `a !< b` is syntax sugar for `!(a < b)`
				(operator === Operator.NLT) ? new AST.EXPR.OperationUnary(
					n,
					Operator.NOT,
					new AST.EXPR.OperationBinaryComparative(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.LT,
						...operands,
					),
				) :
				// `a !> b` is syntax sugar for `!(a > b)`
				(operator === Operator.NGT) ? new AST.EXPR.OperationUnary(
					n,
					Operator.NOT,
					new AST.EXPR.OperationBinaryComparative(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.GT,
						...operands,
					),
				) :
				// `a !is b` is syntax sugar for `!(a is b)`
				(operator === Operator.ISNT) ? new AST.EXPR.OperationUnary(
					n,
					Operator.NOT,
					new AST.EXPR.OperationBinaryComparative(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.IS as ValidOperatorComparative, // TODO: make a new class for comparing object instances
						...operands,
					),
				) :
				new AST.EXPR.OperationBinaryComparative(
					n,
					operator as ValidOperatorComparative,
					...operands,
				)
			))(
				node as SyntaxNodeType<'expression_comparative'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
					this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
				],
			)],

			['expression_equality', (node) => ((
				n:        SyntaxNodeType<'expression_equality'>,
				operator: Operator,
				operands: readonly [AST.EXPR.Expression, AST.EXPR.Expression],
			) => (
				// `a !== b` is syntax sugar for `!(a === b)`
				(operator === Operator.NID) ? new AST.EXPR.OperationUnary(
					n,
					Operator.NOT,
					new AST.EXPR.OperationBinaryEquality(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.ID,
						...operands,
					),
				) :
				// `a != b` is syntax sugar for `!(a == b)`
				(operator === Operator.NEQ) ? new AST.EXPR.OperationUnary(
					n,
					Operator.NOT,
					new AST.EXPR.OperationBinaryEquality(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.EQ,
						...operands,
					),
				) :
				new AST.EXPR.OperationBinaryEquality(
					n,
					operator as ValidOperatorEquality,
					...operands,
				)
			))(
				node as SyntaxNodeType<'expression_equality'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
					this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
				],
			)],

			['expression_conjunctive', (node) => ((
				n:        SyntaxNodeType<'expression_conjunctive'>,
				operator: Operator,
				operands: readonly [AST.EXPR.Expression, AST.EXPR.Expression],
			) => (
				// `a !& b` is syntax sugar for `!(a && b)`
				(operator === Operator.NAND) ? new AST.EXPR.OperationUnary(
					n,
					Operator.NOT,
					new AST.EXPR.OperationBinaryLogical(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.AND,
						...operands,
					),
				) :
				new AST.EXPR.OperationBinaryLogical(
					n,
					operator as ValidOperatorLogical,
					...operands,
				)
			))(
				node as SyntaxNodeType<'expression_conjunctive'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
					this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
				],
			)],

			['expression_disjunctive', (node) => ((
				n:        SyntaxNodeType<'expression_disjunctive'>,
				operator: Operator,
				operands: readonly [AST.EXPR.Expression, AST.EXPR.Expression],
			) => (
				// `a !| b` is syntax sugar for `!(a || b)`
				(operator === Operator.NOR) ? new AST.EXPR.OperationUnary(
					n,
					Operator.NOT,
					new AST.EXPR.OperationBinaryLogical(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.OR,
						...operands,
					),
				) :
				new AST.EXPR.OperationBinaryLogical(
					n,
					operator as ValidOperatorLogical,
					...operands,
				)
			))(
				node as SyntaxNodeType<'expression_disjunctive'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
					this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
				],
			)],

			[/^expression_conditional(__break)?$/, (node) => new AST.EXPR.OperationTernary(
				node as SyntaxNodeFamily<'expression_conditional', ['break']>,
				Operator.COND,
				this.decorateExprNode(node.namedChild(0) as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
				this.decorateExprNode(node.namedChild(2) as SyntaxNodeSupertype<'expression'>),
			)],

			/* ## Statements */
			[/^assignee(__break)?$/, (node) => {
				const identifier_0 = node.childForFieldName('identifier_0') as SyntaxNodeType<'identifier'> | null;
				return identifier_0
					? new AST.EXPR.Variable(identifier_0)
					: new AST.EXPR.Access(
						node as SyntaxNodeFamily<'assignee', ['break']>,
						Operator.DOT,
						this.decorateExprNode(node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>),
						this.decorate(node.childForFieldName('property_accessor_0') as SyntaxNodeFamily<'property_accessor', ['break']>),
					);
			}],

			[/^statement_expression(__break)?$/, (node) => new AST.STMT.StatementExpression(
				node as SyntaxNodeFamily<'statement_expression', ['break']>,
				node.firstNamedChild ? this.decorateExprNode(node.firstNamedChild as SyntaxNodeSupertype<'expression'>) : undefined,
			)],

			[/^statement_claim(__break)?$/, (node) => new AST.STMT.StatementClaim(
				node as SyntaxNodeFamily<'statement_claim', ['break']>,
				this.decorate(node.namedChild(0) as SyntaxNodeFamily<'assignee', ['break']>),
				this.decorateTypeNode(node.namedChild(1) as SyntaxNodeSupertype<'type'>),
			)],

			[/^statement_reassignment(__break)?$/, (node) => new AST.STMT.StatementReassignment(
				node as SyntaxNodeFamily<'statement_reassignment', ['break']>,
				this.decorate(node.namedChild(0) as SyntaxNodeFamily<'assignee', ['break']>),
				this.decorateExprNode(node.namedChild(1) as SyntaxNodeSupertype<'expression'>),
			)],

			[/^statement_conditional(__break)?$/, (node) => {
				const block_1                 = node.childForFieldName('block_1')                 as SyntaxNodeFamily<'block', ['break']>                 | null;
				const statement_conditional_0 = node.childForFieldName('statement_conditional_0') as SyntaxNodeFamily<'statement_conditional', ['break']> | null;
				return new AST.STMT.StatementConditional(
					node as SyntaxNodeFamily<'statement_conditional', ['break']>,
					false,
					this.decorateExprNode(node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>),
					this.decorate(node.childForFieldName('block_0') as SyntaxNodeFamily<'block', ['break']>),
					block_1 ? this.decorate(block_1) : statement_conditional_0 ? this.decorate(statement_conditional_0) : undefined,
				);
			}],

			[/^statement_conditional__unless(__break)?$/, (node) => new AST.STMT.StatementConditional(
				node as SyntaxNodeFamily<'statement_conditional__unless', ['break']>,
				true,
				this.decorateExprNode(node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>),
				this.decorate(node.childForFieldName('block_0') as SyntaxNodeFamily<'block', ['break']>),
			)],

			['statement_loop', (node) => {
				const expression_0 = node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>;
				const block_0      = node.childForFieldName('block_0')      as SyntaxNodeType<'block__break'>;
				return node.children[0].text === Keyword.DO ? new AST.STMT.StatementLoop(
					// we have `"do" Block ("while" | "until") Expression ";"` (bottom-tested)
					node as SyntaxNodeType<'statement_loop'>,
					true,
					node.children[2].text === Keyword.UNTIL,
					this.decorateExprNode(expression_0),
					this.decorate(block_0),
				) : new AST.STMT.StatementLoop(
					// we have `("while" | "until") Expression "do" Block ";"` (top-tested)
					node as SyntaxNodeType<'statement_loop'>,
					false,
					node.children[0].text === Keyword.UNTIL,
					this.decorateExprNode(expression_0),
					this.decorate(block_0),
				);
			}],

			['statement_iteration', (node) => {
				const identifier_0 = node.childForFieldName('identifier_0') as SyntaxNodeType<'identifier'> | null;
				return new AST.STMT.StatementIteration(
					node as SyntaxNodeType<'statement_iteration'>,
					identifier_0 && new AST.EXPR.Variable(identifier_0),
					this.decorateTypeNode(node.childForFieldName('type_0')       as SyntaxNodeSupertype<'type'>),
					this.decorateExprNode(node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'>),
					this.decorate(node.childForFieldName('block_0')              as SyntaxNodeType<'block__break'>),
				);
			}],

			['statement_break', (node) => new AST.STMT.StatementBreak(
				node as SyntaxNodeType<'statement_break'>,
				node.children[0].text === Keyword.SKIP,
			)],

			[/^block(__break)?$/, (node) => this.decorateBlockNode(node as SyntaxNodeFamily<'block', ['break']>)],

			['declaration_type', (node) => {
				const identifier_0 = node.childForFieldName('identifier_0') as SyntaxNodeType<'identifier'> | null;
				return new AST.STMT.DeclarationType(
					node as SyntaxNodeType<'declaration_type'>,
					identifier_0 && new AST.TYPE.TypeAlias(identifier_0),
					this.decorateTypeNode(node.childForFieldName('type_0') as SyntaxNodeSupertype<'type'>),
				);
			}],

			[/^declaration_variable(__break)?$/, (node) => {
				const identifier_0 = node.childForFieldName('identifier_0') as SyntaxNodeType<'identifier'>      | null;
				const type_0       = node.childForFieldName('type_0')       as SyntaxNodeSupertype<'type'>       | null;
				const expression_0 = node.childForFieldName('expression_0') as SyntaxNodeSupertype<'expression'> | null;
				return new AST.STMT.DeclarationVariable(
					node as SyntaxNodeFamily<'declaration_variable', ['break']>,
					node.children[1].text === Keyword.MUTABLE,
					identifier_0 && new AST.EXPR.Variable(identifier_0),
					type_0       && this.decorateTypeNode(type_0),
					expression_0 && this.decorateExprNode(expression_0),
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

	private decorateTypeNode(typenode: SyntaxNodeSupertype<'type'>): AST.TYPE.Type {
		return (
			(isSyntaxNodeType(typenode, 'identifier'))        ? new AST.TYPE.TypeAlias (typenode) :
			(isSyntaxNodeType(typenode, 'primitive_literal')) ? new AST.TYPE.Constant  (typenode) :
			this.decorate(typenode)
		);
	}

	private decorateExprNode(exprnode: SyntaxNodeSupertype<'expression'>): AST.EXPR.Expression {
		return (
			(isSyntaxNodeType(exprnode, 'identifier'))        ? new AST.EXPR.Variable(exprnode) :
			(isSyntaxNodeType(exprnode, 'primitive_literal')) ? new AST.EXPR.Constant(exprnode) :
			this.decorate(exprnode)
		);
	}

	private decorateBlockNode(blocknode: SyntaxNodeFamily<'block', ['break']>): AST.Block {
		return new AST.Block(
			blocknode,
			blocknode.namedChildren.map((c) => this.decorate(c as SyntaxNodeSupertype<'statement'>)) as NonemptyArray<AST.STMT.Statement>,
			this.config,
		);
	}
}

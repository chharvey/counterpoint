import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	Query,
	type QueryCapture,
	type SyntaxNode,
} from 'tree-sitter';
import Counterpoint from 'tree-sitter-counterpoint';
import {
	type ConstructorType,
	assert_instanceof,
	TS_PARSER,
	Decorator,
	AST,
} from '../../src/index.ts';
import type {SyntaxNodeType} from '../../src/validator/utils-private.ts';



test.suite('Decorator', () => {
	test.suite('#decorate', () => {
		function captureParseNode(source: string, query: string): SyntaxNode {
			const captures: QueryCapture[] = new Query(Counterpoint, `${ query } @capt`).captures(TS_PARSER.parse(source).rootNode);
			assert.ok(captures.length, 'could not find any captures.');
			return captures[0].node;
		}
		new Map<string, readonly [ConstructorType<AST.AstNode>, string]>([
			['Decorate(Word ::= _KEYWORD_OTHER) -> SemanticKey', [AST.Key, `
				{
					(mut= 42);
				}
				% (word "mut")
			`]],
			['Decorate(Word ::= IDENTIFIER) -> SemanticKey', [AST.Key, `
				{
					(foobar= 42);
				}
				% (word (identifier))
			`]],
			['Decorate(Word ::= KeywordType) -> SemanticKey', [AST.Key, `
				{
					(bool= 42);
				}
				% (word (keyword_type))
			`]],
			['Decorate(Word ::= KeywordValue) -> SemanticKey', [AST.Key, `
				{
					(true= 42);
				}
				% (word (keyword_value))
			`]],

			['Decorate(Type > PrimitiveLiteral ::= INTEGER) -> SemanticTypeConstant', [AST.TYPE.Constant, `
				{
					type T = 42;
				}
				% (primitive_literal (integer))
			`]],
			['Decorate(Type > PrimitiveLiteral ::= NATURAL) -> SemanticTypeConstant', [AST.TYPE.Constant, `
				{
					type T = +42;
				}
				% (primitive_literal (natural))
			`]],
			['Decorate(Type > PrimitiveLiteral ::= FLOAT) -> SemanticTypeConstant', [AST.TYPE.Constant, `
				{
					type T = 42.69;
				}
				% (primitive_literal (float))
			`]],
			['Decorate(Type > PrimitiveLiteral ::= STRING) -> SemanticTypeConstant', [AST.TYPE.Constant, `
				{
					type T = "hello";
				}
				% (primitive_literal (string))
			`]],
			['Decorate(Type > PrimitiveLiteral ::= KeywordValue) -> SemanticTypeConstant', [AST.TYPE.Constant, `
				{
					type T = false;
				}
				% (primitive_literal (keyword_value))
			`]],
			['Decorate(Type > PrimitiveLiteral ::= "@" Word) -> SemanticTypeConstant', [AST.TYPE.Constant, `
				{
					type T = @hello;
				}
				% (primitive_literal (word (identifier)))
			`]],

			['Decorate(Expression > PrimitiveLiteral ::= INTEGER) -> SemanticExpressionConstant', [AST.EXPR.Constant, `
				{
					42;
				}
				% (primitive_literal (integer))
			`]],
			['Decorate(Expression > PrimitiveLiteral ::= NATURAL) -> SemanticExpressionConstant', [AST.EXPR.Constant, `
				{
					+42;
				}
				% (primitive_literal (natural))
			`]],
			['Decorate(Expression > PrimitiveLiteral ::= FLOAT) -> SemanticExpressionConstant', [AST.EXPR.Constant, `
				{
					42.69;
				}
				% (primitive_literal (float))
			`]],
			['Decorate(Expression > PrimitiveLiteral ::= STRING) -> SemanticExpressionConstant', [AST.EXPR.Constant, `
				{
					"hello";
				}
				% (primitive_literal (string))
			`]],
			['Decorate(Expression > PrimitiveLiteral ::= KeywordValue) -> SemanticExpressionConstant', [AST.EXPR.Constant, `
				{
					false;
				}
				% (primitive_literal (keyword_value))
			`]],
			['Decorate(Expression > PrimitiveLiteral ::= "@" Word) -> SemanticExpressionConstant', [AST.EXPR.Constant, `
				{
					@hello;
				}
				% (primitive_literal (word (identifier)))
			`]],

			/* ## Types */
			['Decorate(EntryType<-Named><-Optional> ::= Type) -> SemanticItemType', [AST.ItemType, `
				{
					type T = (int,);
				}
				% (entry_type)
			`]],
			['Decorate(EntryType<-Named><+Optional> ::= "?:" Type) -> SemanticItemType', [AST.ItemType, `
				{
					type T = (?: int);
				}
				% (entry_type__optional)
			`]],
			['Decorate(EntryType<+Named><-Optional> ::= Word ":" Type) -> SemanticPropertyType', [AST.PropertyType, `
				{
					type T = (a: int);
				}
				% (entry_type__named)
			`]],
			['Decorate(EntryType<+Named><+Optional> ::= Word "?:" Type) -> SemanticPropertyType', [AST.PropertyType, `
				{
					type T = (a?: int);
				}
				% (entry_type__named__optional)
			`]],
			['Decorate(EntryType<+Named><-Optional> ::= Word ":" Type) -> SemanticPropertyType', [AST.PropertyType, `
				{
					type T = (_: int);
				}
				% (entry_type__named)
			`]],
			['Decorate(EntryType<+Named><+Optional> ::= Word "?:" Type) -> SemanticPropertyType', [AST.PropertyType, `
				{
					type T = (_?: int);
				}
				% (entry_type__named__optional)
			`]],

			['Decorate(PropertyAccessorType ::= INTEGER) -> SemanticIndex', [AST.Index, `
				{
					type T = U.1;
				}
				% (property_accessor_type)
			`]],
			['Decorate(PropertyAccessorType ::= NATURAL) -> SemanticIndex', [AST.Index, `
				{
					type T = U.+1;
				}
				% (property_accessor_type)
			`]],
			['Decorate(PropertyAccessorType ::= Word) -> SemanticKey', [AST.Key, `
				{
					type T = U.p;
				}
				% (property_accessor_type)
			`]],

			['Decorate(TypeGrouped ::= "(" Type ")") -> SemanticType', [AST.TYPE.Type, `
				{
					type T = (3 | float);
				}
				% (type_grouped)
			`]],

			['Decorate(TypeTupleLiteral ::= "(" ")") -> SemanticTypeTuple', [AST.TYPE.Tuple, `
				{
					type T = ();
				}
				% (type_tuple_literal)
			`]],
			['Decorate(TypeTupleLiteral ::= "(" ItemsType ")") -> SemanticTypeTuple', [AST.TYPE.Tuple, `
				{
					type T = (int, ?: float);
				}
				% (type_tuple_literal)
			`]],

			['Decorate(TypeRecordLiteral ::= "(" PropertiesType ")") -> SemanticTypeRecord', [AST.TYPE.Record, `
				{
					type T = (a?: int, b: float);
				}
				% (type_record_literal)
			`]],

			['Decorate(TypeListLiteral ::= "[" Type "]") -> SemanticTypeList', [AST.TYPE.List, `
				{
					type T = [int];
				}
				% (type_list_literal)
			`]],

			['Decorate(TypeDictLiteral ::= "[" ":" Type "]") -> SemanticTypeDict', [AST.TYPE.Dict, `
				{
					type T = [:int];
				}
				% (type_dict_literal)
			`]],

			['Decorate(TypeSetLiteral ::= "{" Type "}") -> SemanticTypeSet', [AST.TYPE.Set, `
				{
					type T = {int};
				}
				% (type_set_literal)
			`]],

			['Decorate(TypeMapLiteral ::= "{" Type__0 "->" Type__1 "}") -> SemanticTypeMap', [AST.TYPE.Map, `
				{
					type T = {int -> float};
				}
				% (type_map_literal)
			`]],

			['Decorate(TypeCompound ::= TypeCompound "." PropertyAccessorType) -> SemanticTypeAccess', [AST.TYPE.Access, `
				{
					type T = U.p;
				}
				% (type_compound)
			`]],
			['Decorate(TypeCompound ::= TypeCompound "?." PropertyAccessorType) -> SemanticTypeAccess', [AST.TYPE.Access, `
				{
					type T = U?.p;
				}
				% (type_compound)
			`]],
			['Decorate(TypeCompound ::= TypeCompound "." GenericArguments) -> SemanticTypeCall', [AST.TYPE.Call, `
				{
					type T = List.<U>;
				}
				% (type_compound)
			`]],

			['Decorate(TypeUnarySymbol ::= TypeUnarySymbol "?") -> SemanticTypeOperation', [AST.TYPE.Operation, `
				{
					type T = U?;
				}
				% (type_unary_symbol)
			`]],
			['expectFailure: Decorate(TypeUnarySymbol ::= TypeUnarySymbol "!") -> SemanticTypeOperation', [AST.TYPE.Operation, `
				{
					type T = U!;
				}
				% (type_unary_symbol)
			`]],

			['Decorate(TypeUnaryKeyword ::= "mut" TypeUnaryKeyword) -> SemanticTypeOperation', [AST.TYPE.Operation, `
				{
					type T = mut U;
				}
				% (type_unary_keyword)
			`]],

			['Decorate(TypeIntersection ::= TypeIntersection "&" TypeUnaryKeyword) -> SemanticTypeOperation', [AST.TYPE.Operation, `
				{
					type T = U & V;
				}
				% (type_intersection)
			`]],

			['Decorate(TypeUnion ::= TypeUnion "|" TypeIntersection) -> SemanticTypeOperation', [AST.TYPE.Operation, `
				{
					type T = U | V;
				}
				% (type_union)
			`]],

			['Decorate(TypeFunction ::= "\\" "(" ")" "=>" "void") -> SemanticType', [AST.TYPE.Function, `
				{
					type T = \\() => void;
				}
				% (type_function)
			`]],

			['Decorate(TypeFunction ::= "\\" "(" ParametersType ")" "=>" "void") -> SemanticType', [AST.TYPE.Function, `
				{
					type T = \\(A, b: B, c: \\() => void) => void;
				}
				% (type_function)
			`]],

			/* ## Expressions */
			['Decorate(StringTemplate<Break, Return> ::= TEMPLATE_FULL) -> SemanticExpressionTemplate', [AST.EXPR.Template, `
				{
					"""full1""";
				}
				% (string_template)
			`]],
			['Decorate(StringTemplate<Break, Return> ::= TEMPLATE_HEAD Expression<+Block><?Break><?Return>? (TEMPLATE_MIDDLE Expression<+Block><?Break><?Return>?)* TEMPLATE_TAIL) -> SemanticExpressionTemplate', [AST.EXPR.Template, `
				{
					"""hello {{ "to" }} the {{ "whole" }} great {{ "big" }} world""";
				}
				% (string_template)
			`]],
			['Decorate(StringTemplate<Break, Return> ::= TEMPLATE_HEAD Expression<+Block><?Break><?Return>? (TEMPLATE_MIDDLE Expression<+Block><?Break><?Return>?)* TEMPLATE_TAIL) -> SemanticExpressionTemplate', [AST.EXPR.Template, `
				{
					"""hello {{ """to {{ """the {{ "whole" }} great""" }} big""" }} world""";
				}
				% (string_template)
			`]],

			['Decorate(Property<Break, Return> ::= Word "=" Expression<+Block><?Break><?Return>) -> SemanticProperty', [AST.Property, `
				{
					(a= 42);
				}
				% (property)
			`]],
			['Decorate(Property<Break, Return> ::= Word "=" Expression<+Block><?Break><?Return>) -> SemanticProperty', [AST.Property, `
				{
					(_= 42);
				}
				% (property)
			`]],

			['Decorate(CaseMap<Break, Return> ::= Expression<+Block><?Break><?Return> "->" Expression<+Block><?Break><?Return>) -> SemanticCase', [AST.Case, `
				{
					{42 -> 6.9};
				}
				% (case_map)
			`]],

			['Decorate(CaseSwitch<Break> ::= "case" Expression__0<+Block><?Break> "->" Expression__1<+Block><?Break>) -> SemanticCase', [AST.Case, `
				{
					switch a case b -> g default z;
				}
				% (case_switch)
			`]],

			['Decorate(CaseSwitch<Break> ::= "case" (Expression__0<+Block><?Break> "|")+ Expression__1<+Block><?Break> "->" Expression__2<+Block><?Break>) -> SemanticCase', [AST.Case, `
				{
					switch a case b | c | d -> g default z;
				}
				% (case_switch)
			`]],

			['Decorate(ExpressionCompound<Block, Break, Return> > PropertyAccessor<Break, Return> ::= INTEGER) -> SemanticIndex', [AST.Index, `
				{
					v.1;
				}
				% (property_accessor)
			`]],
			['Decorate(ExpressionCompound<Block, Break, Return> > PropertyAccessor<Break, Return> ::= NATURAL) -> SemanticIndex', [AST.Index, `
				{
					v.+1;
				}
				% (property_accessor)
			`]],
			['Decorate(ExpressionCompound<Block, Break, Return> > PropertyAccessor<Break, Return> ::= Word) -> SemanticKey', [AST.Key, `
				{
					v.p;
				}
				% (property_accessor)
			`]],
			['Decorate(ExpressionCompound<Block, Break, Return> > PropertyAccessor<Break, Return> ::= "[" Expression<+Block><?Break><?Return> "]") -> SemanticExpression', [AST.EXPR.Expression, `
				{
					v.[a + b];
				}
				% (property_accessor)
			`]],

			['Decorate(Assignee<Break, Return> > PropertyAccessor<Break, Return> ::= INTEGER) -> SemanticIndex', [AST.Index, `
				{
					set v.1 = false;
				}
				% (property_accessor)
			`]],
			['Decorate(Assignee<Break, Return> > PropertyAccessor<Break, Return> ::= NATURAL) -> SemanticIndex', [AST.Index, `
				{
					set v.-1 = false;
				}
				% (property_accessor)
			`]],
			['Decorate(Assignee<Break, Return> > PropertyAccessor<Break, Return> ::= Word) -> SemanticKey', [AST.Key, `
				{
					set v.p = false;
				}
				% (property_accessor)
			`]],
			['Decorate(Assignee<Break, Return> > PropertyAccessor<Break, Return> ::= "[" Expression<+Block><?Break><?Return> "]") -> SemanticExpression', [AST.EXPR.Expression, `
				{
					set v.[a + b] = false;
				}
				% (property_accessor)
			`]],

			['Decorate(ExpressionGrouped<Break, Return> ::= "(" Expression<+Block><?Break><?Return> ")") -> SemanticExpression', [AST.EXPR.Expression, `
				{
					(42 || 6.9);
				}
				% (expression_grouped)
			`]],

			['Decorate(ExpressionTupleLiteral<Break> ::= "(" ")") -> SemanticExpressionTuple', [AST.EXPR.Tuple, `
				{
					();
				}
				% (expression_tuple_literal)
			`]],
			['Decorate(ExpressionTupleLiteral<Break, Return> ::= "(" Items<?Break><?Return> ")") -> SemanticExpressionTuple', [AST.EXPR.Tuple, `
				{
					(42, 6.9);
				}
				% (expression_tuple_literal)
			`]],

			['Decorate(ExpressionRecordLiteral<Break, Return> ::= "(" ","? Property<?Break><?Return># ","? ")") -> SemanticExpressionRecord', [AST.EXPR.Record, `
				{
					(a= 42, b= 6.9);
				}
				% (expression_record_literal)
			`]],

			['Decorate(ExpressionListLiteral<Break, Return> ::= "[" "]") -> SemanticExpressionList', [AST.EXPR.List, `
				{
					[];
				}
				% (expression_list_literal)
			`]],
			['Decorate(ExpressionListLiteral<Break, Return> ::= "[" (","? Expression<+Block><?Break><?Return># ","?)? "]") -> SemanticExpressionList', [AST.EXPR.List, `
				{
					[42, 6.9];
				}
				% (expression_list_literal)
			`]],

			['Decorate(ExpressionDictLiteral<Break, Return> ::= [" ","? Property<?Break><?Return># ","? "]") -> SemanticExpressionDict', [AST.EXPR.Dict, `
				{
					[a= 42, b= 6.9];
				}
				% (expression_dict_literal)
			`]],

			['Decorate(ExpressionSetLiteral<Break, Return> ::= "{" "}") -> SemanticExpressionSet', [AST.EXPR.Set, `
				{
					{};
				}
				% (expression_set_literal)
			`]],
			['Decorate(ExpressionSetLiteral<Break, Return> ::= "{" (","? Expression<+Block><?Break><?Return># ","?)? "}") -> SemanticExpressionSet', [AST.EXPR.Set, `
				{
					{42, 6.9};
				}
				% (expression_set_literal)
			`]],

			['Decorate(ExpressionMapLiteral<Break, Return> ::= "{" ","? CaseMap<?Break><?Return># ","? "}") -> SemanticExpressionMap', [AST.EXPR.Map, `
				{
					{42 -> 6.9, "hello" -> true};
				}
				% (expression_map_literal)
			`]],

			['Decorate(ExpressionUnit<Block, Break, Return> ::= Block<?Break><?Return>) -> SemanticExpressionBlock', [AST.EXPR.ExpressionBlock, `
				{
					type T = U;
					val a: T = b;
					claim a: U;
					set a = b;
					a;
					{
						b;
					};
				}
				% (expression_block)
			`]],

			['Decorate(ExpressionCompound<Block, Break, Return> ::= ExpressionCompound<?Block><?Break><?Return> "~?") -> SemanticExpressionAccess', [AST.EXPR.OperationUnary, `
				{
					v~?;
				}
				% (expression_compound)
			`]],
			['Decorate(ExpressionCompound<Block, Break, Return> ::= ExpressionCompound<?Block><?Break><?Return> "~!") -> SemanticExpressionAccess', [AST.EXPR.OperationUnary, `
				{
					v~!;
				}
				% (expression_compound)
			`]],
			['Decorate(ExpressionCompound<Block, Break, Return> ::= ExpressionCompound<?Block><?Break><?Return> "." PropertyAccessor<?Break><?Return>) -> SemanticExpressionAccess', [AST.EXPR.Access, `
				{
					v.p;
				}
				% (expression_compound)
			`]],
			['Decorate(ExpressionCompound<Block, Break, Return> ::= ExpressionCompound<?Block><?Break><?Return> "?." PropertyAccessor<?Break><?Return>) -> SemanticExpressionAccess', [AST.EXPR.Access, `
				{
					v?.p;
				}
				% (expression_compound)
			`]],
			['expectFailure: Decorate(ExpressionCompound<Block, Break, Return> ::= ExpressionCompound<?Block><?Break><?Return> "!." PropertyAccessor<?Break><?Return>) -> SemanticExpressionAccess', [AST.EXPR.Access, `
				{
					v!.p;
				}
				% (expression_compound)
			`]],
			['Decorate(ExpressionCompound<Block, Break, Return> ::= ExpressionCompound<?Block><?Break><?Return> "." FunctionArguments<?Break><?Return>) -> SemanticExpressionCall', [AST.EXPR.Call, `
				{
					List.();
				}
				% (expression_compound)
			`]],
			['Decorate(ExpressionCompound<Block, Break, Return> ::= ExpressionCompound<?Block><?Break><?Return> "." GenericArguments FunctionArguments<?Break><?Return>) -> SemanticExpressionCall', [AST.EXPR.Call, `
				{
					List.<T>();
				}
				% (expression_compound)
			`]],

			['Decorate(ExpressionUnarySymbol<Block, Break, Return> ::= "!" ExpressionUnarySymbol<?Block><?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					!v;
				}
				% (expression_unary_symbol)
			`]],
			['Decorate(ExpressionUnarySymbol<Block, Break, Return> ::= "?" ExpressionUnarySymbol<?Block><?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					?v;
				}
				% (expression_unary_symbol)
			`]],
			// `+v` is a no-op
			['Decorate(ExpressionUnarySymbol<Block, Break, Return> ::= "+" ExpressionUnarySymbol<?Block><?Break><?Return>) -> SemanticExpression', [AST.EXPR.Expression, `
				{
					+v;
				}
				% (expression_unary_symbol)
			`]],
			['Decorate(ExpressionUnarySymbol<Block, Break, Return> ::= "-" ExpressionUnarySymbol<?Block><?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					-v;
				}
				% (expression_unary_symbol)
			`]],

			['Decorate(ExpressionUnaryKeyword<Block, Break, Return> ::= "isset" Assignee<?Break><?Return>) -> SemanticExpressionIsset', [AST.EXPR.Isset, `
				{
					isset v;
				}
				% (expression_unary_keyword)
			`]],
			['Decorate(ExpressionUnaryKeyword<Block, Break, Return> ::= "!isset" Assignee<?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					!isset v;
				}
				% (expression_unary_keyword)
			`]],

			['Decorate(ExpressionCast<Block, Break, Return> ::= ExpressionCast<?Block><?Break><?Return> "as" ExpressionUnaryKeyword<?Block><?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					a as Klass;
				}
				% (expression_cast)
			`]],
			['Decorate(ExpressionCast<Block, Break, Return> ::= ExpressionCast<?Block><?Break><?Return> "as?" ExpressionUnaryKeyword<?Block><?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					a as? Klass;
				}
				% (expression_cast)
			`]],
			['Decorate(ExpressionCast<Block, Break, Return> ::= ExpressionCast<?Block><?Break><?Return> "as!" ExpressionUnaryKeyword<?Block><?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					a as! Klass;
				}
				% (expression_cast)
			`]],
			['Decorate(ExpressionCast<Block, Break, Return> ::= ExpressionCast<?Block><?Break><?Return> "as" "<" Type ">") -> SemanticExpressionClaim', [AST.EXPR.Claim, `
				{
					a as <T>;
				}
				% (expression_cast)
			`]],

			['Decorate(ExpressionExponential<Block, Break, Return> ::= ExpressionCast<?Block><?Break><?Return> "^" ExpressionExponential<?Block><?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					a ^ b;
				}
				% (expression_exponential)
			`]],

			['Decorate(ExpressionMultiplicative<Block, Break, Return> ::= ExpressionMultiplicative<?Block><?Break><?Return> "*" ExpressionExponential<?Block><?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					a * b;
				}
				% (expression_multiplicative)
			`]],
			['Decorate(ExpressionMultiplicative<Block, Break, Return> ::= ExpressionMultiplicative<?Block><?Break><?Return> "/" ExpressionExponential<?Block><?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					a / b;
				}
				% (expression_multiplicative)
			`]],

			['Decorate(ExpressionAdditive<Block, Break, Return> ::= ExpressionAdditive<?Block><?Break><?Return> "+" ExpressionMultiplicative<?Block><?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					a + b;
				}
				% (expression_additive)
			`]],
			['Decorate(ExpressionAdditive<Block, Break, Return> ::= ExpressionAdditive<?Block><?Break><?Return> "-" ExpressionMultiplicative<?Block><?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					a - b;
				}
				% (expression_additive)
			`]],

			...['<', '>', '<=', '>=', '!<', '!>', 'is', '!is'].map((op) => [`${ ['is', '!is'].includes(op) ? 'expectFailure: ' : '' }Decorate(ExpressionComparative<Block, Break, Return> ::= ExpressionComparative<?Block><?Break><?Return> "${ op }" ExpressionAdditive<?Block><?Break><?Return>) -> SemanticExpressionOperation`, [AST.EXPR.Operation, `
				{
					a ${ op } b;
				}
				% (expression_comparative)
			`]] as const),

			...['===', '!==', '==', '!='].map((op) => [`Decorate(ExpressionEquality<Block, Break, Return> ::= ExpressionEquality<?Block><?Break><?Return> "${ op }" ExpressionComparative<?Block><?Break><?Return>) -> SemanticExpressionOperation`, [AST.EXPR.Operation, `
				{
					a ${ op } b;
				}
				% (expression_equality)
			`]] as const),

			['Decorate(ExpressionConjunctive<Block, Break, Return> ::= ExpressionConjunctive<?Block><?Break><?Return> "&&" ExpressionEquality<?Block><?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					a && b;
				}
				% (expression_conjunctive)
			`]],
			['Decorate(ExpressionConjunctive<Block, Break, Return> ::= ExpressionConjunctive<?Block><?Break><?Return> "!&" ExpressionEquality<?Block><?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					a !& b;
				}
				% (expression_conjunctive)
			`]],

			['Decorate(ExpressionDisjunctive<Block, Break, Return> ::= ExpressionDisjunctive<?Block><?Break><?Return> "||" ExpressionConjunctive<?Block><?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					a || b;
				}
				% (expression_disjunctive)
			`]],
			['Decorate(ExpressionDisjunctive<Block, Break, Return> ::= ExpressionDisjunctive<?Block><?Break><?Return> "!|" ExpressionConjunctive<?Block><?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					a !| b;
				}
				% (expression_disjunctive)
			`]],

			['Decorate(ExpressionConditional<Break, Return> ::= "if" Expression__0<+Block><?Break><?Return> "then" Expression__1<-Block><?Break><?Return> "else" Expression__2<-Block><?Break><?Return>) -> SemanticExpressionOperation', [AST.EXPR.Operation, `
				{
					if a then b else c;
				}
				% (expression_conditional)
			`]],

			['Decorate(ExpressionSwitch<Break, Return> ::= "switch" Expression__0<+Block><?Break><?Return> "default" Expression__1<+Block><?Break><?Return>) -> SemanticExpressionSwitch', [AST.EXPR.Switch, `
				{
					switch a default z;
				}
				% (expression_switch)
			`]],

			['Decorate(ExpressionSwitch<Break, Return> ::= "switch" Expression__0<+Block><?Break><?Return> CaseSwitch<?Break><?Return>+ "default" Expression__1<+Block><?Break><?Return>) -> SemanticExpressionSwitch', [AST.EXPR.Switch, `
				{
					switch a case b | c -> d case e | f -> g default z;
				}
				% (expression_switch)
			`]],

			['Decorate(ExpressionFunction ::= "\\" "(" ")" ":" "void" Block<-Break><+Return>) -> SemanticExpressionFunction', [AST.EXPR.Function, `
				{
					\\(): void {;};
				}
				% (expression_function)
			`]],
			['Decorate(ExpressionFunction ::= "\\" "(" ParametersFunction ")" ":" "void" Block<-Break><+Return>) -> SemanticExpressionFunction', [AST.EXPR.Function, `
				{
					\\(a: A, $b: B, c= charlie: C): void { return; };
				}
				% (expression_function)
			`]],

			/* ## Statements */
			['Decorate(Assignee<Break, Return> ::= IDENTIFIER) -> SemanticExpressionVariable', [AST.EXPR.Variable, `
				{
					claim v: int;
				}
				% (assignee)
			`]],
			['Decorate(Assignee<Break, Return> ::= IDENTIFIER) -> SemanticExpressionVariable', [AST.EXPR.Variable, `
				{
					set v = 42;
				}
				% (assignee)
			`]],
			['Decorate(Assignee<Break, Return> ::= IDENTIFIER) -> SemanticExpressionVariable', [AST.EXPR.Variable, `
				{
					delete v;
				}
				% (assignee)
			`]],
			['Decorate(Assignee<Break, Return> ::= ExpressionCompound<+Block><?Break><?Return> "." PropertyAccessor<?Break><?Return>) -> SemanticExpressionAccess', [AST.EXPR.Access, `
				{
					claim v.1: int;
				}
				% (assignee)
			`]],
			['Decorate(Assignee<Break, Return> ::= ExpressionCompound<+Block><?Break><?Return> "." PropertyAccessor<?Break><?Return>) -> SemanticExpressionAccess', [AST.EXPR.Access, `
				{
					set v.1 = 42;
				}
				% (assignee)
			`]],
			['Decorate(Assignee<Break, Return> ::= ExpressionCompound<+Block><?Break><?Return> "." PropertyAccessor<?Break><?Return>) -> SemanticExpressionAccess', [AST.EXPR.Access, `
				{
					delete v.1;
				}
				% (assignee)
			`]],

			['Decorate(StatementExpression<Break, Return> ::= Expression<+Block><?Break><?Return> ";") -> SemanticStatementExpression', [AST.STMT.StatementExpression, `
				{
					a;
				}
				% (statement_expression)
			`]],

			['Decorate(StatementClaim<Break, Return> ::= "claim" Assignee<?Break><?Return> ":" Type ";") -> SemanticStatementClaim', [AST.STMT.StatementClaim, `
				{
					claim a: T;
				}
				% (statement_claim)
			`]],

			['Decorate(StatementSet<Break, Return> ::= "set" Assignee<?Break><?Return> "=" Expression<+Block><?Break><?Return> ";") -> SemanticStatementReassignment', [AST.STMT.StatementReassignment, `
				{
					set a = b;
				}
				% (statement_set)
			`]],

			['Decorate(StatementDelete<Break, Return> ::= "delete" Assignee<?Break><?Return> ";") -> SemanticStatementReassignment', [AST.STMT.StatementReassignment, `
				{
					delete a;
				}
				% (statement_delete)
			`]],

			['Decorate(StatementConditional<Unless, Break, Return> ::= "if" Expression<+Block><?Break><?Return> "then" Block<?Break><?Return> ";") -> SemanticStatementConditional', [AST.STMT.StatementConditional, `
				{
					if condition then { consequent; };
				}
				% (statement_conditional)
			`]],
			['Decorate(StatementConditional<Unless, Break, Return> ::= "if" Expression<+Block><?Break><?Return> "then" Block__0<?Break><?Return> "else" Block__1<?Break><?Return> ";") -> SemanticStatementConditional', [AST.STMT.StatementConditional, `
				{
					if condition then { consequent; } else { alternative; };
				}
				% (statement_conditional)
			`]],
			['Decorate(StatementConditional<Unless, Break, Return> ::= "if" Expression<+Block><?Break><?Return> "then" Block<?Break><?Return> "else" StatementConditional<-Unless><?Break><?Return>) -> SemanticStatementConditional', [AST.STMT.StatementConditional, `
				{
					if condition1 then { consequent1; } else if condition2 then { consequent2; } else { alternative; };
				}
				% (statement_conditional)
			`]],
			['Decorate(StatementConditional<Unless, Break, Return> ::= "unless" Expression<+Block><?Break><?Return> "then" Block<?Break><?Return> ";") -> SemanticStatementConditional', [AST.STMT.StatementConditional, `
				{
					unless condition then { alternative; };
				}
				% (statement_conditional__unless)
			`]],

			['Decorate(StatementLoop<Return> ::= "while" Expression<+Block><-Break><?Return> "do" Block<+Break><?Return> ";") -> SemanticStatementLoop', [AST.STMT.StatementLoop, `
				{
					while condition do { loop; };
				}
				% (statement_loop)
			`]],
			['Decorate(StatementLoop<Return> ::= "do" Block<+Break><?Return> "while" Expression<+Block><-Break><?Return> ";") -> SemanticStatementLoop', [AST.STMT.StatementLoop, `
				{
					do { loop; } while condition;
				}
				% (statement_loop)
			`]],
			['Decorate(StatementLoop<Return> ::= "until" Expression<+Block><-Break><?Return> "do" Block<+Break><?Return> ";") -> SemanticStatementLoop', [AST.STMT.StatementLoop, `
				{
					until condition do { loop; };
				}
				% (statement_loop)
			`]],
			['Decorate(StatementLoop<Return> ::= "do" Block<+Break><?Return> "until" Expression<+Block><-Break><?Return> ";") -> SemanticStatementLoop', [AST.STMT.StatementLoop, `
				{
					do { loop; } until condition;
				}
				% (statement_loop)
			`]],

			['Decorate(StatementIteration<Return> ::= "for" "_" ":" Type "in" Expression<+Block><+Break><?Return> "do" Block<+Break><?Return> ";") -> SemanticStatementIteration', [AST.STMT.StatementIteration, `
				{
					for _: T in iterable do { iterate; };
				}
				% (statement_iteration)
			`]],
			['Decorate(StatementIteration<Return> ::= "for" IDENTIFIER ":" Type "in" Expression<+Block><+Break><?Return> "do" Block<+Break><?Return> ";") -> SemanticStatementIteration', [AST.STMT.StatementIteration, `
				{
					for it: T in iterable do { iterate; };
				}
				% (statement_iteration)
			`]],

			['Decorate(StatementBreak ::= "break" ";") -> SemanticStatementBreak', [AST.STMT.StatementBreak, `
				{
					while condition do { break; };
				}
				% (statement_break)
			`]],
			['Decorate(StatementBreak ::= "skip" ";") -> SemanticStatementBreak', [AST.STMT.StatementBreak, `
				{
					while condition do { skip; };
				}
				% (statement_break)
			`]],

			['Decorate(StatementReturn ::= "return" ";") ->', [AST.STMT.StatementReturn, `
				{
					func foo(): void { return; }
				}
				% (statement_return)
			`]],

			['Decorate(Block<Break, Return> ::= "{" Statement<?Break><?Return>+ "}") -> SemanticBlock', [AST.Block, `
				{
					type T = U;
					val a: T = b;
					a;
					claim a: U;
					set a = b;
					delete a;
					{
						b;
					};
					if condition then { consequent; };
					while condition do { loop; };
					for it: T in iterable do { iterate; };
				}
				% (block)
			`]],

			['Decorate(DeclarationType ::= "type" "_" "=" Type ";") -> SemanticDeclarationType', [AST.STMT.DeclarationType, `
				{
					type _ = U;
				}
				% (declaration_type)
			`]],
			['Decorate(DeclarationType ::= "type" IDENTIFIER "=" Type ";") -> SemanticDeclarationType', [AST.STMT.DeclarationType, `
				{
					type T = U;
				}
				% (declaration_type)
			`]],

			['Decorate(DeclarationVariable<Break, Return> ::= "val" "_" "=" Expression<+Block><?Break><?Return> ";") -> SemanticDeclarationVariable', [AST.STMT.DeclarationVariable, `
				{
					val _ = b;
				}
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable<Break, Return> ::= "val" "_" ":" Type "=" Expression<+Block><?Break><?Return> ";") -> SemanticDeclarationVariable', [AST.STMT.DeclarationVariable, `
				{
					val _: T = b;
				}
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable<Break, Return> ::= "val" IDENTIFIER "=" Expression<+Block><?Break><?Return> ";") -> SemanticDeclarationVariable', [AST.STMT.DeclarationVariable, `
				{
					val a = b;
				}
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable<Break, Return> ::= "val" IDENTIFIER ":" Type "=" Expression<+Block><?Break><?Return> ";") -> SemanticDeclarationVariable', [AST.STMT.DeclarationVariable, `
				{
					val a: T = b;
				}
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable<Break, Return> ::= "val" "mut" IDENTIFIER "=" Expression<+Block><?Break><?Return> ";") -> SemanticDeclarationVariable', [AST.STMT.DeclarationVariable, `
				{
					val mut a = b;
				}
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable<Break, Return> ::= "val" "mut" IDENTIFIER ":" Type "=" Expression<+Block><?Break><?Return> ";") -> SemanticDeclarationVariable', [AST.STMT.DeclarationVariable, `
				{
					val mut a: T = b;
				}
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable<Break, Return> ::= "val" "mut" IDENTIFIER "?" ":" Type ";") -> SemanticDeclarationVariable', [AST.STMT.DeclarationVariable, `
				{
					val mut a?: T;
				}
				% (declaration_variable)
			`]],

			['Decorate(DeclarationFunction ::= "func" "_" "(" ")" ":" "void" Block<-Break><+Return>) -> SemanticDeclarationFunction', [AST.STMT.DeclarationFunction, `
				{
					func _(): void {;}
				}
				% (declaration_function)
			`]],
			['Decorate(DeclarationFunction ::= "func" "_" "(" ParametersFunction ")" ":" "void" Block<-Break><+Return>) -> SemanticDeclarationFunction', [AST.STMT.DeclarationFunction, `
				{
					func _(a: A, $b: B, c= charlie: C): void {;}
				}
				% (declaration_function)
			`]],
			['Decorate(DeclarationFunction ::= "func" IDENTIFIER "(" ")" ":" "void" Block<-Break><+Return>) -> SemanticDeclarationFunction', [AST.STMT.DeclarationFunction, `
				{
					func foo(): void { return; }
				}
				% (declaration_function)
			`]],
			['Decorate(DeclarationFunction ::= "func" IDENTIFIER "(" ParametersFunction ")" ":" "void" Block<-Break><+Return>) -> SemanticDeclarationFunction', [AST.STMT.DeclarationFunction, `
				{
					func foo(a: A, $b: B, c= charlie: C): void { return; }
				}
				% (declaration_function)
			`]],

			['Decorate(SourceFile ::= #x02 #x03) -> SemanticGoal', [AST.Goal, `
				{
				}
				% (source_file)
			`]],
			['Decorate(SourceFile ::= #x02 Block<-Break><-Return> #x03) -> SemanticGoal', [AST.Goal, `
				{
					"source file";
				}
				% (source_file)
			`]],
		]).forEach(([klass, text], description) => {
			test.test(description, {
				skip:          description.startsWith('skip:'),
				todo:          description.startsWith('todo:'),
				expectFailure: description.startsWith('expectFailure:'),
				only:          description.startsWith('only:') || undefined, // `only: false` negates `only: true` in parent suite
			}, () => {
				const [source, query] = text.split('%');
				const parsenode: SyntaxNode = captureParseNode(source, query);
				const decorator = new Decorator();
				const query_is_primlit: boolean = query.includes('primitive_literal');
				let instance: AST.AstNode;
				if (query_is_primlit && description.includes('Decorate(Type > PrimitiveLiteral')) {
					instance = decorator.decorateTypeNode(parsenode as SyntaxNodeType<'primitive_literal'>);
				} else if (query_is_primlit && description.includes('Decorate(Expression > PrimitiveLiteral')) {
					instance = decorator.decorateExprNode(parsenode as SyntaxNodeType<'primitive_literal'>);
				} else {
					instance = decorator.decorate(parsenode);
				}
				return assert_instanceof(instance, klass, `\`${ parsenode.text }\` should be an instance of ${ klass.name }.`);
			});
		});
		['!'].forEach((op) => {
			test.suite(`Decorate(TypeUnarySymbol ::= TypeUnarySymbol "${ op }") -> SemanticTypeOperation`, () => {
				test.test(`operator \`${ op }\` is not yet supported.`, () => {
					assert.throws(() => new Decorator().decorate(captureParseNode(`
						{
							type T = U${ op };
						}
					`, '(type_unary_symbol)')), /not yet supported/);
				});
			});
		});
		['!.'].forEach((op) => {
			['1', '_', 'p', '[a + b]'].forEach((accessor) => {
				test.suite(`Decorate(ExpressionCompound<Block> ::= ExpressionCompound<?Block> "${ op }" PropertyAccessor) -> SemanticExpressionAccess`, () => {
					test.test(`operator \`${ op }\` is not yet supported.`, () => {
						assert.throws(() => new Decorator().decorate(captureParseNode(`
							{
								v${ op }${ accessor };
							}
						`, '(expression_compound)')), /not yet supported/);
					});
				});
			});
		});
		['is', '!is'].forEach((op) => {
			test.suite(`Decorate(ExpressionComparative ::= ExpressionComparative "${ op }" ExpressionAdditive) -> SemanticExpressionOperation`, () => {
				test.test(`operator \`${ op }\` is not yet supported.`, () => {
					assert.throws(() => new Decorator().decorate(captureParseNode(`
						{
							a ${ op } b;
						}
					`, '(expression_comparative)')), /not yet supported/);
				});
			});
		});
	});
});

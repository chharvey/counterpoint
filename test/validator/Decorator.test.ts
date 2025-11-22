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



test.suite('Decorator', () => {
	test.suite('#decorateTS', () => {
		function captureParseNode(source: string, query: string): SyntaxNode {
			const captures: QueryCapture[] = new Query(Counterpoint, `${ query } @capt`).captures(TS_PARSER.parse(source).rootNode);
			assert.ok(captures.length, 'could not find any captures.');
			return captures[0].node;
		}
		new Map<string, readonly [ConstructorType<AST.ASTNodeCP>, string]>([
			['Decorate(Word ::= _KEYWORD_OTHER) -> SemanticKey', [AST.ASTNodeKey, `
				{
					(mut= 42);
				}
				% (word "mut")
			`]],
			['Decorate(Word ::= IDENTIFIER) -> SemanticKey', [AST.ASTNodeKey, `
				{
					(foobar= 42);
				}
				% (word (identifier))
			`]],
			['Decorate(Word ::= KeywordType) -> SemanticKey', [AST.ASTNodeKey, `
				{
					(bool= 42);
				}
				% (word (keyword_type))
			`]],
			['Decorate(Word ::= KeywordValue) -> SemanticKey', [AST.ASTNodeKey, `
				{
					(true= 42);
				}
				% (word (keyword_value))
			`]],

			['Decorate(Type > PrimitiveLiteral ::= INTEGER) -> SemanticTypeConstant', [AST.ASTNodeTypeConstant, `
				{
					type T = 42;
				}
				% (primitive_literal (integer))
			`]],
			['Decorate(Type > PrimitiveLiteral ::= FLOAT) -> SemanticTypeConstant', [AST.ASTNodeTypeConstant, `
				{
					type T = 42.69;
				}
				% (primitive_literal (float))
			`]],
			['Decorate(Type > PrimitiveLiteral ::= STRING) -> SemanticTypeConstant', [AST.ASTNodeTypeConstant, `
				{
					type T = "hello";
				}
				% (primitive_literal (string))
			`]],
			['Decorate(Type > PrimitiveLiteral ::= KeywordValue) -> SemanticTypeConstant', [AST.ASTNodeTypeConstant, `
				{
					type T = false;
				}
				% (primitive_literal (keyword_value))
			`]],
			['Decorate(Type > PrimitiveLiteral ::= "@" Word) -> SemanticTypeConstant', [AST.ASTNodeTypeConstant, `
				{
					type T = @hello;
				}
				% (primitive_literal (word (identifier)))
			`]],

			['Decorate(Expression > PrimitiveLiteral ::= INTEGER) -> SemanticConstant', [AST.ASTNodeConstant, `
				{
					42;
				}
				% (primitive_literal (integer))
			`]],
			['Decorate(Expression > PrimitiveLiteral ::= FLOAT) -> SemanticConstant', [AST.ASTNodeConstant, `
				{
					42.69;
				}
				% (primitive_literal (float))
			`]],
			['Decorate(Expression > PrimitiveLiteral ::= STRING) -> SemanticConstant', [AST.ASTNodeConstant, `
				{
					"hello";
				}
				% (primitive_literal (string))
			`]],
			['Decorate(Expression > PrimitiveLiteral ::= KeywordValue) -> SemanticConstant', [AST.ASTNodeConstant, `
				{
					false;
				}
				% (primitive_literal (keyword_value))
			`]],
			['Decorate(Expression > PrimitiveLiteral ::= "@" Word) -> SemanticConstant', [AST.ASTNodeConstant, `
				{
					@hello;
				}
				% (primitive_literal (word (identifier)))
			`]],

			/* ## Types */
			['Decorate(EntryType<-Named><-Optional> ::= Type) -> SemanticItemType', [AST.ASTNodeItemType, `
				{
					type T = (int,);
				}
				% (entry_type)
			`]],
			['Decorate(EntryType<-Named><+Optional> ::= "?:" Type) -> SemanticItemType', [AST.ASTNodeItemType, `
				{
					type T = (?: int);
				}
				% (entry_type__optional)
			`]],
			['Decorate(EntryType<+Named><-Optional> ::= Word ":" Type) -> SemanticPropertyType', [AST.ASTNodePropertyType, `
				{
					type T = (a: int);
				}
				% (entry_type__named)
			`]],
			['Decorate(EntryType<+Named><+Optional> ::= Word "?:" Type) -> SemanticPropertyType', [AST.ASTNodePropertyType, `
				{
					type T = (a?: int);
				}
				% (entry_type__named__optional)
			`]],
			['Decorate(EntryType<+Named><-Optional> ::= Word ":" Type) -> SemanticPropertyType', [AST.ASTNodePropertyType, `
				{
					type T = (_: int);
				}
				% (entry_type__named)
			`]],
			['Decorate(EntryType<+Named><+Optional> ::= Word "?:" Type) -> SemanticPropertyType', [AST.ASTNodePropertyType, `
				{
					type T = (_?: int);
				}
				% (entry_type__named__optional)
			`]],

			['Decorate(PropertyAccessorType ::= INTEGER) -> SemanticIndex', [AST.ASTNodeIndex, `
				{
					type T = U.1;
				}
				% (property_accessor_type)
			`]],
			['Decorate(PropertyAccessorType ::= Word) -> SemanticKey', [AST.ASTNodeKey, `
				{
					type T = U.p;
				}
				% (property_accessor_type)
			`]],

			['Decorate(TypeGrouped ::= "(" Type ")") -> SemanticType', [AST.ASTNodeType, `
				{
					type T = (3 | float);
				}
				% (type_grouped)
			`]],

			['Decorate(TypeTupleLiteral ::= "(" ")") -> SemanticTypeTuple', [AST.ASTNodeTypeTuple, `
				{
					type T = ();
				}
				% (type_tuple_literal)
			`]],
			['Decorate(TypeTupleLiteral ::= "(" ItemsType ")") -> SemanticTypeTuple', [AST.ASTNodeTypeTuple, `
				{
					type T = (int, ?: float);
				}
				% (type_tuple_literal)
			`]],

			['Decorate(TypeRecordLiteral ::= "(" PropertiesType ")") -> SemanticTypeRecord', [AST.ASTNodeTypeRecord, `
				{
					type T = (a?: int, b: float);
				}
				% (type_record_literal)
			`]],

			['Decorate(TypeListLiteral ::= "[" Type "]") -> SemanticTypeList', [AST.ASTNodeTypeList, `
				{
					type T = [int];
				}
				% (type_list_literal)
			`]],

			['Decorate(TypeDictLiteral ::= "[" ":" Type "]") -> SemanticTypeDict', [AST.ASTNodeTypeDict, `
				{
					type T = [:int];
				}
				% (type_dict_literal)
			`]],

			['Decorate(TypeSetLiteral ::= "{" Type "}") -> SemanticTypeSet', [AST.ASTNodeTypeSet, `
				{
					type T = {int};
				}
				% (type_set_literal)
			`]],

			['Decorate(TypeMapLiteral ::= "{" Type__0 "->" Type__1 "}") -> SemanticTypeMap', [AST.ASTNodeTypeMap, `
				{
					type T = {int -> float};
				}
				% (type_map_literal)
			`]],

			['Decorate(TypeCompound ::= TypeCompound "." PropertyAccessorType) -> SemanticTypeAccess', [AST.ASTNodeTypeAccess, `
				{
					type T = U.p;
				}
				% (type_compound)
			`]],
			['Decorate(TypeCompound ::= TypeCompound "?." PropertyAccessorType) -> SemanticTypeAccess', [AST.ASTNodeTypeAccess, `
				{
					type T = U?.p;
				}
				% (type_compound)
			`]],
			['Decorate(TypeCompound ::= TypeCompound "." GenericArguments) -> SemanticTypeCall', [AST.ASTNodeTypeCall, `
				{
					type T = List.<U>;
				}
				% (type_compound)
			`]],

			['Decorate(TypeUnarySymbol ::= TypeUnarySymbol "?") -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				{
					type T = U?;
				}
				% (type_unary_symbol)
			`]],
			['todo: Decorate(TypeUnarySymbol ::= TypeUnarySymbol "!") -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				{
					type T = U!;
				}
				% (type_unary_symbol)
			`]],

			['Decorate(TypeUnaryKeyword ::= "mut" TypeUnaryKeyword) -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				{
					type T = mut U;
				}
				% (type_unary_keyword)
			`]],

			['Decorate(TypeIntersection ::= TypeIntersection "&" TypeUnaryKeyword) -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				{
					type T = U & V;
				}
				% (type_intersection)
			`]],

			['Decorate(TypeUnion ::= TypeUnion "|" TypeIntersection) -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				{
					type T = U | V;
				}
				% (type_union)
			`]],

			/* ## Expressions */
			['Decorate(StringTemplate<Break> ::= TEMPLATE_FULL) -> SemanticTemplate', [AST.ASTNodeTemplate, `
				{
					"""full1""";
				}
				% (string_template)
			`]],
			['Decorate(StringTemplate<Break> ::= TEMPLATE_HEAD Expression<+Block><?Break>? (TEMPLATE_MIDDLE Expression<+Block><?Break>?)* TEMPLATE_TAIL) -> SemanticTemplate', [AST.ASTNodeTemplate, `
				{
					"""hello {{ "to" }} the {{ "whole" }} great {{ "big" }} world""";
				}
				% (string_template)
			`]],
			['Decorate(StringTemplate<Break> ::= TEMPLATE_HEAD Expression<+Block><?Break>? (TEMPLATE_MIDDLE Expression<+Block><?Break>?)* TEMPLATE_TAIL) -> SemanticTemplate', [AST.ASTNodeTemplate, `
				{
					"""hello {{ """to {{ """the {{ "whole" }} great""" }} big""" }} world""";
				}
				% (string_template)
			`]],

			['Decorate(Property<Break> ::= Word "=" Expression<+Block><?Break>) -> SemanticProperty', [AST.ASTNodeProperty, `
				{
					(a= 42);
				}
				% (property)
			`]],
			['Decorate(Property<Break> ::= Word "=" Expression<+Block><?Break>) -> SemanticProperty', [AST.ASTNodeProperty, `
				{
					(_= 42);
				}
				% (property)
			`]],

			['Decorate(Case<Break> ::= Expression<+Block><?Break> "->" Expression<+Block><?Break>) -> SemanticCase', [AST.ASTNodeCase, `
				{
					{42 -> 6.9};
				}
				% (case)
			`]],

			['Decorate(ExpressionCompound<Block, Break> > PropertyAccessor<Break> ::= INTEGER) -> SemanticIndex', [AST.ASTNodeIndex, `
				{
					v.1;
				}
				% (property_accessor)
			`]],
			['Decorate(ExpressionCompound<Block, Break> > PropertyAccessor<Break> ::= Word) -> SemanticKey', [AST.ASTNodeKey, `
				{
					v.p;
				}
				% (property_accessor)
			`]],
			['Decorate(ExpressionCompound<Block, Break> > PropertyAccessor<Break> ::= "[" Expression<+Block><?Break> "]") -> SemanticExpression', [AST.ASTNodeExpression, `
				{
					v.[a + b];
				}
				% (property_accessor)
			`]],

			['Decorate(Assignee<Break> > PropertyAccessor<Break> ::= INTEGER) -> SemanticIndex', [AST.ASTNodeIndex, `
				{
					set v.1 = false;
				}
				% (property_accessor)
			`]],
			['Decorate(Assignee<Break> > PropertyAccessor<Break> ::= Word) -> SemanticKey', [AST.ASTNodeKey, `
				{
					set v.p = false;
				}
				% (property_accessor)
			`]],
			['Decorate(Assignee<Break> > PropertyAccessor<Break> ::= "[" Expression<+Block><?Break> "]") -> SemanticExpression', [AST.ASTNodeExpression, `
				{
					set v.[a + b] = false;
				}
				% (property_accessor)
			`]],

			['Decorate(ExpressionGrouped<Break> ::= "(" Expression<+Block><?Break> ")") -> SemanticExpression', [AST.ASTNodeExpression, `
				{
					(42 || 6.9);
				}
				% (expression_grouped)
			`]],

			['Decorate(TupleLiteral<Break> ::= "(" ")") -> SemanticTuple', [AST.ASTNodeTuple, `
				{
					();
				}
				% (tuple_literal)
			`]],
			['Decorate(TupleLiteral<Break> ::= "(" Items<?Break> ")") -> SemanticTuple', [AST.ASTNodeTuple, `
				{
					(42, 6.9);
				}
				% (tuple_literal)
			`]],

			['Decorate(RecordLiteral<Break> ::= "(" ","? Property<?Break># ","? ")") -> SemanticRecord', [AST.ASTNodeRecord, `
				{
					(a= 42, b= 6.9);
				}
				% (record_literal)
			`]],

			['Decorate(ListLiteral<Break> ::= "[" "]") -> SemanticSet', [AST.ASTNodeList, `
				{
					[];
				}
				% (list_literal)
			`]],
			['Decorate(ListLiteral<Break> ::= "[" (","? Expression<+Block><?Break># ","?)? "]") -> SemanticList', [AST.ASTNodeList, `
				{
					[42, 6.9];
				}
				% (list_literal)
			`]],

			['Decorate(DictLiteral<Break> ::= "[" ","? Property<?Break># ","? "]") -> SemanticRecord', [AST.ASTNodeDict, `
				{
					[a= 42, b= 6.9];
				}
				% (dict_literal)
			`]],

			['Decorate(SetLiteral<Break> ::= "{" "}") -> SemanticSet', [AST.ASTNodeSet, `
				{
					{};
				}
				% (set_literal)
			`]],
			['Decorate(SetLiteral<Break> ::= "{" (","? Expression<+Block><?Break># ","?)? "}") -> SemanticSet', [AST.ASTNodeSet, `
				{
					{42, 6.9};
				}
				% (set_literal)
			`]],

			['Decorate(MapLiteral<Break> ::= "{" ","? Case<?Break># ","? "}") -> SemanticMap', [AST.ASTNodeMap, `
				{
					{42 -> 6.9, "hello" -> true};
				}
				% (map_literal)
			`]],

			['Decorate(ExpressionUnit<Block, Break> ::= Block<?Break>) -> SemanticExpressionBlock', [AST.ASTNodeExpressionBlock, `
				{
					type T = U;
					let a: T = b;
					claim a: U;
					set a = b;
					a;
					{
						b;
					};
				}
				% (expression_block)
			`]],

			['Decorate(ExpressionCompound<Block, Break> ::= ExpressionCompound<?Block><?Break> "." PropertyAccessor<?Break>) -> SemanticAccess', [AST.ASTNodeAccess, `
				{
					v.p;
				}
				% (expression_compound)
			`]],
			['Decorate(ExpressionCompound<Block, Break> ::= ExpressionCompound<?Block><?Break> "?." PropertyAccessor<?Break>) -> SemanticAccess', [AST.ASTNodeAccess, `
				{
					v?.p;
				}
				% (expression_compound)
			`]],
			['todo: Decorate(ExpressionCompound<Block, Break> ::= ExpressionCompound<?Block><?Break> "!." PropertyAccessor<?Break>) -> SemanticAccess', [AST.ASTNodeAccess, `
				{
					v!.p;
				}
				% (expression_compound)
			`]],
			['Decorate(ExpressionCompound<Block, Break> ::= ExpressionCompound<?Block><?Break> "." FunctionArguments<?Break>) -> SemanticCall', [AST.ASTNodeCall, `
				{
					List.();
				}
				% (expression_compound)
			`]],
			['Decorate(ExpressionCompound<Block, Break> ::= ExpressionCompound<?Block><?Break> "." GenericArguments FunctionArguments<?Break>) -> SemanticCall', [AST.ASTNodeCall, `
				{
					List.<T>();
				}
				% (expression_compound)
			`]],

			['Decorate(ExpressionUnarySymbol<Block, Break> ::= "!" ExpressionUnarySymbol<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					!v;
				}
				% (expression_unary_symbol)
			`]],
			['Decorate(ExpressionUnarySymbol<Block, Break> ::= "?" ExpressionUnarySymbol<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					?v;
				}
				% (expression_unary_symbol)
			`]],
			['Decorate(ExpressionUnarySymbol<Block, Break> ::= "+" ExpressionUnarySymbol<?Block><?Break>) -> SemanticExpression', [AST.ASTNodeExpression, `
				{
					+v;
				}
				% (expression_unary_symbol)
			`]],
			['Decorate(ExpressionUnarySymbol<Block, Break> ::= "-" ExpressionUnarySymbol<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					-v;
				}
				% (expression_unary_symbol)
			`]],

			['Decorate(ExpressionUnaryKeyword<Block, Break> ::= "int" ExpressionUnaryKeyword<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					int v;
				}
				% (expression_unary_keyword)
			`]],
			['Decorate(ExpressionUnaryKeyword<Block, Break> ::= "float" ExpressionUnaryKeyword<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					float v;
				}
				% (expression_unary_keyword)
			`]],

			['Decorate(ExpressionCast<Block, Break> ::= ExpressionCast<?Block><?Break> "as" ExpressionUnaryKeyword<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a as Klass;
				}
				% (expression_cast)
			`]],
			['Decorate(ExpressionCast<Block, Break> ::= ExpressionCast<?Block><?Break> "as?" ExpressionUnaryKeyword<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a as? Klass;
				}
				% (expression_cast)
			`]],
			['Decorate(ExpressionCast<Block, Break> ::= ExpressionCast<?Block><?Break> "as!" ExpressionUnaryKeyword<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a as! Klass;
				}
				% (expression_cast)
			`]],
			['Decorate(ExpressionCast<Block, Break> ::= ExpressionCast<?Block><?Break> "as" "<" Type ">") -> SemanticClaim', [AST.ASTNodeClaim, `
				{
					a as <T>;
				}
				% (expression_cast)
			`]],

			['Decorate(ExpressionExponential<Block, Break> ::= ExpressionCast<?Block><?Break> "^" ExpressionExponential<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a ^ b;
				}
				% (expression_exponential)
			`]],

			['Decorate(ExpressionMultiplicative<Block, Break> ::= ExpressionMultiplicative<?Block><?Break> "*" ExpressionExponential<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a * b;
				}
				% (expression_multiplicative)
			`]],
			['Decorate(ExpressionMultiplicative<Block, Break> ::= ExpressionMultiplicative<?Block><?Break> "/" ExpressionExponential<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a / b;
				}
				% (expression_multiplicative)
			`]],

			['Decorate(ExpressionAdditive<Block, Break> ::= ExpressionAdditive<?Block><?Break> "+" ExpressionMultiplicative<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a + b;
				}
				% (expression_additive)
			`]],
			['Decorate(ExpressionAdditive<Block, Break> ::= ExpressionAdditive<?Block><?Break> "-" ExpressionMultiplicative<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a - b;
				}
				% (expression_additive)
			`]],

			...['<', '>', '<=', '>=', '!<', '!>', 'is', 'isnt'].map((op) => [`${ ['is', 'isnt'].includes(op) ? 'todo: ' : '' }Decorate(ExpressionComparative<Block, Break> ::= ExpressionComparative<?Block><?Break> "${ op }" ExpressionAdditive<?Block><?Break>) -> SemanticOperation`, [AST.ASTNodeOperation, `
				{
					a ${ op } b;
				}
				% (expression_comparative)
			`]] as const),

			...['===', '!==', '==', '!='].map((op) => [`Decorate(ExpressionEquality<Block, Break> ::= ExpressionEquality<?Block><?Break> "${ op }" ExpressionComparative<?Block><?Break>) -> SemanticOperation`, [AST.ASTNodeOperation, `
				{
					a ${ op } b;
				}
				% (expression_equality)
			`]] as const),

			['Decorate(ExpressionConjunctive<Block, Break> ::= ExpressionConjunctive<?Block><?Break> "&&" ExpressionEquality<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a && b;
				}
				% (expression_conjunctive)
			`]],
			['Decorate(ExpressionConjunctive<Block, Break> ::= ExpressionConjunctive<?Block><?Break> "!&" ExpressionEquality<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a !& b;
				}
				% (expression_conjunctive)
			`]],

			['Decorate(ExpressionDisjunctive<Block> ::= ExpressionDisjunctive<?Block><?Break> "||" ExpressionConjunctive<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a || b;
				}
				% (expression_disjunctive)
			`]],
			['Decorate(ExpressionDisjunctive<Block> ::= ExpressionDisjunctive<?Block><?Break> "!|" ExpressionConjunctive<?Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a !| b;
				}
				% (expression_disjunctive)
			`]],

			['Decorate(ExpressionConditional<Break> ::= "if" Expression__0<+Block><?Break> "then" Expression__1<-Block><?Break> "else" Expression__2<-Block><?Break>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					if a then b else c;
				}
				% (expression_conditional)
			`]],

			/* ## Statements */
			['Decorate(StatementExpression<Break> ::= Expression<+Block><?Break> ";") -> SemanticStatementExpression', [AST.ASTNodeStatementExpression, `
				{
					a;
				}
				% (statement_expression)
			`]],

			['Decorate(StatementConditional<Unless, Break> ::= "if" Expression<+Block><?Break> "then" Block<?Break> ";") -> SemanticStatementConditional', [AST.ASTNodeStatementConditional, `
				{
					if condition then { consequent; };
				}
				% (statement_conditional)
			`]],
			['Decorate(StatementConditional<Unless, Break> ::= "if" Expression<+Block><?Break> "then" Block__0<?Break> "else" Block__1<?Break> ";") -> SemanticStatementConditional', [AST.ASTNodeStatementConditional, `
				{
					if condition then { consequent; } else { alternative; };
				}
				% (statement_conditional)
			`]],
			['Decorate(StatementConditional<Unless, Break> ::= "if" Expression<+Block><?Break> "then" Block<?Break> "else" StatementConditional<-Unless><?Break>) -> SemanticStatementConditional', [AST.ASTNodeStatementConditional, `
				{
					if condition1 then { consequent1; } else if condition2 then { consequent2; } else { alternative; };
				}
				% (statement_conditional)
			`]],
			['Decorate(StatementConditional<Unless, Break> ::= "unless" Expression<+Block><?Break> "then" Block<?Break> ";") -> SemanticStatementConditional', [AST.ASTNodeStatementConditional, `
				{
					unless condition then { alternative; };
				}
				% (statement_conditional__unless)
			`]],

			['Decorate(StatementLoop ::= "while" Expression<+Block><-Break> "do" Block<+Break> ";") -> SemanticStatementLoop', [AST.ASTNodeStatementLoop, `
				{
					while condition do { loop; };
				}
				% (statement_loop)
			`]],
			['Decorate(StatementLoop ::= "do" Block<+Break> "while" Expression<+Block><-Break> ";") -> SemanticStatementLoop', [AST.ASTNodeStatementLoop, `
				{
					do { loop; } while condition;
				}
				% (statement_loop)
			`]],
			['Decorate(StatementLoop ::= "until" Expression<+Block><-Break> "do" Block<+Break> ";") -> SemanticStatementLoop', [AST.ASTNodeStatementLoop, `
				{
					until condition do { loop; };
				}
				% (statement_loop)
			`]],
			['Decorate(StatementLoop ::= "do" Block<+Break> "until" Expression<+Block><-Break> ";") -> SemanticStatementLoop', [AST.ASTNodeStatementLoop, `
				{
					do { loop; } until condition;
				}
				% (statement_loop)
			`]],

			['Decorate(StatementIteration ::= "for" "_" ":" Type "of" Expression<+Block><-Break> "do" Block<+Break> ";") -> SemanticStatementIteration', [AST.ASTNodeStatementIteration, `
				{
					for _: T of iterable do { iterate; };
				}
				% (statement_iteration)
			`]],
			['Decorate(StatementIteration ::= "for" IDENTIFIER ":" Type "of" Expression<+Block><-Break> "do" Block<+Break> ";") -> SemanticStatementIteration', [AST.ASTNodeStatementIteration, `
				{
					for it: T of iterable do { iterate; };
				}
				% (statement_iteration)
			`]],

			['Decorate(StatementBreak ::= "break" ";") -> SemanticStatementBreak', [AST.ASTNodeStatementBreak, `
				{
					while condition do { break; };
				}
				% (statement_break)
			`]],
			['Decorate(StatementBreak ::= "continue" ";") -> SemanticStatementBreak', [AST.ASTNodeStatementBreak, `
				{
					while condition do { continue; };
				}
				% (statement_break)
			`]],

			['Decorate(Block<Break> ::= "{" Statement<?Break>+ "}") -> SemanticBlock', [AST.ASTNodeBlock, `
				{
					type T = U;
					let a: T = b;
					claim a: U;
					set a = b;
					a;
					{
						b;
					};
					if condition then { consequent; };
					while condition do { loop; };
					for it: T of iterable do { iterate; };
				}
				% (block)
			`]],

			['Decorate(Assignee<Break> ::= IDENTIFIER) -> SemanticVariable', [AST.ASTNodeVariable, `
				{
					set v = 42;
				}
				% (assignee)
			`]],
			['Decorate(Assignee<Break> ::= ExpressionCompound<+Block><?Break> "." PropertyAccessor<?Break>) -> SemanticAccess', [AST.ASTNodeAccess, `
				{
					set v.1 = 42;
				}
				% (assignee)
			`]],

			['Decorate(DeclarationType ::= "type" "_" "=" Type ";") -> SemanticDeclarationType', [AST.ASTNodeDeclarationType, `
				{
					type _ = U;
				}
				% (declaration_type)
			`]],
			['Decorate(DeclarationType ::= "type" IDENTIFIER "=" Type ";") -> SemanticDeclarationType', [AST.ASTNodeDeclarationType, `
				{
					type T = U;
				}
				% (declaration_type)
			`]],

			['Decorate(DeclarationVariable<Break> ::= "let" "_" ":" Type "=" Expression<+Block><?Break> ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				{
					let _: T = b;
				}
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable<Break> ::= "let" IDENTIFIER ":" Type "=" Expression<+Block><?Break> ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				{
					let a: T = b;
				}
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable<Break> ::= "let" "var" "_" ":" Type "=" Expression<+Block><?Break> ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				{
					let var _: T = b;
				}
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable<Break> ::= "let" "var" IDENTIFIER ":" Type "=" Expression<+Block><?Break> ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				{
					let var a: T = b;
				}
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable<Break> ::= "let" "var" "_" "?:" Type ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				{
					let var _?: T;
				}
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable<Break> ::= "let" "var" IDENTIFIER "?:" Type ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				{
					let var a?: T;
				}
				% (declaration_variable)
			`]],

			['Decorate(DeclarationClaim<Break> ::= "claim" Assignee<?Break> ":" Type ";") -> SemanticDeclarationClaim', [AST.ASTNodeDeclarationClaim, `
				{
					claim a: T;
				}
				% (declaration_claim)
			`]],

			['Decorate(DeclarationReassignment<Break> ::= "set" Assignee<?Break> "=" Expression<+Block><?Break> ";") -> SemanticDeclarationReassignment', [AST.ASTNodeDeclarationReassignment, `
				{
					set a = b;
				}
				% (declaration_reassignment)
			`]],
		]).forEach(([klass, text], description) => {
			test.test(description, {
				skip: description.startsWith('skip:'),
				todo: description.startsWith('todo:'),
				only: description.startsWith('only:'),
			}, () => {
				const parsenode: SyntaxNode = captureParseNode(...text.split('%') as [string, string]);
				return assert_instanceof(new Decorator().decorateTS(parsenode), klass, `\`${ parsenode.text }\` should be an instance of ${ klass.name }.`);
			});
		});
		['!'].forEach((op) => {
			test.suite(`Decorate(TypeUnarySymbol ::= TypeUnarySymbol "${ op }") -> SemanticTypeOperation`, () => {
				test.test(`operator \`${ op }\` is not yet supported.`, () => {
					assert.throws(() => new Decorator().decorateTS(captureParseNode(`
						{
							type T = U${ op };
						}
					`, '(type_unary_symbol)')), /not yet supported/);
				});
			});
		});
		['!.'].forEach((op) => {
			['1', '_', 'p', '[a + b]'].forEach((accessor) => {
				test.suite(`Decorate(ExpressionCompound<Block> ::= ExpressionCompound<?Block> "${ op }" PropertyAccessor) -> SemanticAccess`, () => {
					test.test(`operator \`${ op }\` is not yet supported.`, () => {
						assert.throws(() => new Decorator().decorateTS(captureParseNode(`
							{
								v${ op }${ accessor };
							}
						`, '(expression_compound)')), /not yet supported/);
					});
				});
			});
		});
		['is', 'isnt'].forEach((op) => {
			test.suite(`Decorate(ExpressionComparative ::= ExpressionComparative "${ op }" ExpressionAdditive) -> SemanticOperation`, () => {
				test.test(`operator \`${ op }\` is not yet supported.`, () => {
					assert.throws(() => new Decorator().decorateTS(captureParseNode(`
						{
							a ${ op } b;
						}
					`, '(expression_comparative)')), /not yet supported/);
				});
			});
		});
	});
});

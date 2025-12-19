import * as assert from 'node:assert';
import type Parser from 'tree-sitter';
import {
	Query,
	type QueryCapture,
	type SyntaxNode,
} from 'tree-sitter';
import Counterpoint from 'tree-sitter-counterpoint';
import {
	type ConstructorType,
	TS_PARSER,
	AST,
	DECORATOR,
} from '../../src/index.ts';



describe('Decorator', () => {
	describe('#decorateTS', () => {
		function captureParseNode(source: string, query: string): SyntaxNode {
			const captures: QueryCapture[] = new Query(Counterpoint as Parser.Language, `${ query } @capt`).captures(TS_PARSER.parse(source).rootNode);
			assert.ok(captures.length, 'could not find any captures.');
			return captures[0].node;
		}
		new Map<string, readonly [ConstructorType<AST.ASTNodeCP>, string]>([
			['Decorate(Word ::= _KEYWORD_OTHER) -> SemanticKey', [AST.ASTNodeKey, `
				(mut= 42);
				% (word "mut")
			`]],
			['Decorate(Word ::= KEYWORD_TYPE) -> SemanticKey', [AST.ASTNodeKey, `
				(bool= 42);
				% (word (keyword_type))
			`]],
			['Decorate(Word ::= KEYWORD_VALUE) -> SemanticKey', [AST.ASTNodeKey, `
				(true= 42);
				% (word (keyword_value))
			`]],
			['Decorate(Word ::= IDENTIFIER) -> SemanticKey', [AST.ASTNodeKey, `
				(foobar= 42);
				% (word (identifier))
			`]],

			['Decorate(Type > PrimitiveLiteral ::= KEYWORD_VALUE) -> SemanticTypeConstant', [AST.ASTNodeTypeConstant, `
				type T = false;
				% (primitive_literal (keyword_value))
			`]],
			['Decorate(Type > PrimitiveLiteral ::= INTEGER) -> SemanticTypeConstant', [AST.ASTNodeTypeConstant, `
				type T = 42;
				% (primitive_literal (integer))
			`]],
			['Decorate(Type > PrimitiveLiteral ::= FLOAT) -> SemanticTypeConstant', [AST.ASTNodeTypeConstant, `
				type T = 42.69;
				% (primitive_literal (float))
			`]],
			['Decorate(Type > PrimitiveLiteral ::= STRING) -> SemanticTypeConstant', [AST.ASTNodeTypeConstant, `
				type T = "hello";
				% (primitive_literal (string))
			`]],
			['Decorate(Type > PrimitiveLiteral ::= "@" Word) -> SemanticTypeConstant', [AST.ASTNodeTypeConstant, `
				type T = @hello;
				% (primitive_literal (word (identifier)))
			`]],

			['Decorate(Expression > PrimitiveLiteral ::= KEYWORD_VALUE) -> SemanticConstant', [AST.ASTNodeConstant, `
				false;
				% (primitive_literal (keyword_value))
			`]],
			['Decorate(Expression > PrimitiveLiteral ::= INTEGER) -> SemanticConstant', [AST.ASTNodeConstant, `
				42;
				% (primitive_literal (integer))
			`]],
			['Decorate(Expression > PrimitiveLiteral ::= FLOAT) -> SemanticConstant', [AST.ASTNodeConstant, `
				42.69;
				% (primitive_literal (float))
			`]],
			['Decorate(Expression > PrimitiveLiteral ::= STRING) -> SemanticConstant', [AST.ASTNodeConstant, `
				"hello";
				% (primitive_literal (string))
			`]],
			['Decorate(Expression > PrimitiveLiteral ::= "@" Word) -> SemanticConstant', [AST.ASTNodeConstant, `
				@hello;
				% (primitive_literal (word (identifier)))
			`]],

			/* ## Types */
			['Decorate(EntryType<-Named><-Optional> ::= Type) -> SemanticItemType', [AST.ASTNodeItemType, `
				type T = (int,);
				% (entry_type)
			`]],
			['Decorate(EntryType<-Named><+Optional> ::= "?:" Type) -> SemanticItemType', [AST.ASTNodeItemType, `
				type T = (?: int);
				% (entry_type__optional)
			`]],
			['Decorate(EntryType<+Named><-Optional> ::= Word ":" Type) -> SemanticPropertyType', [AST.ASTNodePropertyType, `
				type T = (a: int);
				% (entry_type__named)
			`]],
			['Decorate(EntryType<+Named><+Optional> ::= Word "?:" Type) -> SemanticPropertyType', [AST.ASTNodePropertyType, `
				type T = (a?: int);
				% (entry_type__named__optional)
			`]],
			['Decorate(EntryType<+Named><-Optional> ::= Word ":" Type) -> SemanticPropertyType', [AST.ASTNodePropertyType, `
				type T = (_: int);
				% (entry_type__named)
			`]],
			['Decorate(EntryType<+Named><+Optional> ::= Word "?:" Type) -> SemanticPropertyType', [AST.ASTNodePropertyType, `
				type T = (_?: int);
				% (entry_type__named__optional)
			`]],

			['Decorate(TypeGrouped ::= "(" Type ")") -> SemanticType', [AST.ASTNodeType, `
				type T = (3 | float);
				% (type_grouped)
			`]],

			['Decorate(TypeTupleLiteral ::= "(" ")") -> SemanticTypeTuple', [AST.ASTNodeTypeTuple, `
				type T = ();
				% (type_tuple_literal)
			`]],
			['Decorate(TypeTupleLiteral ::= "(" ItemsType ")") -> SemanticTypeTuple', [AST.ASTNodeTypeTuple, `
				type T = (int, ?: float);
				% (type_tuple_literal)
			`]],

			['Decorate(TypeRecordLiteral ::= "(" PropertiesType ")") -> SemanticTypeRecord', [AST.ASTNodeTypeRecord, `
				type T = (a?: int, b: float);
				% (type_record_literal)
			`]],

			['Decorate(TypeListLiteral ::= "[" Type "]") -> SemanticTypeList', [AST.ASTNodeTypeList, `
				type T = [int];
				% (type_list_literal)
			`]],

			['Decorate(TypeDictLiteral ::= "[" ":" Type "]") -> SemanticTypeDict', [AST.ASTNodeTypeDict, `
				type T = [:int];
				% (type_dict_literal)
			`]],

			['Decorate(TypeSetLiteral ::= "{" Type "}") -> SemanticTypeSet', [AST.ASTNodeTypeSet, `
				type T = {int};
				% (type_set_literal)
			`]],

			['Decorate(TypeMapLiteral ::= "{" Type__0 "->" Type__1 "}") -> SemanticTypeMap', [AST.ASTNodeTypeMap, `
				type T = {int -> float};
				% (type_map_literal)
			`]],

			['Decorate(PropertyAccessorType ::= INTEGER) -> SemanticIndex', [AST.ASTNodeIndex, `
				type T = U.1;
				% (property_accessor_type)
			`]],
			['Decorate(PropertyAccessorType ::= Word) -> SemanticKey', [AST.ASTNodeKey, `
				type T = U.p;
				% (property_accessor_type)
			`]],

			['Decorate(TypeCompound ::= TypeCompound "." PropertyAccessorType) -> SemanticTypeAccess', [AST.ASTNodeTypeAccess, `
				type T = U.p;
				% (type_compound)
			`]],
			['Decorate(TypeCompound ::= TypeCompound "?." PropertyAccessorType) -> SemanticTypeAccess', [AST.ASTNodeTypeAccess, `
				type T = U?.p;
				% (type_compound)
			`]],
			['Decorate(TypeCompound ::= TypeCompound "." GenericArguments) -> SemanticTypeCall', [AST.ASTNodeTypeCall, `
				type T = List.<U>;
				% (type_compound)
			`]],

			['Decorate(TypeUnarySymbol ::= TypeUnarySymbol "?") -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				type T = U?;
				% (type_unary_symbol)
			`]],
			['Decorate(TypeUnarySymbol ::= TypeUnarySymbol "!") -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				type T = U!;
				% (type_unary_symbol)
			`]],

			['Decorate(TypeUnaryKeyword ::= "mut" TypeUnaryKeyword) -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				type T = mut U;
				% (type_unary_keyword)
			`]],

			['Decorate(TypeIntersection ::= TypeIntersection "&" TypeUnaryKeyword) -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				type T = U & V;
				% (type_intersection)
			`]],

			['Decorate(TypeUnion ::= TypeUnion "|" TypeIntersection) -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				type T = U | V;
				% (type_union)
			`]],

			/* ## Expressions */
			['Decorate(StringTemplate ::= TEMPLATE_FULL) -> SemanticTemplate', [AST.ASTNodeTemplate, `
				"""full1""";
				% (string_template)
			`]],
			['Decorate(StringTemplate ::= TEMPLATE_HEAD Expression? (TEMPLATE_MIDDLE Expression?)* TEMPLATE_TAIL) -> SemanticTemplate', [AST.ASTNodeTemplate, `
				"""hello {{ "to" }} the {{ "whole" }} great {{ "big" }} world""";
				% (string_template)
			`]],
			['Decorate(StringTemplate ::= TEMPLATE_HEAD Expression? (TEMPLATE_MIDDLE Expression?)* TEMPLATE_TAIL) -> SemanticTemplate', [AST.ASTNodeTemplate, `
				"""hello {{ """to {{ """the {{ "whole" }} great""" }} big""" }} world""";
				% (string_template)
			`]],

			['Decorate(Property ::= Word "=" Expression) -> SemanticProperty', [AST.ASTNodeProperty, `
				(a= 42);
				% (property)
			`]],
			['Decorate(Property ::= Word "=" Expression) -> SemanticProperty', [AST.ASTNodeProperty, `
				(_= 42);
				% (property)
			`]],

			['Decorate(Case ::= Expression "->" Expression) -> SemanticCase', [AST.ASTNodeCase, `
				{42 -> 6.9};
				% (case)
			`]],

			['Decorate(ExpressionGrouped ::= "(" Expression ")") -> SemanticExpression', [AST.ASTNodeExpression, `
				(42 || 6.9);
				% (expression_grouped)
			`]],

			['Decorate(TupleLiteral ::= "(" ")") -> SemanticTuple', [AST.ASTNodeTuple, `
				();
				% (tuple_literal)
			`]],
			['Decorate(TupleLiteral ::= "(" Items ")") -> SemanticTuple', [AST.ASTNodeTuple, `
				(42, 6.9);
				% (tuple_literal)
			`]],

			['Decorate(RecordLiteral ::= "(" ","? Property# ","? ")") -> SemanticRecord', [AST.ASTNodeRecord, `
				(a= 42, b= 6.9);
				% (record_literal)
			`]],

			['Decorate(ListLiteral ::= "[" "]") -> SemanticSet', [AST.ASTNodeList, `
				[];
				% (list_literal)
			`]],
			['Decorate(ListLiteral ::= "[" ","? Expression# ","? "]") -> SemanticSet', [AST.ASTNodeList, `
				[42, 6.9];
				% (list_literal)
			`]],

			['Decorate(DictLiteral ::= "[" ","? Property# ","? "]") -> SemanticRecord', [AST.ASTNodeDict, `
				[a= 42, b= 6.9];
				% (dict_literal)
			`]],

			['Decorate(SetLiteral ::= "{" "}") -> SemanticSet', [AST.ASTNodeSet, `
				{};
				% (set_literal)
			`]],
			['Decorate(SetLiteral ::= "{" ","? Expression# ","? "}") -> SemanticSet', [AST.ASTNodeSet, `
				{42, 6.9};
				% (set_literal)
			`]],

			['Decorate(MapLiteral ::= "{" ","? Case# ","? "}") -> SemanticMap', [AST.ASTNodeMap, `
				{42 -> 6.9, "hello" -> true};
				% (map_literal)
			`]],

			['Decorate(ExpressionCompound > PropertyAccessor ::= INTEGER) -> SemanticIndex', [AST.ASTNodeIndex, `
				v.1;
				% (property_accessor)
			`]],
			['Decorate(ExpressionCompound > PropertyAccessor ::= Word) -> SemanticKey', [AST.ASTNodeKey, `
				v.p;
				% (property_accessor)
			`]],
			['Decorate(ExpressionCompound > PropertyAccessor ::= "[" Expression "]") -> SemanticExpression', [AST.ASTNodeExpression, `
				v.[a + b];
				% (property_accessor)
			`]],

			['Decorate(Assignee > PropertyAccessor ::= INTEGER) -> SemanticIndex', [AST.ASTNodeIndex, `
				v.1 = false;
				% (property_accessor)
			`]],
			['Decorate(Assignee > PropertyAccessor ::= Word) -> SemanticKey', [AST.ASTNodeKey, `
				v.p = false;
				% (property_accessor)
			`]],
			['Decorate(Assignee > PropertyAccessor ::= "[" Expression "]") -> SemanticExpression', [AST.ASTNodeExpression, `
				v.[a + b] = false;
				% (property_accessor)
			`]],

			['Decorate(ExpressionCompound ::= ExpressionCompound "." PropertyAccessor) -> SemanticAccess', [AST.ASTNodeAccess, `
				v.p;
				% (expression_compound)
			`]],
			['Decorate(ExpressionCompound ::= ExpressionCompound "?." PropertyAccessor) -> SemanticAccess', [AST.ASTNodeAccess, `
				v?.p;
				% (expression_compound)
			`]],
			['skip: Decorate(ExpressionCompound ::= ExpressionCompound "!." PropertyAccessor) -> SemanticAccess', [AST.ASTNodeAccess, `
				v!.p;
				% (expression_compound)
			`]],
			['Decorate(ExpressionCompound ::= ExpressionCompound "." FunctionArguments) -> SemanticCall', [AST.ASTNodeCall, `
				List.();
				% (expression_compound)
			`]],
			['Decorate(ExpressionCompound ::= ExpressionCompound "." GenericArguments FunctionArguments) -> SemanticCall', [AST.ASTNodeCall, `
				List.<T>();
				% (expression_compound)
			`]],

			['Decorate(Assignee ::= IDENTIFIER) -> SemanticVariable', [AST.ASTNodeVariable, `
				v = 42;
				% (assignee)
			`]],
			['Decorate(Assignee ::= ExpressionCompound "." PropertyAccessor) -> SemanticAccess', [AST.ASTNodeAccess, `
				v.1 = 42;
				% (assignee)
			`]],

			['Decorate(ExpressionUnarySymbol ::= "!" ExpressionUnarySymbol) -> SemanticOperation', [AST.ASTNodeOperation, `
				!v;
				% (expression_unary_symbol)
			`]],
			['Decorate(ExpressionUnarySymbol ::= "?" ExpressionUnarySymbol) -> SemanticOperation', [AST.ASTNodeOperation, `
				?v;
				% (expression_unary_symbol)
			`]],
			['Decorate(ExpressionUnarySymbol ::= "+" ExpressionUnarySymbol) -> SemanticExpression', [AST.ASTNodeExpression, `
				+v;
				% (expression_unary_symbol)
			`]],
			['Decorate(ExpressionUnarySymbol ::= "-" ExpressionUnarySymbol) -> SemanticOperation', [AST.ASTNodeOperation, `
				-v;
				% (expression_unary_symbol)
			`]],

			['Decorate(ExpressionExponential ::= ExpressionUnarySymbol "^" ExpressionExponential) -> SemanticOperation', [AST.ASTNodeOperation, `
				a ^ b;
				% (expression_exponential)
			`]],

			['Decorate(ExpressionMultiplicative ::= ExpressionMultiplicative "*" ExpressionExponential) -> SemanticOperation', [AST.ASTNodeOperation, `
				a * b;
				% (expression_multiplicative)
			`]],
			['Decorate(ExpressionMultiplicative ::= ExpressionMultiplicative "/" ExpressionExponential) -> SemanticOperation', [AST.ASTNodeOperation, `
				a / b;
				% (expression_multiplicative)
			`]],

			['Decorate(ExpressionAdditive ::= ExpressionAdditive "+" ExpressionMultiplicative) -> SemanticOperation', [AST.ASTNodeOperation, `
				a + b;
				% (expression_additive)
			`]],
			['Decorate(ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative) -> SemanticOperation', [AST.ASTNodeOperation, `
				a - b;
				% (expression_additive)
			`]],

			...['<', '>', '<=', '>=', '!<', '!>', 'is', 'isnt'].map((op) => [`${ ['is', 'isnt'].includes(op) ? 'skip: ' : '' }Decorate(ExpressionComparative ::= ExpressionComparative "${ op }" ExpressionAdditive) -> SemanticOperation`, [AST.ASTNodeOperation, `
				a ${ op } b;
				% (expression_comparative)
			`]] as const),

			...['===', '!==', '==', '!='].map((op) => [`Decorate(ExpressionEquality ::= ExpressionEquality "${ op }" ExpressionComparative) -> SemanticOperation`, [AST.ASTNodeOperation, `
				a ${ op } b;
				% (expression_equality)
			`]] as const),

			['Decorate(ExpressionConjunctive ::= ExpressionConjunctive "&&" ExpressionEquality) -> SemanticOperation', [AST.ASTNodeOperation, `
				a && b;
				% (expression_conjunctive)
			`]],
			['Decorate(ExpressionConjunctive ::= ExpressionConjunctive "!&" ExpressionEquality) -> SemanticOperation', [AST.ASTNodeOperation, `
				a !& b;
				% (expression_conjunctive)
			`]],

			['Decorate(ExpressionDisjunctive ::= ExpressionDisjunctive "||" ExpressionConjunctive) -> SemanticOperation', [AST.ASTNodeOperation, `
				a || b;
				% (expression_disjunctive)
			`]],
			['Decorate(ExpressionDisjunctive ::= ExpressionDisjunctive "!|" ExpressionConjunctive) -> SemanticOperation', [AST.ASTNodeOperation, `
				a !| b;
				% (expression_disjunctive)
			`]],

			['Decorate(ExpressionConditional ::= "if" Expression "then" Expression "else" Expression) -> SemanticOperation', [AST.ASTNodeOperation, `
				if a then b else c;
				% (expression_conditional)
			`]],

			/* ## Statements */
			['Decorate(DeclarationType ::= "type" "_" "=" Type ";") -> SemanticDeclarationType', [AST.ASTNodeDeclarationType, `
				type _ = U;
				% (declaration_type)
			`]],
			['Decorate(DeclarationType ::= "type" IDENTIFIER "=" Type ";") -> SemanticDeclarationType', [AST.ASTNodeDeclarationType, `
				type T = U;
				% (declaration_type)
			`]],

			['Decorate(DeclarationVariable ::= "let" "_" ":" Type "=" Expression ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				let _: T = b;
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable ::= "let" IDENTIFIER ":" Type "=" Expression ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				let a: T = b;
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable ::= "let" "var" "_" ":" Type "=" Expression ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				let var _: T = b;
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable ::= "let" "var" IDENTIFIER ":" Type "=" Expression ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				let var a: T = b;
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable ::= "let" "var" "_" "?" ":" Type ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				let var _?: T;
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable ::= "let" "var" IDENTIFIER "?" ":" Type ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				let var a?: T;
				% (declaration_variable)
			`]],

			['Decorate(StatementExpression ::= Expression ";") -> SemanticStatementExpression', [AST.ASTNodeStatementExpression, `
				a;
				% (statement_expression)
			`]],

			['Decorate(StatementAssignment ::= Assignee "=" Expression ";") -> SemanticAssignment', [AST.ASTNodeAssignment, `
				a = b;
				% (statement_assignment)
			`]],
		]).forEach(([klass, text], description) => (description.startsWith('only:') ? specify.only : description.startsWith('skip:') ? specify.skip : specify)(description, () => {
			const parsenode: SyntaxNode = captureParseNode(...text.split('%') as [string, string]);
			return assert.ok(
				DECORATOR.decorateTS(parsenode) instanceof klass,
				`\`${ parsenode.text }\` not an instance of ${ klass.name }.`,
			);
		}));
		['is', 'isnt'].forEach((op) => describe(`Decorate(ExpressionComparative ::= ExpressionComparative "${ op }" ExpressionAdditive) -> SemanticOperation`, () => {
			it(`operator \`${ op }\` is not yet supported.`, () => {
				assert.throws(() => DECORATOR.decorateTS(captureParseNode(`
					a ${ op } b;
				`, '(expression_comparative)')), /not yet supported/);
			});
		}));
	});
});

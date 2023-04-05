import * as assert from 'assert';
import {
	Query,
	type QueryCapture,
	type SyntaxNode,
} from 'tree-sitter';
import Counterpoint from 'tree-sitter-counterpoint';
import {
	TS_PARSER,
	AST,
	DECORATOR,
} from '../../src/index.js';



describe('Decorator', () => {
	describe('#decorateTS', () => {
		function captureParseNode(source: string, query: string): SyntaxNode {
			const captures: QueryCapture[] = new Query(Counterpoint, `${ query } @capt`).captures(TS_PARSER.parse(source).rootNode);
			assert.ok(captures.length, 'could not find any captures.');
			return captures[0].node;
		}
		new Map<string, [NewableFunction, string]>([
			['Decorate(Word ::= _KEYWORD_OTHER) -> SemanticKey', [AST.ASTNodeKey, `
				{
					[mutable= 42];
				}
				% (word "mutable")
			`]],
			['Decorate(Word ::= KEYWORD_TYPE) -> SemanticKey', [AST.ASTNodeKey, `
				{
					[void= 42];
				}
				% (word (keyword_type))
			`]],
			['Decorate(Word ::= KEYWORD_VALUE) -> SemanticKey', [AST.ASTNodeKey, `
				{
					[true= 42];
				}
				% (word (keyword_value))
			`]],
			['Decorate(Word ::= IDENTIFIER) -> SemanticKey', [AST.ASTNodeKey, `
				{
					[foobar= 42];
				}
				% (word (identifier))
			`]],

			['Decorate(Type > PrimitiveLiteral ::= KEYWORD_VALUE) -> SemanticTypeConstant', [AST.ASTNodeTypeConstant, `
				{
					type T = false;
				}
				% (primitive_literal (keyword_value))
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

			['Decorate(Expression > PrimitiveLiteral ::= KEYWORD_VALUE) -> SemanticConstant', [AST.ASTNodeConstant, `
				{
					false;
				}
				% (primitive_literal (keyword_value))
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

			/* ## Types */
			['Decorate(EntryType<-Named><-Optional><-Variable> ::= Type<?Variable>) -> SemanticItemType', [AST.ASTNodeItemType, `
				{
					type T = \\[int];
				}
				% (entry_type)
			`]],
			['Decorate(EntryType<-Named><-Optional><+Variable> ::= Type<?Variable>) -> SemanticItemType', [AST.ASTNodeItemType, `
				{
					type T = [int];
				}
				% (entry_type__variable)
			`]],
			['Decorate(EntryType<-Named><+Optional><-Variable> ::= "?:" Type<?Variable>) -> SemanticItemType', [AST.ASTNodeItemType, `
				{
					type T = \\[?: int];
				}
				% (entry_type__optional)
			`]],
			['Decorate(EntryType<-Named><+Optional><+Variable> ::= "?:" Type<?Variable>) -> SemanticItemType', [AST.ASTNodeItemType, `
				{
					type T = [?: int];
				}
				% (entry_type__optional__variable)
			`]],
			['Decorate(EntryType<+Named><-Optional><-Variable> ::= Word ":" Type<?Variable>) -> SemanticPropertyType', [AST.ASTNodePropertyType, `
				{
					type T = \\[a: int];
				}
				% (entry_type__named)
			`]],
			['Decorate(EntryType<+Named><-Optional><+Variable> ::= Word ":" Type<?Variable>) -> SemanticPropertyType', [AST.ASTNodePropertyType, `
				{
					type T = [a: int];
				}
				% (entry_type__named__variable)
			`]],
			['Decorate(EntryType<+Named><+Optional><-Variable> ::= Word "?:" Type<?Variable>) -> SemanticPropertyType', [AST.ASTNodePropertyType, `
				{
					type T = \\[a?: int];
				}
				% (entry_type__named__optional)
			`]],
			['Decorate(EntryType<+Named><+Optional><+Variable> ::= Word "?:" Type<?Variable>) -> SemanticPropertyType', [AST.ASTNodePropertyType, `
				{
					type T = [a?: int];
				}
				% (entry_type__named__optional__variable)
			`]],

			['Decorate(TypeGrouped<?Variable> ::= "(" Type<?Variable> ")") -> SemanticType', [AST.ASTNodeType, `
				{
					type T = (3 | float);
				}
				% (type_grouped__variable)
			`]],

			['Decorate(TypeTupleLiteral<-Variable> ::= "\\[" "]") -> SemanticTypeTuple', [AST.ASTNodeTypeTuple, `
				{
					type T = \\[];
				}
				% (type_tuple_literal)
			`]],
			['Decorate(TypeTupleLiteral<+Variable> ::= "[" "]") -> SemanticTypeTuple', [AST.ASTNodeTypeTuple, `
				{
					type T = [];
				}
				% (type_tuple_literal__variable)
			`]],
			['Decorate(TypeTupleLiteral<-Variable> ::= "\\[" ","? ItemsType<?Variable> "]") -> SemanticTypeTuple', [AST.ASTNodeTypeTuple, `
				{
					type T = \\[int, ?: float];
				}
				% (type_tuple_literal)
			`]],
			['Decorate(TypeTupleLiteral<+Variable> ::= "[" ","? ItemsType<?Variable> "]") -> SemanticTypeTuple', [AST.ASTNodeTypeTuple, `
				{
					type T = [int, ?: float];
				}
				% (type_tuple_literal__variable)
			`]],

			['Decorate(TypeRecordLiteral<-Variable> ::= "\\[" ","? PropertiesType<?Variable> ","? "]") -> SemanticTypeRecord', [AST.ASTNodeTypeRecord, `
				{
					type T = \\[a?: int, b: float];
				}
				% (type_record_literal)
			`]],
			['Decorate(TypeRecordLiteral<+Variable> ::= "[" ","? PropertiesType<?Variable> ","? "]") -> SemanticTypeRecord', [AST.ASTNodeTypeRecord, `
				{
					type T = [a?: int, b: float];
				}
				% (type_record_literal__variable)
			`]],

			['Decorate(TypeDictLiteral ::= "[" ":" Type<+Variable> "]") -> SemanticTypeDict', [AST.ASTNodeTypeDict, `
				{
					type T = [:int];
				}
				% (type_dict_literal)
			`]],

			['Decorate(TypeMapLiteral ::= "{" Type__0<+Variable> "->" Type__1<+Variable> "}") -> SemanticTypeMap', [AST.ASTNodeTypeMap, `
				{
					type T = {int -> float};
				}
				% (type_map_literal)
			`]],

			['Decorate(PropertyAccessType ::= "." INTEGER) -> SemanticIndexType', [AST.ASTNodeIndexType, `
				{
					type T = U.1;
				}
				% (property_access_type)
			`]],
			['Decorate(PropertyAccessType ::= "." Word) -> SemanticKey', [AST.ASTNodeKey, `
				{
					type T = U.p;
				}
				% (property_access_type)
			`]],

			['Decorate(TypeCompound<Variable> ::= TypeCompound<?Variable> PropertyAccessType) -> SemanticTypeAccess', [AST.ASTNodeTypeAccess, `
				{
					type T = U.p;
				}
				% (type_compound__variable)
			`]],
			['Decorate(TypeCompound<+Variable> ::= TypeCompound<?Variable> GenericCall) -> SemanticTypeCall', [AST.ASTNodeTypeCall, `
				{
					type T = List.<U>;
				}
				% (type_compound__variable)
			`]],

			['Decorate(TypeUnarySymbol<Variable> ::= TypeUnarySymbol<?Variable> "?") -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				{
					type T = U?;
				}
				% (type_unary_symbol__variable)
			`]],
			['skip: Decorate(TypeUnarySymbol<Variable> ::= TypeUnarySymbol<?Variable> "!") -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				{
					type T = U!;
				}
				% (type_unary_symbol__variable)
			`]],
			['Decorate(TypeUnarySymbol<Variable> ::= TypeUnarySymbol<?Variable> "\\[" INTEGER "]") -> SemanticTypeList', [AST.ASTNodeTypeList, `
				{
					type T = int\\[3];
				}
				% (type_unary_symbol__variable)
			`]],
			['Decorate(TypeUnarySymbol<+Variable> ::= TypeUnarySymbol<?Variable> "[" "]") -> SemanticTypeList', [AST.ASTNodeTypeList, `
				{
					type T = U[];
				}
				% (type_unary_symbol__variable)
			`]],
			['Decorate(TypeUnarySymbol<+Variable> ::= TypeUnarySymbol<?Variable> "[" INTEGER "]") -> SemanticTypeList', [AST.ASTNodeTypeList, `
				{
					type T = U[3];
				}
				% (type_unary_symbol__variable)
			`]],
			['Decorate(TypeUnarySymbol<+Variable> ::= TypeUnarySymbol<?Variable> "{" "}") -> SemanticTypeSet', [AST.ASTNodeTypeSet, `
				{
					type T = U{};
				}
				% (type_unary_symbol__variable)
			`]],

			['Decorate(TypeUnaryKeyword<Variable> ::= "mutable" TypeUnaryKeyword<?Variable>) -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				{
					type T = mutable U;
				}
				% (type_unary_keyword__variable)
			`]],

			['Decorate(TypeIntersection<Variable> ::= TypeIntersection<?Variable> "&" TypeUnaryKeyword<?Variable>) -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				{
					type T = U & V;
				}
				% (type_intersection__variable)
			`]],

			['Decorate(TypeUnion<Variable> ::= TypeUnion<?Variable> "|" TypeIntersection<?Variable>) -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				{
					type T = U | V;
				}
				% (type_union__variable)
			`]],

			/* ## Expressions */
			['Decorate(StringTemplate<Variable> ::= TEMPLATE_FULL) -> SemanticTemplate', [AST.ASTNodeTemplate, `
				{
					"""full1""";
				}
				% (string_template__variable)
			`]],
			['Decorate(StringTemplate<Variable> ::= TEMPLATE_HEAD Expression<?Variable>? (TEMPLATE_MIDDLE Expression<?Variable>?)* TEMPLATE_TAIL) -> SemanticTemplate', [AST.ASTNodeTemplate, `
				{
					"""hello {{ "to" }} the {{ "whole" }} great {{ "big" }} world""";
				}
				% (string_template__variable)
			`]],
			['Decorate(StringTemplate<Variable> ::= TEMPLATE_HEAD Expression<?Variable>? (TEMPLATE_MIDDLE Expression<?Variable>?)* TEMPLATE_TAIL) -> SemanticTemplate', [AST.ASTNodeTemplate, `
				{
					"""hello {{ """to {{ """the {{ "whole" }} great""" }} big""" }} world""";
				}
				% (string_template__variable)
			`]],

			['Decorate(Property<Variable> ::= Word "=" Expression<?Variable>) -> SemanticProperty', [AST.ASTNodeProperty, `
				{
					[a= 42];
				}
				% (property__variable)
			`]],

			['Decorate(Case ::= Expression<+Variable> "->" Expression<+Variable>) -> SemanticCase', [AST.ASTNodeCase, `
				{
					{42 -> 6.9};
				}
				% (case)
			`]],

			['Decorate(ExpressionGrouped<Variable> ::= "(" Expression<?Variable> ")") -> SemanticExpression', [AST.ASTNodeExpression, `
				{
					(42 || 6.9);
				}
				% (expression_grouped__variable)
			`]],

			['Decorate(TupleLiteral<-Variable> ::= "\\[" "]") -> SemanticTuple', [AST.ASTNodeTuple, `
				{
					\\[];
				}
				% (tuple_literal)
			`]],
			['Decorate(TupleLiteral<+Variable> ::= "[" "]") -> SemanticTuple', [AST.ASTNodeTuple, `
				{
					[];
				}
				% (tuple_literal__variable)
			`]],
			['Decorate(TupleLiteral<-Variable> ::= "\\[" ","? Expression<?Variable># ","? "]") -> SemanticTuple', [AST.ASTNodeTuple, `
				{
					\\[42, 6.9];
				}
				% (tuple_literal)
			`]],
			['Decorate(TupleLiteral<+Variable> ::= "[" ","? Expression<?Variable># ","? "]") -> SemanticTuple', [AST.ASTNodeTuple, `
				{
					[42, 6.9];
				}
				% (tuple_literal__variable)
			`]],

			['Decorate(RecordLiteral<-Variable> ::= "\\[" ","? Property<?Variable># ","? "]") -> SemanticRecord', [AST.ASTNodeRecord, `
				{
					\\[a= 42, b= 6.9];
				}
				% (record_literal)
			`]],
			['Decorate(RecordLiteral<+Variable> ::= "[" ","? Property<?Variable># ","? "]") -> SemanticRecord', [AST.ASTNodeRecord, `
				{
					[a= 42, b= 6.9];
				}
				% (record_literal__variable)
			`]],

			['Decorate(SetLiteral ::= "{" ","? Expression<+Variable># ","? "}") -> SemanticSet', [AST.ASTNodeSet, `
				{
					{42, 6.9};
				}
				% (set_literal)
			`]],

			['Decorate(MapLiteral ::= "{" ","? Case# ","? "}") -> SemanticMap', [AST.ASTNodeMap, `
				{
					{42 -> 6.9, "hello" -> true};
				}
				% (map_literal)
			`]],

			['Decorate(PropertyAccess<Variable> ::= ("." | "?." | "!.") INTEGER) -> SemanticIndex', [AST.ASTNodeIndex, `
				{
					v.1;
				}
				% (property_access__variable)
			`]],
			['Decorate(PropertyAccess<Variable> ::= ("." | "?." | "!.") Word) -> SemanticKey', [AST.ASTNodeKey, `
				{
					v?.p;
				}
				% (property_access__variable)
			`]],
			['Decorate(PropertyAccess<Variable> ::= ("." | "?." | "!.") "[" Expression<?Variable> "]") -> SemanticExpression', [AST.ASTNodeExpression, `
				{
					v!.[a + b];
				}
				% (property_access__variable)
			`]],

			['Decorate(PropertyAssign ::= "." INTEGER) -> SemanticIndex', [AST.ASTNodeIndex, `
				{
					v.1 = false;
				}
				% (property_assign)
			`]],
			['Decorate(PropertyAssign ::= "." Word) -> SemanticKey', [AST.ASTNodeKey, `
				{
					v.p = false;
				}
				% (property_assign)
			`]],
			['Decorate(PropertyAssign ::= "." "[" Expression<+Variable> "]") -> SemanticExpression', [AST.ASTNodeExpression, `
				{
					v.[a + b] = false;
				}
				% (property_assign)
			`]],

			['Decorate(ExpressionCompound<Variable> ::= ExpressionCompound<?Variable> PropertyAccess<?Variable>) -> SemanticAccess', [AST.ASTNodeAccess, `
				{
					v.p;
				}
				% (expression_compound__variable)
			`]],
			['Decorate(ExpressionCompound<+Variable> ::= ExpressionCompound<?Variable> FunctionCall) -> SemanticCall', [AST.ASTNodeCall, `
				{
					List.<T>();
				}
				% (expression_compound__variable)
			`]],

			['Decorate(Assignee ::= IDENTIFIER) -> SemanticVariable', [AST.ASTNodeVariable, `
				{
					v = 42;
				}
				% (assignee)
			`]],
			['Decorate(Assignee ::= ExpressionCompound<+Variable> PropertyAssign) -> SemanticAccess', [AST.ASTNodeAccess, `
				{
					v.1 = 42;
				}
				% (assignee)
			`]],

			['Decorate(ExpressionUnarySymbol<Variable> ::= "!" ExpressionUnarySymbol<?Variable>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					!v;
				}
				% (expression_unary_symbol__variable)
			`]],
			['Decorate(ExpressionUnarySymbol<Variable> ::= "?" ExpressionUnarySymbol<?Variable>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					?v;
				}
				% (expression_unary_symbol__variable)
			`]],
			['Decorate(ExpressionUnarySymbol<Variable> ::= "+" ExpressionUnarySymbol<?Variable>) -> SemanticExpression', [AST.ASTNodeExpression, `
				{
					+v;
				}
				% (expression_unary_symbol__variable)
			`]],
			['Decorate(ExpressionUnarySymbol<Variable> ::= "-" ExpressionUnarySymbol<?Variable>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					-v;
				}
				% (expression_unary_symbol__variable)
			`]],

			['Decorate(ExpressionClaim<Variable> ::= "<" Type ">" ExpressionClaim<?Variable>) -> SemanticOperation', [AST.ASTNodeClaim, `
				{
					<T>a;
				}
				% (expression_claim__variable)
			`]],

			['Decorate(ExpressionExponential<Variable> ::= ExpressionClaim<?Variable> "^" ExpressionExponential<?Variable>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a ^ b;
				}
				% (expression_exponential__variable)
			`]],

			['Decorate(ExpressionMultiplicative<Variable> ::= ExpressionMultiplicative<?Variable> "*" ExpressionExponential<?Variable>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a * b;
				}
				% (expression_multiplicative__variable)
			`]],
			['Decorate(ExpressionMultiplicative<Variable> ::= ExpressionMultiplicative<?Variable> "/" ExpressionExponential<?Variable>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a / b;
				}
				% (expression_multiplicative__variable)
			`]],

			['Decorate(ExpressionAdditive<Variable> ::= ExpressionAdditive<?Variable> "+" ExpressionMultiplicative<?Variable>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a + b;
				}
				% (expression_additive__variable)
			`]],
			['Decorate(ExpressionAdditive<Variable> ::= ExpressionAdditive<?Variable> "-" ExpressionMultiplicative<?Variable>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a - b;
				}
				% (expression_additive__variable)
			`]],

			...['<', '>', '<=', '>=', '!<', '!>', 'is', 'isnt'].map((op) => [`${ (['is', 'isnt'].includes(op) ? 'skip: ' : '') }Decorate(ExpressionComparative<Variable> ::= ExpressionComparative<?Variable> "${ op }" ExpressionAdditive<?Variable>) -> SemanticOperation`, [AST.ASTNodeOperation, `
				{
					a ${ op } b;
				}
				% (expression_comparative__variable)
			`]] as [string, [NewableFunction, string]]),

			...['===', '!==', '==', '!='].map((op) => [`Decorate(ExpressionEquality<Variable> ::= ExpressionEquality<?Variable> "${ op }" ExpressionComparative<?Variable>) -> SemanticOperation`, [AST.ASTNodeOperation, `
				{
					a ${ op } b;
				}
				% (expression_equality__variable)
			`]] as [string, [NewableFunction, string]]),

			['Decorate(ExpressionConjunctive<Variable> ::= ExpressionConjunctive<?Variable> "&&" ExpressionEquality<?Variable>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a && b;
				}
				% (expression_conjunctive__variable)
			`]],
			['Decorate(ExpressionConjunctive<Variable> ::= ExpressionConjunctive<?Variable> "!&" ExpressionEquality<?Variable>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a !& b;
				}
				% (expression_conjunctive__variable)
			`]],

			['Decorate(ExpressionDisjunctive<Variable> ::= ExpressionDisjunctive<?Variable> "||" ExpressionConjunctive<?Variable>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a || b;
				}
				% (expression_disjunctive__variable)
			`]],
			['Decorate(ExpressionDisjunctive<Variable> ::= ExpressionDisjunctive<?Variable> "!|" ExpressionConjunctive<?Variable>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					a !| b;
				}
				% (expression_disjunctive__variable)
			`]],

			['Decorate(ExpressionConditional<Variable> ::= "if" Expression<?Variable> "then" Expression<?Variable> "else" Expression<?Variable>) -> SemanticOperation', [AST.ASTNodeOperation, `
				{
					if a then b else c;
				}
				% (expression_conditional__variable)
			`]],

			/* ## Statements */
			['Decorate(DeclarationType ::= "type" IDENTIFIER "=" Type<+Variable> ";") -> SemanticDeclarationType', [AST.ASTNodeDeclarationType, `
				{
					type T = U;
				}
				% (declaration_type)
			`]],

			['Decorate(DeclarationVariable ::= "let" IDENTIFIER ":" Type<+Variable> "=" Expression<+Variable> ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				{
					let a: T = b;
				}
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable ::= "let" "unfixed" IDENTIFIER ":" Type<+Variable> "=" Expression<+Variable> ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				{
					let unfixed a: T = b;
				}
				% (declaration_variable)
			`]],

			['Decorate(StatementExpression ::= Expression<+Variable> ";") -> SemanticStatementExpression', [AST.ASTNodeStatementExpression, `
				{
					a;
				}
				% (statement_expression)
			`]],

			['Decorate(StatementAssignment ::= Assignee "=" Expression<+Variable> ";") -> SemanticAssignment', [AST.ASTNodeAssignment, `
				{
					a = b;
				}
				% (statement_assignment)
			`]],

			['Decorate(Block ::= "{" Statement+ "}") -> SemanticBlock', [AST.ASTNodeBlock, `
				{
					type T = U;
					let a: T = b;
					a;
					a = b;
				}
				% (block)
			`]],
		]).forEach(([klass, text], description) => (description.slice(0, 5) === 'only:' ? specify.only : description.slice(0, 5) === 'skip:' ? specify.skip : specify)(description, () => {
			const parsenode: SyntaxNode = captureParseNode(...text.split('%') as [string, string]);
			return assert.ok(
				DECORATOR.decorateTS(parsenode) instanceof klass,
				`\`${ parsenode.text }\` not an instance of ${ klass.name }.`,
			);
		}));
		describe('Decorate(TypeUnarySymbol<Variable> ::= TypeUnarySymbol<?Variable> "!") -> SemanticTypeOperation', () => {
			it('type operator `!` is not yet supported.', () => {
				assert.throws(() => DECORATOR.decorateTS(captureParseNode(`
					{
						type T = U!;
					}
				`, '(type_unary_symbol__variable)')), /not yet supported/);
			});
		});
		['is', 'isnt'].forEach((op) => describe(`Decorate(ExpressionComparative<Variable> ::= ExpressionComparative<?Variable> "${ op }" ExpressionAdditive<?Variable>) -> SemanticOperation`, () => {
			it(`operator \`${ op }\` is not yet supported.`, () => {
				assert.throws(() => DECORATOR.decorateTS(captureParseNode(`
					{
						a ${ op } b;
					}
				`, '(expression_comparative__variable)')), /not yet supported/);
			});
		}));
	});
});

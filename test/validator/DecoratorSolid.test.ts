import * as assert from 'assert'
import Parser, {
	Query,
	QueryCapture,
	SyntaxNode,
} from 'tree-sitter';
import Counterpoint from 'tree-sitter-counterpoint';
import {
	ASTNODE_SOLID as AST,
	DECORATOR_SOLID,
} from '../../src/validator/index.js';



describe('DecoratorSolid', () => {
	describe('#decorateTS', () => {
		const parser: Parser = new Parser();
		parser.setLanguage(Counterpoint);
		function captureParseNode(source: string, query: string): SyntaxNode {
			const captures: QueryCapture[] = new Query(Counterpoint, `${ query } @capt`).captures(parser.parse(source).rootNode);
			assert.ok(captures.length, 'could not find any captures.');
			return captures[0].node;
		}
		new Map<string, [NewableFunction, string]>([
			['Decorate(Word ::= _KEYWORD_OTHER) -> SemanticKey', [AST.ASTNodeKey, `
				[mutable= 42];
				% (word "mutable")
			`]],
			['Decorate(Word ::= KEYWORD_TYPE) -> SemanticKey', [AST.ASTNodeKey, `
				[void= 42];
				% (word (keyword_type))
			`]],
			['Decorate(Word ::= KEYWORD_VALUE) -> SemanticKey', [AST.ASTNodeKey, `
				[true= 42];
				% (word (keyword_value))
			`]],
			['Decorate(Word ::= IDENTIFIER) -> SemanticKey', [AST.ASTNodeKey, `
				[foobar= 42];
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
				type T = 'hello';
				% (primitive_literal (string))
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
				'hello';
				% (primitive_literal (string))
			`]],

			/* ## Types */
			['Decorate(EntryType<-Named><-Optional> ::= Type) -> SemanticItemType', [AST.ASTNodeItemType, `
				type T = [int];
				% (entry_type)
			`]],
			['Decorate(EntryType<-Named><+Optional> ::= "?:" Type) -> SemanticItemType', [AST.ASTNodeItemType, `
				type T = [?: int];
				% (entry_type__optional)
			`]],
			['Decorate(EntryType<+Named><-Optional> ::= Word ":" Type) -> SemanticPropertyType', [AST.ASTNodePropertyType, `
				type T = [a: int];
				% (entry_type__named)
			`]],
			['Decorate(EntryType<+Named><+Optional> ::= Word "?:" Type) -> SemanticPropertyType', [AST.ASTNodePropertyType, `
				type T = [a?: int];
				% (entry_type__named__optional)
			`]],

			['Decorate(TypeGrouped ::= "(" Type ")") -> SemanticType', [AST.ASTNodeType, `
				type T = (int | float);
				% (type_grouped)
			`]],

			['Decorate(TypeTupleLiteral ::= "[" ","? ItemsType "]") -> SemanticTypeTuple', [AST.ASTNodeTypeTuple, `
				type T = [int, ?: float];
				% (type_tuple_literal)
			`]],

			['Decorate(TypeRecordLiteral ::= "[" ","? PropertiesType "]") -> SemanticTypeRecord', [AST.ASTNodeTypeRecord, `
				type T = [a?: int, b: float];
				% (type_record_literal)
			`]],

			['Decorate(TypeDictLiteral ::= "[" ":" Type "]") -> SemanticTypeDict', [AST.ASTNodeTypeDict, `
				type T = [:int];
				% (type_hash_literal)
			`]],

			['Decorate(TypeMapLiteral ::= "{" Type__0 "->" Type__1 "}") -> SemanticTypeMap', [AST.ASTNodeTypeMap, `
				type T = {int -> float};
				% (type_map_literal)
			`]],

			['Decorate(PropertyAccessType ::= "." INTEGER) -> SemanticIndexType', [AST.ASTNodeIndexType, `
				type T = U.1;
				% (property_access_type)
			`]],
			['Decorate(PropertyAccessType ::= "." Word) -> SemanticKey', [AST.ASTNodeKey, `
				type T = U.p;
				% (property_access_type)
			`]],

			['Decorate(TypeCompound ::= TypeCompound PropertyAccessType) -> SemanticTypeAccess', [AST.ASTNodeTypeAccess, `
				type T = U.p;
				% (type_compound)
			`]],
			['Decorate(TypeCompound ::= TypeCompound GenericCall) -> SemanticTypeCall', [AST.ASTNodeTypeCall, `
				type T = List.<U>;
				% (type_compound)
			`]],

			['Decorate(TypeUnarySymbol ::= TypeUnarySymbol "?") -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				type T = U?;
				% (type_unary_symbol)
			`]],
			['skip: Decorate(TypeUnarySymbol ::= TypeUnarySymbol "!") -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				type T = U!;
				% (type_unary_symbol)
			`]],
			['Decorate(TypeUnarySymbol ::= TypeUnarySymbol "[" "]") -> SemanticTypeList', [AST.ASTNodeTypeList, `
				type T = U[];
				% (type_unary_symbol)
			`]],
			['Decorate(TypeUnarySymbol ::= TypeUnarySymbol "[" INTEGER "]") -> SemanticTypeList', [AST.ASTNodeTypeList, `
				type T = U[3];
				% (type_unary_symbol)
			`]],
			['Decorate(TypeUnarySymbol ::= TypeUnarySymbol "{" "}") -> SemanticTypeSet', [AST.ASTNodeTypeSet, `
				type T = U{};
				% (type_unary_symbol)
			`]],

			['Decorate(TypeUnaryKeyword ::= "mutable" TypeUnaryKeyword) -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				type T = mutable U;
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
				'''full1''';
				% (string_template)
			`]],
			['Decorate(StringTemplate ::= TEMPLATE_HEAD Expression? (TEMPLATE_MIDDLE Expression?)* TEMPLATE_TAIL) -> SemanticTemplate', [AST.ASTNodeTemplate, `
				'''hello {{ 'to' }} the {{ 'whole' }} great {{ 'big' }} world''';
				% (string_template)
			`]],
			['Decorate(StringTemplate ::= TEMPLATE_HEAD Expression? (TEMPLATE_MIDDLE Expression?)* TEMPLATE_TAIL) -> SemanticTemplate', [AST.ASTNodeTemplate, `
				'''hello {{ '''to {{ '''the {{ 'whole' }} great''' }} big''' }} world''';
				% (string_template)
			`]],

			['Decorate(Property ::= Word "=" Expression) -> SemanticProperty', [AST.ASTNodeProperty, `
				[a= 42];
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

			['Decorate(TupleLiteral ::= "[" ","? Expression# ","? "]") -> SemanticTuple', [AST.ASTNodeTuple, `
				[42, 6.9];
				% (tuple_literal)
			`]],

			['Decorate(RecordLiteral ::= "[" ","? Property# ","? "]") -> SemanticRecord', [AST.ASTNodeRecord, `
				[a= 42, b= 6.9];
				% (record_literal)
			`]],

			['Decorate(SetLiteral ::= "{" ","? Expression# ","? "}") -> SemanticSet', [AST.ASTNodeSet, `
				{42, 6.9};
				% (set_literal)
			`]],

			['Decorate(MapLiteral ::= "{" ","? Case# ","? "}") -> SemanticMap', [AST.ASTNodeMap, `
				{42 -> 6.9, 'hello' -> true};
				% (map_literal)
			`]],

			['Decorate(PropertyAccess ::= ("." | "?." | "!.") INTEGER) -> SemanticIndex', [AST.ASTNodeIndex, `
				v.1;
				% (property_access)
			`]],
			['Decorate(PropertyAccess ::= ("." | "?." | "!.") Word) -> SemanticKey', [AST.ASTNodeKey, `
				v?.p;
				% (property_access)
			`]],
			['Decorate(PropertyAccess ::= ("." | "?." | "!.") "[" Expression "]") -> SemanticExpression', [AST.ASTNodeExpression, `
				v!.[a + b];
				% (property_access)
			`]],

			['Decorate(PropertyAssign ::= "." INTEGER) -> SemanticIndex', [AST.ASTNodeIndex, `
				v.1 = false;
				% (property_assign)
			`]],
			['Decorate(PropertyAssign ::= "." Word) -> SemanticKey', [AST.ASTNodeKey, `
				v.p = false;
				% (property_assign)
			`]],
			['Decorate(PropertyAssign ::= "." "[" Expression "]") -> SemanticExpression', [AST.ASTNodeExpression, `
				v.[a + b] = false;
				% (property_assign)
			`]],

			['Decorate(ExpressionCompound ::= ExpressionCompound PropertyAccess) -> SemanticAccess', [AST.ASTNodeAccess, `
				v.p;
				% (expression_compound)
			`]],
			['Decorate(ExpressionCompound ::= ExpressionCompound FunctionCall) -> SemanticCall', [AST.ASTNodeCall, `
				List.<T>();
				% (expression_compound)
			`]],

			['Decorate(Assignee ::= IDENTIFIER) -> SemanticVariable', [AST.ASTNodeVariable, `
				v = 42;
				% (assignee)
			`]],
			['Decorate(Assignee ::= ExpressionCompound PropertyAssign) -> SemanticAccess', [AST.ASTNodeAccess, `
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

			...['<', '>', '<=', '>=', '!<', '!>', 'is', 'isnt'].map((op) => [`${ (['is', 'isnt'].includes(op) ? 'skip: ' : '') }Decorate(ExpressionComparative ::= ExpressionComparative "${ op }" ExpressionAdditive) -> SemanticOperation`, [AST.ASTNodeOperation, `
				a ${ op } b;
				% (expression_comparative)
			`]] as [string, [NewableFunction, string]]),

			...['===', '!==', '==', '!='].map((op) => [`Decorate(ExpressionEquality ::= ExpressionEquality "${ op }" ExpressionComparative) -> SemanticOperation`, [AST.ASTNodeOperation, `
				a ${ op } b;
				% (expression_equality)
			`]] as [string, [NewableFunction, string]]),

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
			['Decorate(DeclarationType ::= "type" IDENTIFIER "=" Type ";") -> SemanticDeclarationType', [AST.ASTNodeDeclarationType, `
				type T = U;
				% (declaration_type)
			`]],

			['Decorate(DeclarationVariable ::= "let" IDENTIFIER ":" Type "=" Expression ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				let a: T = b;
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable ::= "let" "unfixed" IDENTIFIER ":" Type "=" Expression ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				let unfixed a: T = b;
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
		]).forEach(([klass, text], description) => (description.slice(0, 5) === 'skip:' ? specify.skip : specify)(description, () => {
			const parsenode: SyntaxNode = captureParseNode(...text.split('%') as [string, string]);
			return assert.ok(
				DECORATOR_SOLID.decorateTS(parsenode) instanceof klass,
				`\`${ parsenode.text }\` not an instance of ${ klass.name }.`,
			);
		}));
		describe('Decorate(TypeUnarySymbol ::= TypeUnarySymbol "!") -> SemanticTypeOperation', () => {
			it('type operator `!` is not yet supported.', () => {
				return assert.throws(() => DECORATOR_SOLID.decorateTS(captureParseNode(`
					type T = U!;
				`, '(type_unary_symbol)')), /not yet supported/);
			});
		});
		['is', 'isnt'].forEach((op) => describe(`Decorate(ExpressionComparative ::= ExpressionComparative "${ op }" ExpressionAdditive) -> SemanticOperation`, () => {
			it(`operator \`${ op }\` is not yet supported.`, () => {
				return assert.throws(() => DECORATOR_SOLID.decorateTS(captureParseNode(`
					a ${ op } b;
				`, '(expression_comparative)')), /not yet supported/);
			});
		}));
	});
})

import {
	Token,
	ParseError01,
} from '@chharvey/parser';
import * as assert from 'assert'
import {
	Dev,
} from '../../src/core/index.js';
import {
	Punctuator,
	Keyword,
	TOKEN,
	PARSER,
	ParserSolid,
} from '../../src/parser/index.js';
import {
	assert_arrayLength,
} from '../assert-helpers.js';
import * as h from '../helpers-parse.js';



describe('ParserSolid', () => {
	describe('#parse', () => {
		Dev.supports('literalCollection') && describe('Word ::= KEYWORD | IDENTIFIER', () => {
			it('makes a Word node.', () => {
				/*
					<Word>
						<KEYWORD>unfixed</KEYWORD> or <IDENTIFIER>foobar</IDENTIFIER>
					</Word>
				*/
				const srcs: string[] = [
					`unfixed`,
					`foobar`,
				];
				assert.deepStrictEqual(srcs.map((src) =>
					h.wordFromString(src).source
				), srcs);
			});
		});

		Dev.supports('literalCollection') && describe('TypeTupleLiteral ::= "[" (","? ItemsType)? "]"', () => {
			/*
				<TypeTupleLiteral>
					<PUNCTUATOR>[</PUNCTUATOR>
					<ItemsType source="T, U | V, W & X!">...</ItemsType>
					<PUNCTUATOR>]</PUNCTUATOR>
				</TypeTupleLiteral>
			*/
			it('with no leading comma.', () => {
				const tuple: PARSER.ParseNodeTypeTupleLiteral = h.tupleTypeFromString(`[T, U | V, W & X!]`);
				assert_arrayLength(tuple.children, 3);
				assert.deepStrictEqual(
					tuple.children.map((c) => c.source),
					[Punctuator.BRAK_OPN, `T , U | V , W & X !`, Punctuator.BRAK_CLS],
				);
			});
			it('with leading comma.', () => {
				const tuple: PARSER.ParseNodeTypeTupleLiteral = h.tupleTypeFromString(`
					[
						, T
						, U | V
						, W & X!
					]
				`);
				assert_arrayLength(tuple.children, 4);
				assert.deepStrictEqual(
					tuple.children.map((c) => c.source),
					[Punctuator.BRAK_OPN, Punctuator.COMMA, `T , U | V , W & X !`, Punctuator.BRAK_CLS],
				);
			});
		});

		Dev.supports('literalCollection') && describe('TypeRecordLiteral ::= "[" ","? PropertiesType "]"', () => {
			/*
				<TypeRecordLiteral>
					<PUNCTUATOR>[</PUNCTUATOR>
					<PropertiesType source="a: T, b: U | V, c: W & X!">...</PropertiesType>
					<PUNCTUATOR>]</PUNCTUATOR>
				</TypeRecordLiteral>
			*/
			it('with no leading comma.', () => {
				const record: PARSER.ParseNodeTypeRecordLiteral = h.recordTypeFromString(`[a: T, b: U | V, c: W & X!]`);
				assert_arrayLength(record.children, 3);
				assert.deepStrictEqual(
					record.children.map((c) => c.source),
					[Punctuator.BRAK_OPN, `a : T , b : U | V , c : W & X !`, Punctuator.BRAK_CLS],
				);
			});
			it('with leading comma.', () => {
				const record: PARSER.ParseNodeTypeRecordLiteral = h.recordTypeFromString(`
					[
						, a: T
						, b: U | V
						, c: W & X!
					]
				`);
				assert_arrayLength(record.children, 4);
				assert.deepStrictEqual(
					record.children.map((c) => c.source),
					[Punctuator.BRAK_OPN, Punctuator.COMMA, `a : T , b : U | V , c : W & X !`, Punctuator.BRAK_CLS],
				);
			});
		});

		describe('TypeUnit ::= IDENTIFIER', () => {
			it('parses type identifiers.', () => {
				assert.deepStrictEqual([
					`T`,
					`U`,
					`V`,
				].map((src) => h.tokenIdentifierFromTypeString(src).source), [
					`T`,
					`U`,
					`V`,
				]);
			});
		});

		describe('TypeUnit ::= PrimitiveLiteral', () => {
			it('parses NULL, BOOLEAN, INTEGER, FLOAT, or STRING.', () => {
				assert.deepStrictEqual(([
					[`null`,   TOKEN.TokenKeyword],
					[`false`,  TOKEN.TokenKeyword],
					[`true`,   TOKEN.TokenKeyword],
					[`42`,     TOKEN.TokenNumber],
					[`4.2e+1`, TOKEN.TokenNumber],
				] as [string, typeof TOKEN.TokenKeyword | typeof TOKEN.TokenNumber][]).map(([src, tokentype]) => {
					const token: TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString = h.tokenLiteralFromTypeString(src)
					assert.ok(token instanceof tokentype)
					return token.source
				}), [
					Keyword.NULL,
					Keyword.FALSE,
					Keyword.TRUE,
					'42',
					'4.2e+1',
				]);
			})
		})

		describe('TypeUnit ::= TypeKeyword', () => {
			it('parses keywords `bool`, `int`, `float`, `str`, `obj`.', () => {
				assert.deepStrictEqual(([
					`bool`,
					`int`,
					`float`,
					`str`,
					`obj`,
				]).map((src) => h.tokenKeywordFromTypeString(src).source), [
					Keyword.BOOL,
					Keyword.INT,
					Keyword.FLOAT,
					Keyword.STR,
					Keyword.OBJ,
				]);
			})
			it('throws when given a non-type keyword.', () => {
				assert.throws(() => h.tokenLiteralFromTypeString(`isnt`), ParseError01)
			})
		})

		Dev.supports('literalCollection') && specify('TypeUnit ::= TypeTupleLiteral', () => {
			h.tupleTypeFromString(`[T, U | V, W & X!]`); // assert does not throw
		});

		Dev.supports('literalCollection') && specify('TypeUnit ::= TypeRecordLiteral', () => {
			h.recordTypeFromString(`[a: T, b: U | V, c: W & X!]`); // assert does not throw
		});

		describe('TypeUnit ::= "(" Type ")"', () => {
			it('makes an TypeUnit node containing a Type node.', () => {
				/*
					<TypeUnit>
						<PUNCTUATOR>(</PUNCTUATOR>
						<Type source="(obj | int) & float">...</Type>
						<PUNCTUATOR>)</PUNCTUATOR>
					</TypeUnit>
				*/
				const type_unit: PARSER.ParseNodeTypeUnit = h.unitTypeFromString(`(obj | int & float)`)
				assert_arrayLength(type_unit.children, 3)
				const [open, typ, close]: readonly [Token, PARSER.ParseNodeType, Token] = type_unit.children
				assert.ok(open  instanceof TOKEN.TokenPunctuator)
				assert.ok(close instanceof TOKEN.TokenPunctuator)
				assert.deepStrictEqual(
					[open.source, typ.source, close.source],
					[Punctuator.GRP_OPN, [
						Keyword.OBJ,
						Punctuator.UNION,
						Keyword.INT,
						Punctuator.INTER,
						Keyword.FLOAT,
					].join(' '), Punctuator.GRP_CLS],
				)
			})
		})

		describe('TypeUnarySymbol ::= TypeUnarySymbol ("?" | "!")', () => {
			it('makes a ParseNodeTypeUnarySymbol node.', () => {
				/*
					<TypeUnarySymbol>
						<TypeUnarySymbol source="int">...</TypeUnarySymbol>
						<PUNCTUATOR>?</PUNCTUATOR>
					</TypeUnarySymbol>
				*/
				assert.deepStrictEqual([
					`int?`,
					`float!`,
				].map((src) => {
					const type_unary: PARSER.ParseNodeTypeUnarySymbol = h.unaryTypeFromString(src);
					assert_arrayLength(type_unary.children, 2);
					const [unary, op]: readonly [PARSER.ParseNodeTypeUnarySymbol, Token] = type_unary.children;
					assert.ok(op instanceof TOKEN.TokenPunctuator);
					return [unary.source, op.source];
				}), [
					[Keyword.INT,   Punctuator.ORNULL],
					[Keyword.FLOAT, Punctuator.OREXCP],
				]);
			})
		})

		describe('TypeIntersection ::= TypeIntersection "&" TypeUnarySymbol', () => {
			it('makes a ParseNodeTypeIntersection node.', () => {
				/*
					<TypeIntersection>
						<TypeIntersection source="int">...</TypeIntersection>
						<PUNCTUATOR>&</PUNCTUATOR>
						<TypeUnarySymbol source="float">...</TypeUnarySymbol>
					</TypeIntersection>
				*/
				const type_intersection: PARSER.ParseNodeTypeIntersection = h.intersectionTypeFromString(`int & float`)
				assert_arrayLength(type_intersection.children, 3)
				const [left, op, right]: readonly [PARSER.ParseNodeTypeIntersection, Token, PARSER.ParseNodeTypeUnarySymbol] = type_intersection.children
				assert.ok(op instanceof TOKEN.TokenPunctuator)
				assert.deepStrictEqual(
					[left.source, op.source,        right.source],
					[Keyword.INT, Punctuator.INTER, Keyword.FLOAT],
				)
			})
		})

		describe('TypeUnion ::= TypeUnion "|" TypeIntersection', () => {
			it('makes a ParseNodeTypeUnion node.', () => {
				/*
					<TypeUnion>
						<TypeUnion source="int">...</TypeUnion>
						<PUNCTUATOR>|</PUNCTUATOR>
						<TypeIntersection source="float">...</TypeIntersection>
					</TypeUnion>
				*/
				const type_union: PARSER.ParseNodeTypeUnion = h.unionTypeFromString(`int | float`)
				assert_arrayLength(type_union.children, 3)
				const [left, op, right]: readonly [PARSER.ParseNodeTypeUnion, Token, PARSER.ParseNodeTypeIntersection] = type_union.children
				assert.ok(op instanceof TOKEN.TokenPunctuator)
				assert.deepStrictEqual(
					[left.source, op.source,        right.source],
					[Keyword.INT, Punctuator.UNION, Keyword.FLOAT],
				)
			})
		})

		Dev.supports('stringTemplate-parse') && describe('StringTemplate', () => {
			specify('StringTemplate ::= TEMPLATE_FULL', () => {
				h.templateSources(h.stringTemplateFromSource(`
					'''full1''';
				`), `'''full1'''`);
			});
			specify('StringTemplate ::= TEMPLATE_HEAD TEMPLATE_TAIL', () => {
				h.templateSources(h.stringTemplateFromSource(`
					'''head1{{}}tail1''';
				`), `'''head1{{`, `}}tail1'''`);
			});
			specify('StringTemplate ::= TEMPLATE_HEAD Expression TEMPLATE_TAIL', () => {
				h.templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}tail1''';
				`), `'''head1{{`, `'''full1'''`, `}}tail1'''`);
			});
			specify('StringTemplate ::= TEMPLATE_HEAD StringTemplate__0__List TEMPLATE_TAIL', () => {
				h.templateSources(h.stringTemplateFromSource(`
					'''head1{{}}midd1{{}}tail1''';
				`), `'''head1{{`, `}}midd1{{`, `}}tail1'''`);
			});
			specify('StringTemplate ::= TEMPLATE_HEAD Expression StringTemplate__0__List TEMPLATE_TAIL', () => {
				h.templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}midd1{{}}tail1''';
				`), `'''head1{{`, `'''full1'''`, `}}midd1{{`, `}}tail1'''`);
			});

			specify('StringTemplate__0__List ::= TEMPLATE_MIDDLE Expression', () => {
				h.templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}tail1''';
				`), `'''head1{{`, `'''full1'''`, `}}midd1{{`, `'''full2'''`, `}}tail1'''`);
			});
			specify('StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE', () => {
				h.templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{}}tail1''';
				`), `'''head1{{`, `'''full1'''`, `}}midd1{{`, `'''full2'''`, `}}midd2{{`, `}}tail1'''`);
			});
			specify('StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE Expression', () => {
				h.templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{ '''head2{{ '''full3''' }}tail2''' }}tail1''';
				`), `'''head1{{`, `'''full1'''`, `}}midd1{{`, `'''full2'''`, `}}midd2{{`, `'''head2{{ '''full3''' }}tail2'''`, `}}tail1'''`);
			});

			it('throws when reaching an orphaned head.', () => {
				assert.throws(() => new ParserSolid().parse(`
					'''A string template head token not followed by a middle or tail {{ 1;
				`), ParseError01);
			})
			it('throws when reaching an orphaned middle.', () => {
				assert.throws(() => new ParserSolid().parse(`
					2 }} a string template middle token not preceded by a head/middle and not followed by a middle/tail {{ 3;
				`), ParseError01);
			})
			it('throws when reaching an orphaned tail.', () => {
				assert.throws(() => new ParserSolid().parse(`
					4 }} a string template tail token not preceded by a head or middle''';
				`), ParseError01);
			})
		});

		Dev.supports('literalCollection') && describe('Property ::= Word "=" Expression', () => {
			it('makes a Property node.', () => {
				/*
					<Property>
						<Word source="unfixed">...</Word>
						<PUNCTUATOR>=</PUNCTUATOR>
						<Expression source="42">...</Expression>
					</Property>
				*/
				const srcs: string[] = [
					`unfixed`,
					`foobar`,
				];
				assert.deepStrictEqual(
					srcs.map((src) => h.propertyFromString(`${ src }= 42`).children.map((c) => c.source)),
					srcs.map((src) => [src, Punctuator.ASSIGN, `42`]),
				);
			});
		});

		Dev.supports('literalCollection') && describe('Case ::= Expression "|->" Expression', () => {
			it('makes a Case node.', () => {
				/*
					<Case>
						<Expression source="42">...</Expression>
						<PUNCTUATOR>|-></PUNCTUATOR>
						<Expression source="null || false">...</Expression>
					</Case>
				*/
				assert.deepStrictEqual(
					h.caseFromString(`42 |-> null || false`).children.map((c) => c.source),
					[`42`, Punctuator.MAPTO, `null || false`],
				);
			});
		});

		Dev.supports('literalCollection') && describe('TupleLiteral ::= "[" (","? Expression# ","?)? "]"', () => {
			it('with no leading or trailing comma.', () => {
				/*
					<TupleLiteral>
						<PUNCTUATOR>[</PUNCTUATOR>
						<TupleLiteral__0__List source="42, true, null || false">...</TupleLiteral__0__List>
						<PUNCTUATOR>]</PUNCTUATOR>
					</TupleLiteral>
				*/
				const unit: PARSER.ParseNodeTupleLiteral = h.tupleLiteralFromSource(`[42, true, null || false];`);
				assert_arrayLength(unit.children, 3);
				assert.deepStrictEqual(
					unit.children.map((c) => c.source),
					[Punctuator.BRAK_OPN, `42 , true , null || false`, Punctuator.BRAK_CLS],
				);
			});
			it('with leading comma.', () => {
				const unit: PARSER.ParseNodeTupleLiteral = h.tupleLiteralFromSource(`
					[
						, 42
						, true
						, null || false
					];
				`);
				assert_arrayLength(unit.children, 4);
				assert.deepStrictEqual(
					unit.children.map((c) => c.source),
					[Punctuator.BRAK_OPN, Punctuator.COMMA, `42 , true , null || false`, Punctuator.BRAK_CLS],
				);
			});
			it('with trailing comma.', () => {
				const unit: PARSER.ParseNodeTupleLiteral = h.tupleLiteralFromSource(`
					[
						42,
						true,
						null || false,
					];
				`);
				assert_arrayLength(unit.children, 4);
				assert.deepStrictEqual(
					unit.children.map((c) => c.source),
					[Punctuator.BRAK_OPN, `42 , true , null || false`, Punctuator.COMMA, Punctuator.BRAK_CLS],
				);
			});
			specify('TupleLiteral__0__List ::= TupleLiteral__0__List "," Expression', () => {
				/*
					<TupleLiteral__0__List>
						<TupleLiteral__0__List>
							<TupleLiteral__0__List>
								<Expression source="42">...</Expression>
							</TupleLiteral__0__List>
							<PUNCTUATOR>,</PUNCTUATOR>
							<Expression source="true">...</Expression>
						</TupleLiteral__0__List>
						<PUNCTUATOR>,</PUNCTUATOR>
						<Expression source="null || false">...</Expression>
					</TupleLiteral__0__List>
				*/
				const unit: PARSER.ParseNodeTupleLiteral = h.tupleLiteralFromSource(`[42, true, null || false];`);
				assert_arrayLength(unit.children, 3);
				h.hashListSources(unit.children[1], `42`, `true`, `null || false`);
			});
		});

		Dev.supports('literalCollection') && describe('RecordLiteral ::= "[" ","? Property# ","? "]"', () => {
			it('with leading comma.', () => {
				/*
					<RecordLiteral>
						<PUNCTUATOR>[</PUNCTUATOR>
						<PUNCTUATOR>,</PUNCTUATOR>
						<RecordLiteral__0__List source="let= true, foobar= 42">...</RecordLiteral__0__List>
						<PUNCTUATOR>]</PUNCTUATOR>
					</RecordLiteral>
				*/
				const unit: PARSER.ParseNodeRecordLiteral = h.recordLiteralFromSource(`
					[
						, let= true
						, foobar= 42
					];
				`);
				assert_arrayLength(unit.children, 4);
				assert.ok(unit.children[2] instanceof PARSER.ParseNodeRecordLiteral__0__List);
				assert.deepStrictEqual(
					unit.children.map((c) => c.source),
					[Punctuator.BRAK_OPN, Punctuator.COMMA, `let = true , foobar = 42`, Punctuator.BRAK_CLS],
				);
			});
			specify('RecordLiteral__0__List ::= RecordLiteral__0__List "," Property', () => {
				/*
					<RecordLiteral__0__List>
						<RecordLiteral__0__List>
							<Property source="let= true">...</Property>
						</RecordLiteral__0__List>
						<PUNCTUATOR>,</PUNCTUATOR>
						<Property source="foobar= 42">...</Property>
					</RecordLiteral__0__List>
				*/
				const unit: PARSER.ParseNodeRecordLiteral = h.recordLiteralFromSource(`[let= true, foobar= 42];`);
				assert_arrayLength(unit.children, 3);
				h.hashListSources(unit.children[1], `let = true`, `foobar = 42`);
			});
		});


		context('ExpressionUnit ::= PrimitiveLiteral', () => {
			it('parses IDENTIFIER.', () => {
				assert.strictEqual(h.tokenIdentifierFromSource(`ident;`).source, 'ident')
			})
			it('parses NULL, BOOLEAN, INTEGER, FLOAT, or STRING.', () => {
				assert.deepStrictEqual(([
					[`null;`,   TOKEN.TokenKeyword],
					[`false;`,  TOKEN.TokenKeyword],
					[`true;`,   TOKEN.TokenKeyword],
					[`42;`,     TOKEN.TokenNumber],
					[`4.2e+1;`, TOKEN.TokenNumber],
				] as [string, typeof TOKEN.TokenKeyword | typeof TOKEN.TokenNumber][]).map(([src, tokentype]) => {
					const token: TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString = h.tokenLiteralFromSource(src)
					assert.ok(token instanceof tokentype)
					return token.source
				}), [
					Keyword.NULL,
					Keyword.FALSE,
					Keyword.TRUE,
					'42',
					'4.2e+1',
				]);
			})
		})

		Dev.supports('literalCollection') && specify('ExpressionUnit ::= TupleLiteral', () => {
			h.tupleLiteralFromSource(`[, 42, true, null || false,];`); // assert does not throw
		});

		Dev.supports('literalCollection') && specify('ExpressionUnit ::= RecordLiteral', () => {
			h.recordLiteralFromSource(`
				[
					, let= true
					, foobar= 42
					,
				];
			`); // assert does not throw
		});

		context('ExpressionUnit ::= "(" Expression ")"', () => {
			it('makes an ExpressionUnit node containing an Expression node.', () => {
				/*
					<ExpressionUnit>
						<PUNCTUATOR>(</PUNCTUATOR>
						<Expression source="2 + -3">...</Expression>
						<PUNCTUATOR>)</PUNCTUATOR>
					</ExpressionUnit>
				*/
				const expression_unit: PARSER.ParseNodeExpressionUnit = h.unitExpressionFromSource(`(2 + -3);`)
				assert_arrayLength(expression_unit.children, 3)
				const [open, expr, close]: readonly [Token, PARSER.ParseNodeExpression, Token] = expression_unit.children
				assert.ok(open  instanceof TOKEN.TokenPunctuator)
				assert.ok(close instanceof TOKEN.TokenPunctuator)
				assert.deepStrictEqual(
					[open.source,        expr.source, close.source],
					[Punctuator.GRP_OPN, `2 + -3`,    Punctuator.GRP_CLS],
				)
			})
		})

		context('ExpressionExponential ::=  ExpressionUnarySymbol "^" ExpressionExponential', () => {
			it('makes a ParseNodeExpressionExponential node.', () => {
				/*
					<ExpressionExponential>
						<ExpressionUnarySymbol source="2">...</ExpressionUnarySymbol>
						<PUNCTUATOR>^</PUNCTUATOR>
						<ExpressionExponential source="-3">...</ExpressionExponential>
					</ExpressionExponential>
				*/
				const expression_exp: PARSER.ParseNodeExpressionExponential = h.exponentialExpressionFromSource(`2 ^ -3;`)
				assert_arrayLength(expression_exp.children, 3, 'exponential expression should have 3 children')
				const [left, op, right]: readonly [PARSER.ParseNodeExpressionUnarySymbol, Token, PARSER.ParseNodeExpressionExponential] = expression_exp.children
				assert.ok(op instanceof TOKEN.TokenPunctuator)
				assert.deepStrictEqual(
					[left.source, op.source,      right.source],
					['2',         Punctuator.EXP, '-3'],
				)
			})
		})

		context('ExpressionMultiplicative ::= ExpressionMultiplicative ("*" | "/") ExpressionExponential', () => {
			it('makes a ParseNodeExpressionMultiplicative node.', () => {
				/*
					<ExpressionMultiplicative>
						<ExpressionMultiplicative source="2">...</ExpressionMultiplicative>
						<PUNCTUATOR>*</PUNCTUATOR>
						<ExpressionExponential source="-3">...</ExpressionExponential>
					</ExpressionMultiplicative>
				*/
				const expression_mul: PARSER.ParseNodeExpressionMultiplicative = h.multiplicativeExpressionFromSource(`2 * -3;`)
				assert_arrayLength(expression_mul.children, 3, 'multiplicative expression should have 3 children')
				const [left, op, right]: readonly [PARSER.ParseNodeExpressionMultiplicative, Token, PARSER.ParseNodeExpressionExponential] = expression_mul.children
				assert.ok(op instanceof TOKEN.TokenPunctuator)
				assert.deepStrictEqual(
					[left.source, op.source,      right.source],
					['2',         Punctuator.MUL, '-3'],
				)
			})
		})

		context('ExpressionAdditive ::= ExpressionAdditive ("+" | "-") ExpressionMultiplicative', () => {
			it('makes a ParseNodeExpressionAdditive node.', () => {
				/*
					<ExpressionAdditive>
						<ExpressionAdditive source="2">...</ExpressionAdditive>
						<PUNCTUATOR>+</PUNCTUATOR>
						<ExpressionMultiplicative source="-3">...</ExpressionMultiplicative>
					</ExpressionAdditive>
				*/
				const expression_add: PARSER.ParseNodeExpressionAdditive = h.additiveExpressionFromSource(`2 + -3;`)
				assert_arrayLength(expression_add.children, 3, 'additive expression should have 3 children')
				const [left, op, right]: readonly [PARSER.ParseNodeExpressionAdditive, Token, PARSER.ParseNodeExpressionMultiplicative] = expression_add.children
				assert.ok(op instanceof TOKEN.TokenPunctuator)
				assert.deepStrictEqual(
					[left.source, op.source,      right.source],
					['2',         Punctuator.ADD, '-3'],
				)
			})
		})

		context('ExpressionComparative ::= ExpressionComparative ("<" | ">" | "<=" | ">=" | "!<" | "!>" | "is" | "isnt") ExpressionAdditive', () => {
			it('makes a ParseNodeExpressionComparative node.', () => {
				/*
					<ExpressionComparative>
						<ExpressionComparative source="2">...</ExpressionComparative>
						<PUNCTUATOR>&lt;</PUNCTUATOR>
						<ExpressionAdditive source="-3">...</ExpressionAdditive>
					</ExpressionComparative>
				*/
				assert.deepStrictEqual([
					`2 < -3;`,
					`2 is -3;`,
				].map((src, i) => {
					const expression_compare: PARSER.ParseNodeExpressionComparative = h.comparativeExpressionFromSource(src);
					assert_arrayLength(expression_compare.children, 3, 'comparative expression should have 3 children');
					const [left, op, right]: readonly [PARSER.ParseNodeExpressionComparative, Token, PARSER.ParseNodeExpressionAdditive] = expression_compare.children;
					assert.ok(op instanceof [TOKEN.TokenPunctuator, TOKEN.TokenKeyword][i]);
					return [left.source, op.source, right.source];
				}), [
					['2', Punctuator.LT, '-3'],
					['2', Keyword.IS,    '-3'],
				]);
			})
			it('allows chaining of `<` and `>`.', () => {
				const expression_compare: PARSER.ParseNodeExpressionComparative = h.comparativeExpressionFromSource(`2 < 3 > 4;`)
				assert_arrayLength(expression_compare.children, 3, 'comparative expression should have 3 children')
				const [left, op, right]: readonly [PARSER.ParseNodeExpressionComparative, Token, PARSER.ParseNodeExpressionAdditive] = expression_compare.children
				assert.ok(op instanceof TOKEN.TokenPunctuator)
				assert.deepStrictEqual(
					[left.source, op.source,     right.source],
					['2 < 3',     Punctuator.GT, '4'],
				)
			})
		})

		context('ExpressionEquality ::= ExpressionEquality ("===" | "!==" | "==" | "!=") ExpressionComparative', () => {
			it('makes a ParseNodeExpressionEquality node.', () => {
				/*
					<ExpressionEquality>
						<ExpressionEquality source="2">...</ExpressionEquality>
						<PUNCTUATOR>===</PUNCTUATOR>
						<ExpressionComparative source="-3">...</ExpressionComparative>
					</ExpressionEquality>
				*/
				assert.deepStrictEqual([
					`2 === -3;`,
					`2 == -3;`,
				].map((src) => {
					const expression_eq: PARSER.ParseNodeExpressionEquality = h.equalityExpressionFromSource(src)
					assert_arrayLength(expression_eq.children, 3, 'equality expression should have 3 children')
					const [left, op, right]: readonly [PARSER.ParseNodeExpressionEquality, Token, PARSER.ParseNodeExpressionComparative] = expression_eq.children
					assert.ok(op instanceof TOKEN.TokenPunctuator);
					return [left.source, op.source, right.source]
				}), [
					['2', Punctuator.ID, '-3'],
					['2', Punctuator.EQ, '-3'],
				])
			})
		})

		context('ExpressionConjunctive ::= ExpressionConjunctive ("&&" | "!&") ExpressionEquality', () => {
			it('makes a ParseNodeExpressionConjunctive node.', () => {
				/*
					<ExpressionConjunctive>
						<ExpressionConjunctive source="2">...</ExpressionConjunctive>
						<PUNCTUATOR>&&</PUNCTUATOR>
						<ExpressionAdditive source="-3">...</ExpressionAdditive>
					</ExpressionConjunctive>
				*/
				const expression_conj: PARSER.ParseNodeExpressionConjunctive = h.conjunctiveExpressionFromSource(`2 && -3;`)
				assert_arrayLength(expression_conj.children, 3, 'conjunctive expression should have 3 children')
				const [left, op, right]: readonly [PARSER.ParseNodeExpressionConjunctive, Token, PARSER.ParseNodeExpressionEquality] = expression_conj.children
				assert.ok(op instanceof TOKEN.TokenPunctuator)
				assert.deepStrictEqual(
					[left.source, op.source,      right.source],
					['2',         Punctuator.AND, '-3'],
				)
			})
		})

		context('ExpressionDisjunctive ::= ExpressionDisjunctive ("||" | "!|") ExpressionConjunctive', () => {
			it('makes a ParseNodeExpressionDisjunctive node.', () => {
				/*
					<ExpressionDisjunctive>
						<ExpressionDisjunctive source="2">...</ExpressionDisjunctive>
						<PUNCTUATOR>||</PUNCTUATOR>
						<ExpressionConjunctive source="-3">...</ExpressionConjunctive>
					</ExpressionDisjunctive>
				*/
				const expression_disj: PARSER.ParseNodeExpressionDisjunctive = h.disjunctiveExpressionFromSource(`2 || -3;`)
				assert_arrayLength(expression_disj.children, 3, 'disjunctive expression should have 3 children')
				const [left, op, right]: readonly [PARSER.ParseNodeExpressionDisjunctive, Token, PARSER.ParseNodeExpressionConjunctive] = expression_disj.children
				assert.ok(op instanceof TOKEN.TokenPunctuator)
				assert.deepStrictEqual(
					[left.source, op.source,     right.source],
					['2',         Punctuator.OR, '-3'],
				)
			})
		})

		context('ExpressionConditional ::= "if" Expression "then" Expression "else" Expression', () => {
			it('makes a ParseNodeExpressionConditional node.', () => {
				/*
					<ExpressionConditional>
						<KEYWORD>if</KEYWORD>
						<Expression source="true">...</Expression>
						<KEYWORD>then</KEYWORD>
						<Expression source="2">...</Expression>
						<KEYWORD>else</KEYWORD>
						<Expression source="3">...</Expression>
					</ExpressionConditional>
				*/
				const expression_cond: PARSER.ParseNodeExpressionConditional = h.conditionalExpressionFromSource(`
					if true then 2 else 3;
				`)
				const
					[_if,   condition,                  _then, consequent,                 _else, alternative]: readonly
					[Token, PARSER.ParseNodeExpression, Token, PARSER.ParseNodeExpression, Token, PARSER.ParseNodeExpression] = expression_cond.children
				assert.ok(_if   instanceof TOKEN.TokenKeyword)
				assert.ok(_then instanceof TOKEN.TokenKeyword)
				assert.ok(_else instanceof TOKEN.TokenKeyword)
				assert.deepStrictEqual(
					[_if.source, condition.source, _then.source, consequent.source, _else.source, alternative.source],
					[Keyword.IF, `true`,           Keyword.THEN, `2`,               Keyword.ELSE, `3`],
				)
			})
		})

		describe('DeclarationType ::= "type" IDENTIFIER "=" Type ";"', () => {
			/*
				<Statement>
					<DeclarationType>
						<KEYWORD>type</KEYWORD>
						<IDENTIFIER>T</IDENTIFIER>
						<PUNCTUATOR>=</PUNCTUATOR>
						<Type source="int | float">...</Type>
						<PUNCTUATOR>;</PUNCTUATOR>
					</DeclarationType>
				</Statement>
			*/
			it('makes a ParseNodeDeclarationType node.', () => {
				const decl: PARSER.ParseNodeDeclarationType = h.typeDeclarationFromSource(`
					type  T  =  int | float;
				`);
				assert.deepStrictEqual(decl.children.map((child) => child.source), [
					'type', 'T', '=', 'int | float', ';',
				]);
			});
		});

		describe('DeclarationVariable ::= "let" "unfixed"? IDENTIFIER ":" Type "=" Expression ";"', () => {
			/*
				<Statement>
					<DeclarationVariable>
						<KEYWORD>let</KEYWORD>
						<KEYWORD>unfixed</KEYWORD>
						<IDENTIFIER>the_answer</IDENTIFIER>
						<PUNCTUATOR>:</PUNCTUATOR>
						<Type source="int | float">...</Type>
						<PUNCTUATOR>=</PUNCTUATOR>
						<Expression source="21 * 2">...</Expression>
						<PUNCTUATOR>;</PUNCTUATOR>
					</DeclarationVariable>
				</Statement>
			*/
			it('makes a ParseNodeDeclarationVariable node with 7 children (not unfixed).', () => {
				const decl: PARSER.ParseNodeDeclarationVariable = h.variableDeclarationFromSource(`
					let  the_answer:  int | float =  21  *  2;
				`)
				assert_arrayLength(decl.children, 7)
				assert.deepStrictEqual(decl.children.map((child) => child.source), [
					'let', 'the_answer', ':', 'int | float', '=', '21 * 2', ';',
				])
			})
			it('makes a ParseNodeDeclarationVariable node with 8 children (unfixed).', () => {
				const decl: PARSER.ParseNodeDeclarationVariable = h.variableDeclarationFromSource(`
					let  unfixed  the_answer:  int!  =  21  *  2;
				`)
				assert_arrayLength(decl.children, 8)
				assert.deepStrictEqual(decl.children.map((child) => child.source), [
					'let', 'unfixed', 'the_answer', ':', 'int !', '=', '21 * 2', ';',
				])
			})
		})

		describe('Assignee ::= IDENTIFIER', () => {
			/*
				<Assignee>
					<IDENTIFIER>this_answer</IDENTIFIER>
				</Statement>
			*/
			it('makes a ParseNodeAssignee node.', () => {
				const assignee: PARSER.ParseNodeAssignee = h.assigneeFromSource(`this_answer  =  that_answer  -  40;`);
				assert_arrayLength(assignee.children, 1);
				const id: Token = assignee.children[0];
				assert.ok(id instanceof TOKEN.TokenIdentifier);
				assert.strictEqual(id.source, `this_answer`);
			});
		});

		describe('StatementAssignment ::= Assignee "=" Expression ";"', () => {
			/*
				<StatementAssignment>
					<Assignee source="this_answer">...</Assignee>
					<PUNCTUATOR>=</PUNCTUATOR>
					<Expression source="that_answer - 40">...</Expression>
					<PUNCTUATOR>;</PUNCTUATOR>
				</StatementAssignment>
			*/
			it('makes a ParseNodeStatementAssignment node.', () => {
				const assn: PARSER.ParseNodeStatementAssignment = h.assignmentFromSource(`this_answer  =  that_answer  -  40;`);
				assert.deepStrictEqual(assn.children.map((child) => child.source), [
					'this_answer', '=', 'that_answer - 40', ';',
				])
			})
		})

		context('Statement ::= ";"', () => {
			it('returns a statement with only a punctuator.', () => {
				/*
					<Statement line="1" col="1" source=";">
						<PUNCTUATOR line="1" col="1" value="7">;</PUNCTUATOR>
					</Statement>
				*/
				const statement: PARSER.ParseNodeStatement = h.statementFromSource(`;`)
				assert_arrayLength(statement.children, 1)
				const token: PARSER.ParseNodeDeclaration | PARSER.ParseNodeStatementAssignment | Token = statement.children[0];
				assert.ok(token instanceof TOKEN.TokenPunctuator)
				assert.strictEqual(token.source, Punctuator.ENDSTAT)
			})
		})

		context('Goal ::= #x02 Statement* #x03', () => {
			it('parses multiple statements.', () => {
				/*
					<Goal>
						<FILEBOUND.../>...</FILEBOUND>
						<Goal__0__List>
							<Goal__0__List>
								<Statement source="42 ;">...</Statement>
							</Goal__0__List>
							<Statement source="420 ;"/>...</Statement>
						</Goal__0__List>
						<FILEBOUND.../>...</FILEBOUND>
					</Goal>
				*/
				const goal: PARSER.ParseNodeGoal = h.goalFromSource(`42; 420;`);
				assert_arrayLength(goal.children, 3, 'goal should have 3 children')
				const stat_list: PARSER.ParseNodeGoal__0__List = goal.children[1]
				assert_arrayLength(stat_list.children, 2, 'stat_list should have 2 children')
				const stat0: PARSER.ParseNodeStatement = (() => {
					const stat_list_sub: PARSER.ParseNodeGoal__0__List = stat_list.children[0]
					assert_arrayLength(stat_list_sub.children, 1)
					return stat_list_sub.children[0]
				})()
				const stat1: PARSER.ParseNodeStatement = stat_list.children[1]
				assert.strictEqual(stat0.source, '42 ;')
				assert.strictEqual(stat1.source, '420 ;')
			})
		})
	})
})

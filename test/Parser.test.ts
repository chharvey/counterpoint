import * as assert from 'assert'

import {CONFIG_DEFAULT} from '../src/SolidConfig'
import Util from '../src/class/Util.class'
import Dev from '../src/class/Dev.class'
import Parser from '../src/class/Parser.class'
import {
	ParseNodeStringTemplate,
	ParseNodeExpressionUnit,
	ParseNodeExpressionUnary,
	ParseNodeExpressionBinary,
	ParseNodeExpressionConditional,
	ParseNodeExpression,
	ParseNodeDeclarationVariable,
	ParseNodeStatementAssignment,
	ParseNodeStatement,
	ParseNodeGoal,
	ParseNodeGoal__0__List,
} from '../src/class/ParseNode.class'
import {
	Punctuator,
	Keyword,
	TokenFilebound,
	TokenPunctuator,
	TokenKeyword,
	TokenNumber,
	TokenString,
} from '../src/class/Token.class'

import {
	assert_arrayLength,
} from './assert-helpers'
import {
	tokenLiteralFromExpressionUnit,
	unitExpressionFromUnaryExpression,
	unaryExpressionFromExponentialExpression,
	exponentialExpressionFromMultiplicativeExpression,
	multiplicativeExpressionFromAdditiveExpression,
	additiveExpressionFromExpression,
	conditionalExpressionFromExpression,
	expressionFromStatement,
	statementFromSource,
} from './helpers-parse'



describe('Parser', () => {
	describe('#parse', () => {
		context('Goal ::= #x02 #x03', () => {
			it('returns only file bounds.', () => {
				const tree: ParseNodeGoal = new Parser('', CONFIG_DEFAULT).parse()
				assert.strictEqual(tree.children.length, 2)
				tree.children.forEach((child) => assert.ok(child instanceof TokenFilebound))
			})
		})

		context('Statement ::= ";"', () => {
			it('returns a statement with only a punctuator.', () => {
				/*
					<Goal source="␂ ; ␃">
						<FILEBOUND value="true">␂</FILEBOUND>
						<Goal__0__List line="1" col="1" source=";">
							<Statement line="1" col="1" source=";">
								<PUNCTUATOR line="1" col="1" value="7">;</PUNCTUATOR>
							</Statement>
						</Goal__0__List>
						<FILEBOUND value="false">␃</FILEBOUND>
					</Goal>
				*/
				const statement: ParseNodeStatement = statementFromSource(`;`)
				assert_arrayLength(statement.children, 1)
				const token: ParseNodeDeclarationVariable|ParseNodeStatementAssignment|TokenPunctuator = statement.children[0]
				assert.ok(token instanceof TokenPunctuator)
				assert.strictEqual(token.source, Punctuator.ENDSTAT)
			})
		})

		context('ExpressionUnit ::= PrimitiveLiteral', () => {
			it('parses NULL, BOOLEAN, INTEGER, FLOAT, or STRING.', () => {
				assert.deepStrictEqual(([
					[`null;`,   TokenKeyword],
					[`false;`,  TokenKeyword],
					[`true;`,   TokenKeyword],
					[`42;`,     TokenNumber],
					[`4.2e+1;`, TokenNumber],
				] as [string, typeof TokenKeyword | typeof TokenNumber][]).map(([src, tokentype]) => {
					const token: TokenKeyword | TokenNumber | TokenString = tokenLiteralFromExpressionUnit(
						unitExpressionFromUnaryExpression(
							unaryExpressionFromExponentialExpression(
								exponentialExpressionFromMultiplicativeExpression(
									multiplicativeExpressionFromAdditiveExpression(
										additiveExpressionFromExpression(
											expressionFromStatement(
												statementFromSource(src)
											)
										)
									)
								)
							)
						)
					)
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

		Dev.supports('literalTemplate') && context('ExpressionUnit ::= StringTemplate', () => {
			const stringTemplateParseNode = (goal: ParseNodeGoal): ParseNodeStringTemplate => ((((((((goal
				.children[1] as ParseNodeGoal__0__List)
				.children[0] as ParseNodeStatement)
				.children[0] as ParseNodeExpression)
				.children[0] as ParseNodeExpressionBinary)
				.children[0] as ParseNodeExpressionBinary)
				.children[0] as ParseNodeExpressionBinary)
				.children[0] as ParseNodeExpressionUnary)
				.children[0] as ParseNodeExpressionUnit)
				.children[0] as ParseNodeStringTemplate
			specify('head, tail.', () => {
				assert.strictEqual(stringTemplateParseNode(new Parser(Util.dedent(`
					'''head1{{}}tail1''';
				`), CONFIG_DEFAULT).parse()).serialize(), `
					<StringTemplate line="1" col="1" source="&apos;&apos;&apos;head1{{ }}tail1&apos;&apos;&apos;">
						<TEMPLATE line="1" col="1" value="head1">'''head1{{</TEMPLATE>
						<TEMPLATE line="1" col="11" value="tail1">}}tail1'''</TEMPLATE>
					</StringTemplate>
				`.replace(/\n\t*/g, ''))
			})
			specify('head, expr, tail.', () => {
				assert.strictEqual(stringTemplateParseNode(new Parser(Util.dedent(`
					'''head1{{ '''full1''' }}tail1''';
				`), CONFIG_DEFAULT).parse()).serialize(), `
					<StringTemplate line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}tail1&apos;&apos;&apos;">
						<TEMPLATE line="1" col="1" value="head1">'''head1{{</TEMPLATE>
						<Expression line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
							<ExpressionAdditive line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
								<ExpressionMultiplicative line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
									<ExpressionExponential line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
										<ExpressionUnarySymbol line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
											<ExpressionUnit line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
												<StringTemplate line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
													<TEMPLATE line="1" col="12" value="full1">'''full1'''</TEMPLATE>
												</StringTemplate>
											</ExpressionUnit>
										</ExpressionUnarySymbol>
									</ExpressionExponential>
								</ExpressionMultiplicative>
							</ExpressionAdditive>
						</Expression>
						<TEMPLATE line="1" col="24" value="tail1">}}tail1'''</TEMPLATE>
					</StringTemplate>
				`.replace(/\n\t*/g, ''))
			})
			specify('head, expr, middle, tail.', () => {
				assert.strictEqual(stringTemplateParseNode(new Parser(Util.dedent(`
					'''head1{{ '''full1''' }}midd1{{}}tail1''';
				`), CONFIG_DEFAULT).parse()).serialize(), `
					<StringTemplate line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}midd1{{ }}tail1&apos;&apos;&apos;">
						<TEMPLATE line="1" col="1" value="head1">'''head1{{</TEMPLATE>
						<Expression line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
							<ExpressionAdditive line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
								<ExpressionMultiplicative line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
									<ExpressionExponential line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
										<ExpressionUnarySymbol line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
											<ExpressionUnit line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
												<StringTemplate line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
													<TEMPLATE line="1" col="12" value="full1">'''full1'''</TEMPLATE>
												</StringTemplate>
											</ExpressionUnit>
										</ExpressionUnarySymbol>
									</ExpressionExponential>
								</ExpressionMultiplicative>
							</ExpressionAdditive>
						</Expression>
						<StringTemplate__0__List line="1" col="24" source="}}midd1{{">
							<TEMPLATE line="1" col="24" value="midd1">}}midd1{{</TEMPLATE>
						</StringTemplate__0__List>
						<TEMPLATE line="1" col="33" value="tail1">}}tail1'''</TEMPLATE>
					</StringTemplate>
				`.replace(/\n\t*/g, ''))
			})
			specify('head, expr, middle, expr, tail.', () => {
				assert.strictEqual(stringTemplateParseNode(new Parser(Util.dedent(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}tail1''';
				`), CONFIG_DEFAULT).parse()).serialize(), `
					<StringTemplate line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos; }}tail1&apos;&apos;&apos;">
						<TEMPLATE line="1" col="1" value="head1">'''head1{{</TEMPLATE>
						<Expression line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
							<ExpressionAdditive line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
								<ExpressionMultiplicative line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
									<ExpressionExponential line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
										<ExpressionUnarySymbol line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
											<ExpressionUnit line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
												<StringTemplate line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
													<TEMPLATE line="1" col="12" value="full1">'''full1'''</TEMPLATE>
												</StringTemplate>
											</ExpressionUnit>
										</ExpressionUnarySymbol>
									</ExpressionExponential>
								</ExpressionMultiplicative>
							</ExpressionAdditive>
						</Expression>
						<StringTemplate__0__List line="1" col="24" source="}}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos;">
							<TEMPLATE line="1" col="24" value="midd1">}}midd1{{</TEMPLATE>
							<Expression line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
								<ExpressionAdditive line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
									<ExpressionMultiplicative line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
										<ExpressionExponential line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
											<ExpressionUnarySymbol line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
												<ExpressionUnit line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
													<StringTemplate line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
														<TEMPLATE line="1" col="34" value="full2">'''full2'''</TEMPLATE>
													</StringTemplate>
												</ExpressionUnit>
											</ExpressionUnarySymbol>
										</ExpressionExponential>
									</ExpressionMultiplicative>
								</ExpressionAdditive>
							</Expression>
						</StringTemplate__0__List>
						<TEMPLATE line="1" col="46" value="tail1">}}tail1'''</TEMPLATE>
					</StringTemplate>
				`.replace(/\n\t*/g, ''))
			})
			specify('head, expr, middle, expr, middle, tail.', () => {
				assert.strictEqual(stringTemplateParseNode(new Parser(Util.dedent(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{}}tail1''';
				`), CONFIG_DEFAULT).parse()).serialize(), `
					<StringTemplate line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos; }}midd2{{ }}tail1&apos;&apos;&apos;">
						<TEMPLATE line="1" col="1" value="head1">'''head1{{</TEMPLATE>
						<Expression line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
							<ExpressionAdditive line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
								<ExpressionMultiplicative line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
									<ExpressionExponential line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
										<ExpressionUnarySymbol line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
											<ExpressionUnit line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
												<StringTemplate line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
													<TEMPLATE line="1" col="12" value="full1">'''full1'''</TEMPLATE>
												</StringTemplate>
											</ExpressionUnit>
										</ExpressionUnarySymbol>
									</ExpressionExponential>
								</ExpressionMultiplicative>
							</ExpressionAdditive>
						</Expression>
						<StringTemplate__0__List line="1" col="24" source="}}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos; }}midd2{{">
							<StringTemplate__0__List line="1" col="24" source="}}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos;">
								<TEMPLATE line="1" col="24" value="midd1">}}midd1{{</TEMPLATE>
								<Expression line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
									<ExpressionAdditive line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
										<ExpressionMultiplicative line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
											<ExpressionExponential line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
												<ExpressionUnarySymbol line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
													<ExpressionUnit line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
														<StringTemplate line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
															<TEMPLATE line="1" col="34" value="full2">'''full2'''</TEMPLATE>
														</StringTemplate>
													</ExpressionUnit>
												</ExpressionUnarySymbol>
											</ExpressionExponential>
										</ExpressionMultiplicative>
									</ExpressionAdditive>
								</Expression>
							</StringTemplate__0__List>
							<TEMPLATE line="1" col="46" value="midd2">}}midd2{{</TEMPLATE>
						</StringTemplate__0__List>
						<TEMPLATE line="1" col="55" value="tail1">}}tail1'''</TEMPLATE>
					</StringTemplate>
				`.replace(/\n\t*/g, ''))
			})
			specify('head, expr, middle, expr, middle, expr, tail.', () => {
				assert.strictEqual(stringTemplateParseNode(new Parser(Util.dedent(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{ '''head2{{ '''full3''' }}tail2''' }}tail1''';
				`), CONFIG_DEFAULT).parse()).serialize(), `
					<StringTemplate line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos; }}midd2{{ &apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos; }}tail1&apos;&apos;&apos;">
						<TEMPLATE line="1" col="1" value="head1">'''head1{{</TEMPLATE>
						<Expression line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
							<ExpressionAdditive line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
								<ExpressionMultiplicative line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
									<ExpressionExponential line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
										<ExpressionUnarySymbol line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
											<ExpressionUnit line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
												<StringTemplate line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
													<TEMPLATE line="1" col="12" value="full1">'''full1'''</TEMPLATE>
												</StringTemplate>
											</ExpressionUnit>
										</ExpressionUnarySymbol>
									</ExpressionExponential>
								</ExpressionMultiplicative>
							</ExpressionAdditive>
						</Expression>
						<StringTemplate__0__List line="1" col="24" source="}}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos; }}midd2{{ &apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
							<StringTemplate__0__List line="1" col="24" source="}}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos;">
								<TEMPLATE line="1" col="24" value="midd1">}}midd1{{</TEMPLATE>
								<Expression line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
									<ExpressionAdditive line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
										<ExpressionMultiplicative line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
											<ExpressionExponential line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
												<ExpressionUnarySymbol line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
													<ExpressionUnit line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
														<StringTemplate line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
															<TEMPLATE line="1" col="34" value="full2">'''full2'''</TEMPLATE>
														</StringTemplate>
													</ExpressionUnit>
												</ExpressionUnarySymbol>
											</ExpressionExponential>
										</ExpressionMultiplicative>
									</ExpressionAdditive>
								</Expression>
							</StringTemplate__0__List>
							<TEMPLATE line="1" col="46" value="midd2">}}midd2{{</TEMPLATE>
							<Expression line="1" col="56" source="&apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
								<ExpressionAdditive line="1" col="56" source="&apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
									<ExpressionMultiplicative line="1" col="56" source="&apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
										<ExpressionExponential line="1" col="56" source="&apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
											<ExpressionUnarySymbol line="1" col="56" source="&apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
												<ExpressionUnit line="1" col="56" source="&apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
													<StringTemplate line="1" col="56" source="&apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
														<TEMPLATE line="1" col="56" value="head2">'''head2{{</TEMPLATE>
														<Expression line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;">
															<ExpressionAdditive line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;">
																<ExpressionMultiplicative line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;">
																	<ExpressionExponential line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;">
																		<ExpressionUnarySymbol line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;">
																			<ExpressionUnit line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;">
																				<StringTemplate line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;">
																					<TEMPLATE line="1" col="67" value="full3">'''full3'''</TEMPLATE>
																				</StringTemplate>
																			</ExpressionUnit>
																		</ExpressionUnarySymbol>
																	</ExpressionExponential>
																</ExpressionMultiplicative>
															</ExpressionAdditive>
														</Expression>
														<TEMPLATE line="1" col="79" value="tail2">}}tail2'''</TEMPLATE>
													</StringTemplate>
												</ExpressionUnit>
											</ExpressionUnarySymbol>
										</ExpressionExponential>
									</ExpressionMultiplicative>
								</ExpressionAdditive>
							</Expression>
						</StringTemplate__0__List>
						<TEMPLATE line="1" col="90" value="tail1">}}tail1'''</TEMPLATE>
					</StringTemplate>
				`.replace(/\n\t*/g, ''))
			})
			it('throws when reaching an orphaned head.', () => {
				assert.throws(() => new Parser(`
					'''A string template head token not followed by a middle or tail {{ 1;
				`, CONFIG_DEFAULT).parse(), /Unexpected token/)
			})
			it('throws when reaching an orphaned middle.', () => {
				assert.throws(() => new Parser(`
					2 }} a string template middle token not preceded by a head/middle and not followed by a middle/tail {{ 3;
				`, CONFIG_DEFAULT).parse(), /Unexpected token/)
			})
			it('throws when reaching an orphaned tail.', () => {
				assert.throws(() => new Parser(`
					4 }} a string template tail token not preceded by a head or middle''';
				`, CONFIG_DEFAULT).parse(), /Unexpected token/)
			})
		})

		context('ExpressionUnit ::= "(" Expression ")"', () => {
			it('makes an ExpressionUnit node containing an Expression node.', () => {
				/*
					<ExpressionUnit>
						<PUNCTUATOR>(</PUNCTUATOR>
						<Expression source="2 + -3">...</Expression>
						<PUNCTUATOR>)</PUNCTUATOR>
					</ExpressionUnit>
				*/
				const expression_unit: ParseNodeExpressionUnit = unitExpressionFromUnaryExpression(
					unaryExpressionFromExponentialExpression(
						exponentialExpressionFromMultiplicativeExpression(
							multiplicativeExpressionFromAdditiveExpression(
								additiveExpressionFromExpression(
									expressionFromStatement(
										statementFromSource(`(2 + -3);`)
									)
								)
							)
						)
					)
				)
				assert_arrayLength(expression_unit.children, 3)
				const [open, expr, close]: readonly [TokenPunctuator, ParseNodeExpression, TokenPunctuator] = expression_unit.children
				assert.deepStrictEqual(
					[open.source,        expr.source, close.source],
					[Punctuator.GRP_OPN, `2 + -3`,    Punctuator.GRP_CLS],
				)
			})
		})

		context('ExpressionUnarySymbol ::= ("!" | "?" | "+" | "-") ExpressionUnarySymbol', () => {
			it('makes a ParseNodeExpressionUnary node.', () => {
				/*
					<ExpressionUnarySymbol>
						<PUNCTUATOR>-</PUNCTUATOR>
						<ExpressionUnarySymbol source="42">...</ExpressionUnarySymbol>
					</ExpressionUnarySymbol>
				*/
				assert.deepStrictEqual([
					`!false;`,
					`?true;`,
					`- 42;`,
					`--2;`,
				].map((src) => {
					const expression_unary: ParseNodeExpressionUnary = unaryExpressionFromExponentialExpression(
						exponentialExpressionFromMultiplicativeExpression(
							multiplicativeExpressionFromAdditiveExpression(
								additiveExpressionFromExpression(
									expressionFromStatement(
										statementFromSource(src)
									)
								)
							)
						)
					)
					assert_arrayLength(expression_unary.children, 2, 'outer unary expression should have 2 children')
					const [op, operand]: readonly [TokenPunctuator, ParseNodeExpressionUnary] = expression_unary.children
					assert_arrayLength(operand.children, 1, 'inner unary expression should have 1 child')
					return [operand.source, op.source]
				}), [
					[`false`, Punctuator.NOT],
					[`true`, Punctuator.EMPTY],
					[`42`, Punctuator.NEG],
					[`-2`, Punctuator.NEG],
				])
			})
		})

		context('ExpressionExponential ::=  ExpressionUnarySymbol "^" ExpressionExponential', () => {
			it('makes a ParseNodeExpressionBinary node.', () => {
				/*
					<ExpressionExponential>
						<ExpressionUnarySymbol source="2">...</ExpressionUnarySymbol>
						<PUNCTUATOR>^</PUNCTUATOR>
						<ExpressionExponential source="-3">...</ExpressionExponential>
					</ExpressionExponential>
				*/
				const expression_exp: ParseNodeExpressionBinary = exponentialExpressionFromMultiplicativeExpression(
					multiplicativeExpressionFromAdditiveExpression(
						additiveExpressionFromExpression(
							expressionFromStatement(
								statementFromSource(`2 ^ -3;`)
							)
						)
					)
				)
				assert_arrayLength(expression_exp.children, 3, 'exponential expression should have 3 children')
				const [left, op, right]: readonly [ParseNodeExpressionUnary | ParseNodeExpressionBinary, TokenPunctuator, ParseNodeExpressionBinary] = expression_exp.children
				assert.ok(left instanceof ParseNodeExpressionUnary)
				assert.deepStrictEqual(
					[left.source, op.source,      right.source],
					['2',         Punctuator.EXP, '-3'],
				)
			})
		})

		context('ExpressionMultiplicative ::= ExpressionMultiplicative ("*" | "/") ExpressionExponential', () => {
			it('makes a ParseNodeExpressionBinary node.', () => {
				/*
					<ExpressionMultiplicative>
						<ExpressionMultiplicative source="2">...</ExpressionMultiplicative>
						<PUNCTUATOR>*</PUNCTUATOR>
						<ExpressionExponential source="-3">...</ExpressionExponential>
					</ExpressionMultiplicative>
				*/
				const expression_mul: ParseNodeExpressionBinary = multiplicativeExpressionFromAdditiveExpression(
					additiveExpressionFromExpression(
						expressionFromStatement(
							statementFromSource(`2 * -3;`)
						)
					)
				)
				assert_arrayLength(expression_mul.children, 3, 'multiplicative expression should have 3 children')
				const [left, op, right]: readonly [ParseNodeExpressionUnary | ParseNodeExpressionBinary, TokenPunctuator, ParseNodeExpressionBinary] = expression_mul.children
				assert.ok(left instanceof ParseNodeExpressionBinary)
				assert.deepStrictEqual(
					[left.source, op.source,      right.source],
					['2',         Punctuator.MUL, '-3'],
				)
			})
		})

		context('ExpressionAdditive ::= ExpressionAdditive ("+" | "-") ExpressionMultiplicative', () => {
			it('makes a ParseNodeExpressionBinary node.', () => {
				/*
					<ExpressionAdditive>
						<ExpressionAdditive source="2">...</ExpressionAdditive>
						<PUNCTUATOR>+</PUNCTUATOR>
						<ExpressionMultiplicative source="-3">...</ExpressionMultiplicative>
					</ExpressionAdditive>
				*/
				const expression_add: ParseNodeExpressionBinary = additiveExpressionFromExpression(
						expressionFromStatement(
							statementFromSource(`2 + -3;`)
						)
					)
				assert_arrayLength(expression_add.children, 3, 'additive expression should have 3 children')
				const [left, op, right]: readonly [ParseNodeExpressionUnary | ParseNodeExpressionBinary, TokenPunctuator, ParseNodeExpressionBinary] = expression_add.children
				assert.ok(left instanceof ParseNodeExpressionBinary)
				assert.deepStrictEqual(
					[left.source, op.source,      right.source],
					['2',         Punctuator.ADD, '-3'],
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
				const expression_cond: ParseNodeExpressionConditional = conditionalExpressionFromExpression(
					expressionFromStatement(
						statementFromSource(`if true then 2 else 3;`)
					)
				)
				const
					[_if,          condition,           _then,        consequent,          _else,        alternative]: readonly
					[TokenKeyword, ParseNodeExpression, TokenKeyword, ParseNodeExpression, TokenKeyword, ParseNodeExpression] = expression_cond.children
				assert.deepStrictEqual(
					[_if.source, condition.source, _then.source, consequent.source, _else.source, alternative.source],
					[Keyword.IF, `true`,           Keyword.THEN, `2`,               Keyword.ELSE, `3`],
				)
			})
		})

		Dev.supports('variables') && context('DeclarationVariable, StatementAssignment', () => {
			it('makes ParseNodeDeclarationVariable and ParseNodeStatementAssignment nodes.', () => {
				assert.strictEqual(new Parser(Util.dedent(`
					let unfixed the_answer = 42;
					let \`the £ answer\` = the_answer * 10;
					the_answer = the_answer - \\z14;
				`), CONFIG_DEFAULT).parse().serialize(), `
					<Goal source="␂ let unfixed the_answer = 42 ; let \`the &#xa3; answer\` = the_answer * 10 ; the_answer = the_answer - &#x5c;z14 ; ␃">
						<FILEBOUND value="true">␂</FILEBOUND>
						<Goal__0__List line="1" col="1" source="let unfixed the_answer = 42 ; let \`the &#xa3; answer\` = the_answer * 10 ; the_answer = the_answer - &#x5c;z14 ;">
							<Goal__0__List line="1" col="1" source="let unfixed the_answer = 42 ; let \`the &#xa3; answer\` = the_answer * 10 ;">
								<Goal__0__List line="1" col="1" source="let unfixed the_answer = 42 ;">
									<Statement line="1" col="1" source="let unfixed the_answer = 42 ;">
										<DeclarationVariable line="1" col="1" source="let unfixed the_answer = 42 ;">
											<KEYWORD line="1" col="1" value="128">let</KEYWORD>
											<KEYWORD line="1" col="5" value="129">unfixed</KEYWORD>
											<IDENTIFIER line="1" col="13" value="256">the_answer</IDENTIFIER>
											<PUNCTUATOR line="1" col="24" value="8">=</PUNCTUATOR>
											<Expression line="1" col="26" source="42">
												<ExpressionAdditive line="1" col="26" source="42">
													<ExpressionMultiplicative line="1" col="26" source="42">
														<ExpressionExponential line="1" col="26" source="42">
															<ExpressionUnarySymbol line="1" col="26" source="42">
																<ExpressionUnit line="1" col="26" source="42">
																	<PrimitiveLiteral line="1" col="26" source="42">
																		<NUMBER line="1" col="26" value="42">42</NUMBER>
																	</PrimitiveLiteral>
																</ExpressionUnit>
															</ExpressionUnarySymbol>
														</ExpressionExponential>
													</ExpressionMultiplicative>
												</ExpressionAdditive>
											</Expression>
											<PUNCTUATOR line="1" col="28" value="7">;</PUNCTUATOR>
										</DeclarationVariable>
									</Statement>
								</Goal__0__List>
								<Statement line="2" col="1" source="let \`the &#xa3; answer\` = the_answer * 10 ;">
									<DeclarationVariable line="2" col="1" source="let \`the &#xa3; answer\` = the_answer * 10 ;">
										<KEYWORD line="2" col="1" value="128">let</KEYWORD>
										<IDENTIFIER line="2" col="5" value="257">\`the £ answer\`</IDENTIFIER>
										<PUNCTUATOR line="2" col="20" value="8">=</PUNCTUATOR>
										<Expression line="2" col="22" source="the_answer * 10">
											<ExpressionAdditive line="2" col="22" source="the_answer * 10">
												<ExpressionMultiplicative line="2" col="22" source="the_answer * 10">
													<ExpressionMultiplicative line="2" col="22" source="the_answer">
														<ExpressionExponential line="2" col="22" source="the_answer">
															<ExpressionUnarySymbol line="2" col="22" source="the_answer">
																<ExpressionUnit line="2" col="22" source="the_answer">
																	<IDENTIFIER line="2" col="22" value="256">the_answer</IDENTIFIER>
																</ExpressionUnit>
															</ExpressionUnarySymbol>
														</ExpressionExponential>
													</ExpressionMultiplicative>
													<PUNCTUATOR line="2" col="33" value="5">*</PUNCTUATOR>
													<ExpressionExponential line="2" col="35" source="10">
														<ExpressionUnarySymbol line="2" col="35" source="10">
															<ExpressionUnit line="2" col="35" source="10">
																<PrimitiveLiteral line="2" col="35" source="10">
																	<NUMBER line="2" col="35" value="10">10</NUMBER>
																</PrimitiveLiteral>
															</ExpressionUnit>
														</ExpressionUnarySymbol>
													</ExpressionExponential>
												</ExpressionMultiplicative>
											</ExpressionAdditive>
										</Expression>
										<PUNCTUATOR line="2" col="37" value="7">;</PUNCTUATOR>
									</DeclarationVariable>
								</Statement>
							</Goal__0__List>
							<Statement line="3" col="1" source="the_answer = the_answer - &#x5c;z14 ;">
								<StatementAssignment line="3" col="1" source="the_answer = the_answer - &#x5c;z14 ;">
									<IDENTIFIER line="3" col="1" value="256">the_answer</IDENTIFIER>
									<PUNCTUATOR line="3" col="12" value="8">=</PUNCTUATOR>
									<Expression line="3" col="14" source="the_answer - &#x5c;z14">
										<ExpressionAdditive line="3" col="14" source="the_answer - &#x5c;z14">
											<ExpressionAdditive line="3" col="14" source="the_answer">
												<ExpressionMultiplicative line="3" col="14" source="the_answer">
													<ExpressionExponential line="3" col="14" source="the_answer">
														<ExpressionUnarySymbol line="3" col="14" source="the_answer">
															<ExpressionUnit line="3" col="14" source="the_answer">
																<IDENTIFIER line="3" col="14" value="256">the_answer</IDENTIFIER>
															</ExpressionUnit>
														</ExpressionUnarySymbol>
													</ExpressionExponential>
												</ExpressionMultiplicative>
											</ExpressionAdditive>
											<PUNCTUATOR line="3" col="25" value="3">-</PUNCTUATOR>
											<ExpressionMultiplicative line="3" col="27" source="&#x5c;z14">
												<ExpressionExponential line="3" col="27" source="&#x5c;z14">
													<ExpressionUnarySymbol line="3" col="27" source="&#x5c;z14">
														<ExpressionUnit line="3" col="27" source="&#x5c;z14">
															<PrimitiveLiteral line="3" col="27" source="&#x5c;z14">
																<NUMBER line="3" col="27" value="40">&#x5c;z14</NUMBER>
															</PrimitiveLiteral>
														</ExpressionUnit>
													</ExpressionUnarySymbol>
												</ExpressionExponential>
											</ExpressionMultiplicative>
										</ExpressionAdditive>
									</Expression>
									<PUNCTUATOR line="3" col="31" value="7">;</PUNCTUATOR>
								</StatementAssignment>
							</Statement>
						</Goal__0__List>
						<FILEBOUND value="false">␃</FILEBOUND>
					</Goal>
				`.replace(/\n\t*/g, ''))
			})
		})

		context('Goal__0__List ::= Goal__0__List Statement', () => {
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
				const goal: ParseNodeGoal = new Parser('42; 420;', CONFIG_DEFAULT).parse()
				assert_arrayLength(goal.children, 3, 'goal should have 3 children')
				const stat_list: ParseNodeGoal__0__List = goal.children[1]
				assert_arrayLength(stat_list.children, 2, 'stat_list should have 2 children')
				const stat0: ParseNodeStatement = (() => {
					const stat_list_sub: ParseNodeGoal__0__List = stat_list.children[0]
					assert_arrayLength(stat_list_sub.children, 1)
					return stat_list_sub.children[0]
				})()
				const stat1: ParseNodeStatement = stat_list.children[1]
				assert.strictEqual(stat0.source, '42 ;')
				assert.strictEqual(stat1.source, '420 ;')
			})
		})
	})
})

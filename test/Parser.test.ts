import * as assert from 'assert'

import Util from '../src/class/Util.class'
import Parser from '../src/class/Parser.class'
import type {
	ParseNodeStringTemplate,
	ParseNodeExpressionUnit,
	ParseNodeExpressionUnary,
	ParseNodeExpressionBinary,
	ParseNodeExpression,
	ParseNodeDeclarationVariable,
	ParseNodeStatementAssignment,
	ParseNodeStatement,
	ParseNodeStatementList,
	ParseNodeGoal,
} from '../src/class/ParseNode.class'
import {
	TokenFilebound,
	TokenPunctuator,
} from '../src/class/Token.class'



describe('Parser', () => {
	describe('#parse', () => {
		function assert_ok(value: unknown, message?: string|Error): asserts value {
			return assert.ok(value, message)
		}

		function assert_arrayLength(array: readonly unknown[], length: 0      , message?: string|Error): asserts array is readonly [                                                                      ];
		function assert_arrayLength(array: readonly unknown[], length: 1      , message?: string|Error): asserts array is readonly [unknown,                                                              ];
		function assert_arrayLength(array: readonly unknown[], length: 2      , message?: string|Error): asserts array is readonly [unknown, unknown,                                                     ];
		function assert_arrayLength(array: readonly unknown[], length: 3      , message?: string|Error): asserts array is readonly [unknown, unknown, unknown,                                            ];
		function assert_arrayLength(array: readonly unknown[], length: 4      , message?: string|Error): asserts array is readonly [unknown, unknown, unknown, unknown,                                   ];
		function assert_arrayLength(array: readonly unknown[], length: 5      , message?: string|Error): asserts array is readonly [unknown, unknown, unknown, unknown, unknown,                          ];
		function assert_arrayLength(array: readonly unknown[], length: 6      , message?: string|Error): asserts array is readonly [unknown, unknown, unknown, unknown, unknown, unknown,                 ];
		function assert_arrayLength(array: readonly unknown[], length: 7      , message?: string|Error): asserts array is readonly [unknown, unknown, unknown, unknown, unknown, unknown, unknown,        ];
		function assert_arrayLength(array: readonly unknown[], length: 8      , message?: string|Error): asserts array is readonly [unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown];
		function assert_arrayLength(array: readonly unknown[], length: number , message?: string|Error): void;
		function assert_arrayLength(array: readonly unknown[], length: number , message?: string|Error): void {
			return assert.strictEqual(array.length, length, message)
		}

		context('Goal ::= #x02 #x03', () => {
			it('returns only file bounds.', () => {
				const tree: ParseNodeGoal = new Parser('').parse()
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
								<PUNCTUATOR line="1" col="1" value=";">;</PUNCTUATOR>
							</Statement>
						</Goal__0__List>
						<FILEBOUND value="false">␃</FILEBOUND>
					</Goal>
				*/
				const tree: ParseNodeGoal = new Parser(';').parse()
				assert_arrayLength(tree.children, 3)
				const statement_list: ParseNodeStatementList = tree.children[1]
				assert_arrayLength(statement_list.children, 1)
				const statement: ParseNodeStatement = statement_list.children[0]
				assert_arrayLength(statement.children, 1)
				const token: ParseNodeDeclarationVariable|ParseNodeStatementAssignment|TokenPunctuator = statement.children[0]
				assert_ok(token instanceof TokenPunctuator)
				assert.strictEqual(token.cook(), ';')
			})
		})

		context('ExpressionUnit ::= PrimitiveLiteral', () => {
			it('parses a NUMBER or STRING', () => {
				assert.strictEqual(new Parser('42;').parse().serialize(), `
					<Goal source="␂ 42 ; ␃">
						<FILEBOUND value="true">␂</FILEBOUND>
						<Goal__0__List line="1" col="1" source="42 ;">
							<Statement line="1" col="1" source="42 ;">
								<Expression line="1" col="1" source="42">
									<ExpressionAdditive line="1" col="1" source="42">
										<ExpressionMultiplicative line="1" col="1" source="42">
											<ExpressionExponential line="1" col="1" source="42">
												<ExpressionUnarySymbol line="1" col="1" source="42">
													<ExpressionUnit line="1" col="1" source="42">
														<PrimitiveLiteral line="1" col="1" source="42">
															<NUMBER line="1" col="1" value="42">42</NUMBER>
														</PrimitiveLiteral>
													</ExpressionUnit>
												</ExpressionUnarySymbol>
											</ExpressionExponential>
										</ExpressionMultiplicative>
									</ExpressionAdditive>
								</Expression>
								<PUNCTUATOR line="1" col="3" value=";">;</PUNCTUATOR>
							</Statement>
						</Goal__0__List>
						<FILEBOUND value="false">␃</FILEBOUND>
					</Goal>
				`.replace(/\n\t*/g, ''))
			})
		})

		context('ExpressionUnit ::= StringTemplate', () => {
			const stringTemplateParseNode = (goal: ParseNodeGoal): ParseNodeStringTemplate => ((((((((goal
				.children[1] as ParseNodeStatementList)
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
				`)).parse()).serialize(), `
					<StringTemplate line="1" col="1" source="&apos;&apos;&apos;head1{{ }}tail1&apos;&apos;&apos;">
						<TEMPLATE line="1" col="1" value="head1">'''head1{{</TEMPLATE>
						<TEMPLATE line="1" col="11" value="tail1">}}tail1'''</TEMPLATE>
					</StringTemplate>
				`.replace(/\n\t*/g, ''))
			})
			specify('head, expr, tail.', () => {
				assert.strictEqual(stringTemplateParseNode(new Parser(Util.dedent(`
					'''head1{{ '''full1''' }}tail1''';
				`)).parse()).serialize(), `
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
				`)).parse()).serialize(), `
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
				`)).parse()).serialize(), `
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
				`)).parse()).serialize(), `
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
				`)).parse()).serialize(), `
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
				`).parse(), /Unexpected token/)
			})
			it('throws when reaching an orphaned middle.', () => {
				assert.throws(() => new Parser(`
					2 }} a string template middle token not preceded by a head/middle and not followed by a middle/tail {{ 3;
				`).parse(), /Unexpected token/)
			})
			it('throws when reaching an orphaned tail.', () => {
				assert.throws(() => new Parser(`
					4 }} a string template tail token not preceded by a head or middle''';
				`).parse(), /Unexpected token/)
			})
		})

		context('ExpressionUnit ::= "(" Expression ")"', () => {
			it('makes an ExpressionUnit node containing an Expression node.', () => {
				assert.strictEqual(new Parser('(2 + -3);').parse().serialize(), `
					<Goal source="␂ ( 2 + -3 ) ; ␃">
						<FILEBOUND value="true">␂</FILEBOUND>
						<Goal__0__List line="1" col="1" source="( 2 + -3 ) ;">
							<Statement line="1" col="1" source="( 2 + -3 ) ;">
								<Expression line="1" col="1" source="( 2 + -3 )">
									<ExpressionAdditive line="1" col="1" source="( 2 + -3 )">
										<ExpressionMultiplicative line="1" col="1" source="( 2 + -3 )">
											<ExpressionExponential line="1" col="1" source="( 2 + -3 )">
												<ExpressionUnarySymbol line="1" col="1" source="( 2 + -3 )">
													<ExpressionUnit line="1" col="1" source="( 2 + -3 )">
														<PUNCTUATOR line="1" col="1" value="(">(</PUNCTUATOR>
														<Expression line="1" col="2" source="2 + -3">
															<ExpressionAdditive line="1" col="2" source="2 + -3">
																<ExpressionAdditive line="1" col="2" source="2">
																	<ExpressionMultiplicative line="1" col="2" source="2">
																		<ExpressionExponential line="1" col="2" source="2">
																			<ExpressionUnarySymbol line="1" col="2" source="2">
																				<ExpressionUnit line="1" col="2" source="2">
																					<PrimitiveLiteral line="1" col="2" source="2">
																						<NUMBER line="1" col="2" value="2">2</NUMBER>
																					</PrimitiveLiteral>
																				</ExpressionUnit>
																			</ExpressionUnarySymbol>
																		</ExpressionExponential>
																	</ExpressionMultiplicative>
																</ExpressionAdditive>
																<PUNCTUATOR line="1" col="4" value="+">+</PUNCTUATOR>
																<ExpressionMultiplicative line="1" col="6" source="-3">
																	<ExpressionExponential line="1" col="6" source="-3">
																		<ExpressionUnarySymbol line="1" col="6" source="-3">
																			<ExpressionUnit line="1" col="6" source="-3">
																				<PrimitiveLiteral line="1" col="6" source="-3">
																					<NUMBER line="1" col="6" value="-3">-3</NUMBER>
																				</PrimitiveLiteral>
																			</ExpressionUnit>
																		</ExpressionUnarySymbol>
																	</ExpressionExponential>
																</ExpressionMultiplicative>
															</ExpressionAdditive>
														</Expression>
														<PUNCTUATOR line="1" col="8" value=")">)</PUNCTUATOR>
													</ExpressionUnit>
												</ExpressionUnarySymbol>
											</ExpressionExponential>
										</ExpressionMultiplicative>
									</ExpressionAdditive>
								</Expression>
								<PUNCTUATOR line="1" col="9" value=";">;</PUNCTUATOR>
							</Statement>
						</Goal__0__List>
						<FILEBOUND value="false">␃</FILEBOUND>
					</Goal>
				`.replace(/\n\t*/g, ''))
			})
		})

		context('ExpressionUnarySymbol ::= ("+" | "-") ExpressionUnarySymbol', () => {
			it('makes a ParseNodeExpressionUnary node.', () => {
				assert.strictEqual(new Parser('- 42;').parse().serialize(), `
					<Goal source="␂ - 42 ; ␃">
						<FILEBOUND value="true">␂</FILEBOUND>
						<Goal__0__List line="1" col="1" source="- 42 ;">
							<Statement line="1" col="1" source="- 42 ;">
								<Expression line="1" col="1" source="- 42">
									<ExpressionAdditive line="1" col="1" source="- 42">
										<ExpressionMultiplicative line="1" col="1" source="- 42">
											<ExpressionExponential line="1" col="1" source="- 42">
												<ExpressionUnarySymbol line="1" col="1" source="- 42">
													<PUNCTUATOR line="1" col="1" value="-">-</PUNCTUATOR>
													<ExpressionUnarySymbol line="1" col="3" source="42">
														<ExpressionUnit line="1" col="3" source="42">
															<PrimitiveLiteral line="1" col="3" source="42">
																<NUMBER line="1" col="3" value="42">42</NUMBER>
															</PrimitiveLiteral>
														</ExpressionUnit>
													</ExpressionUnarySymbol>
												</ExpressionUnarySymbol>
											</ExpressionExponential>
										</ExpressionMultiplicative>
									</ExpressionAdditive>
								</Expression>
								<PUNCTUATOR line="1" col="5" value=";">;</PUNCTUATOR>
							</Statement>
						</Goal__0__List>
						<FILEBOUND value="false">␃</FILEBOUND>
					</Goal>
				`.replace(/\n\t*/g, ''))
			})
		})

		context('ExpressionExponential ::=  ExpressionUnarySymbol "^" ExpressionExponential', () => {
			it('makes a ParseNodeExpressionBinary node.', () => {
				assert.strictEqual(new Parser('2 ^ -3;').parse().serialize(), `
					<Goal source="␂ 2 ^ -3 ; ␃">
						<FILEBOUND value="true">␂</FILEBOUND>
						<Goal__0__List line="1" col="1" source="2 ^ -3 ;">
							<Statement line="1" col="1" source="2 ^ -3 ;">
								<Expression line="1" col="1" source="2 ^ -3">
									<ExpressionAdditive line="1" col="1" source="2 ^ -3">
										<ExpressionMultiplicative line="1" col="1" source="2 ^ -3">
											<ExpressionExponential line="1" col="1" source="2 ^ -3">
												<ExpressionUnarySymbol line="1" col="1" source="2">
													<ExpressionUnit line="1" col="1" source="2">
														<PrimitiveLiteral line="1" col="1" source="2">
															<NUMBER line="1" col="1" value="2">2</NUMBER>
														</PrimitiveLiteral>
													</ExpressionUnit>
												</ExpressionUnarySymbol>
												<PUNCTUATOR line="1" col="3" value="^">^</PUNCTUATOR>
												<ExpressionExponential line="1" col="5" source="-3">
													<ExpressionUnarySymbol line="1" col="5" source="-3">
														<ExpressionUnit line="1" col="5" source="-3">
															<PrimitiveLiteral line="1" col="5" source="-3">
																<NUMBER line="1" col="5" value="-3">-3</NUMBER>
															</PrimitiveLiteral>
														</ExpressionUnit>
													</ExpressionUnarySymbol>
												</ExpressionExponential>
											</ExpressionExponential>
										</ExpressionMultiplicative>
									</ExpressionAdditive>
								</Expression>
								<PUNCTUATOR line="1" col="7" value=";">;</PUNCTUATOR>
							</Statement>
						</Goal__0__List>
						<FILEBOUND value="false">␃</FILEBOUND>
					</Goal>
				`.replace(/\n\t*/g, ''))
			})
		})

		context('ExpressionMultiplicative ::= ExpressionMultiplicative ("*" | "/") ExpressionExponential', () => {
			it('makes a ParseNodeExpressionBinary node.', () => {
				assert.strictEqual(new Parser('2 * -3;').parse().serialize(), `
					<Goal source="␂ 2 * -3 ; ␃">
						<FILEBOUND value="true">␂</FILEBOUND>
						<Goal__0__List line="1" col="1" source="2 * -3 ;">
							<Statement line="1" col="1" source="2 * -3 ;">
								<Expression line="1" col="1" source="2 * -3">
									<ExpressionAdditive line="1" col="1" source="2 * -3">
										<ExpressionMultiplicative line="1" col="1" source="2 * -3">
											<ExpressionMultiplicative line="1" col="1" source="2">
												<ExpressionExponential line="1" col="1" source="2">
													<ExpressionUnarySymbol line="1" col="1" source="2">
														<ExpressionUnit line="1" col="1" source="2">
															<PrimitiveLiteral line="1" col="1" source="2">
																<NUMBER line="1" col="1" value="2">2</NUMBER>
															</PrimitiveLiteral>
														</ExpressionUnit>
													</ExpressionUnarySymbol>
												</ExpressionExponential>
											</ExpressionMultiplicative>
											<PUNCTUATOR line="1" col="3" value="*">*</PUNCTUATOR>
											<ExpressionExponential line="1" col="5" source="-3">
												<ExpressionUnarySymbol line="1" col="5" source="-3">
													<ExpressionUnit line="1" col="5" source="-3">
														<PrimitiveLiteral line="1" col="5" source="-3">
															<NUMBER line="1" col="5" value="-3">-3</NUMBER>
														</PrimitiveLiteral>
													</ExpressionUnit>
												</ExpressionUnarySymbol>
											</ExpressionExponential>
										</ExpressionMultiplicative>
									</ExpressionAdditive>
								</Expression>
								<PUNCTUATOR line="1" col="7" value=";">;</PUNCTUATOR>
							</Statement>
						</Goal__0__List>
						<FILEBOUND value="false">␃</FILEBOUND>
					</Goal>
				`.replace(/\n\t*/g, ''))
			})
		})

		context('ExpressionAdditive ::= ExpressionAdditive ("+" | "-") ExpressionMultiplicative', () => {
			it('makes a ParseNodeExpressionBinary node.', () => {
				assert.strictEqual(new Parser('2 + -3;').parse().serialize(), `
					<Goal source="␂ 2 + -3 ; ␃">
						<FILEBOUND value="true">␂</FILEBOUND>
						<Goal__0__List line="1" col="1" source="2 + -3 ;">
							<Statement line="1" col="1" source="2 + -3 ;">
								<Expression line="1" col="1" source="2 + -3">
									<ExpressionAdditive line="1" col="1" source="2 + -3">
										<ExpressionAdditive line="1" col="1" source="2">
											<ExpressionMultiplicative line="1" col="1" source="2">
												<ExpressionExponential line="1" col="1" source="2">
													<ExpressionUnarySymbol line="1" col="1" source="2">
														<ExpressionUnit line="1" col="1" source="2">
															<PrimitiveLiteral line="1" col="1" source="2">
																<NUMBER line="1" col="1" value="2">2</NUMBER>
															</PrimitiveLiteral>
														</ExpressionUnit>
													</ExpressionUnarySymbol>
												</ExpressionExponential>
											</ExpressionMultiplicative>
										</ExpressionAdditive>
										<PUNCTUATOR line="1" col="3" value="+">+</PUNCTUATOR>
										<ExpressionMultiplicative line="1" col="5" source="-3">
											<ExpressionExponential line="1" col="5" source="-3">
												<ExpressionUnarySymbol line="1" col="5" source="-3">
													<ExpressionUnit line="1" col="5" source="-3">
														<PrimitiveLiteral line="1" col="5" source="-3">
															<NUMBER line="1" col="5" value="-3">-3</NUMBER>
														</PrimitiveLiteral>
													</ExpressionUnit>
												</ExpressionUnarySymbol>
											</ExpressionExponential>
										</ExpressionMultiplicative>
									</ExpressionAdditive>
								</Expression>
								<PUNCTUATOR line="1" col="7" value=";">;</PUNCTUATOR>
							</Statement>
						</Goal__0__List>
						<FILEBOUND value="false">␃</FILEBOUND>
					</Goal>
				`.replace(/\n\t*/g, ''))
			})
		})

		context('DeclarationVariable, StatementAssignment', () => {
			it('makes ParseNodeDeclarationVariable and ParseNodeStatementAssignment nodes.', () => {
				assert.strictEqual(new Parser(Util.dedent(`
					let unfixed the_answer = 42;
					let \`the £ answer\` = the_answer * 10;
					the_answer = the_answer - \\z14;
				`)).parse().serialize(), `
					<Goal source="␂ let unfixed the_answer = 42 ; let \`the £ answer\` = the_answer * 10 ; the_answer = the_answer - &#x5c;z14 ; ␃">
						<FILEBOUND value="true">␂</FILEBOUND>
						<Goal__0__List line="1" col="1" source="let unfixed the_answer = 42 ; let \`the £ answer\` = the_answer * 10 ; the_answer = the_answer - &#x5c;z14 ;">
							<Goal__0__List line="1" col="1" source="let unfixed the_answer = 42 ; let \`the £ answer\` = the_answer * 10 ;">
								<Goal__0__List line="1" col="1" source="let unfixed the_answer = 42 ;">
									<Statement line="1" col="1" source="let unfixed the_answer = 42 ;">
										<DeclarationVariable line="1" col="1" source="let unfixed the_answer = 42 ;">
											<WORD line="1" col="1" value="0">let</WORD>
											<WORD line="1" col="5" value="1">unfixed</WORD>
											<WORD line="1" col="13" value="128">the_answer</WORD>
											<PUNCTUATOR line="1" col="24" value="=">=</PUNCTUATOR>
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
											<PUNCTUATOR line="1" col="28" value=";">;</PUNCTUATOR>
										</DeclarationVariable>
									</Statement>
								</Goal__0__List>
								<Statement line="2" col="1" source="let \`the £ answer\` = the_answer * 10 ;">
									<DeclarationVariable line="2" col="1" source="let \`the £ answer\` = the_answer * 10 ;">
										<WORD line="2" col="1" value="0">let</WORD>
										<WORD line="2" col="5" value="129">\`the £ answer\`</WORD>
										<PUNCTUATOR line="2" col="20" value="=">=</PUNCTUATOR>
										<Expression line="2" col="22" source="the_answer * 10">
											<ExpressionAdditive line="2" col="22" source="the_answer * 10">
												<ExpressionMultiplicative line="2" col="22" source="the_answer * 10">
													<ExpressionMultiplicative line="2" col="22" source="the_answer">
														<ExpressionExponential line="2" col="22" source="the_answer">
															<ExpressionUnarySymbol line="2" col="22" source="the_answer">
																<ExpressionUnit line="2" col="22" source="the_answer">
																	<WORD line="2" col="22" value="128">the_answer</WORD>
																</ExpressionUnit>
															</ExpressionUnarySymbol>
														</ExpressionExponential>
													</ExpressionMultiplicative>
													<PUNCTUATOR line="2" col="33" value="*">*</PUNCTUATOR>
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
										<PUNCTUATOR line="2" col="37" value=";">;</PUNCTUATOR>
									</DeclarationVariable>
								</Statement>
							</Goal__0__List>
							<Statement line="3" col="1" source="the_answer = the_answer - &#x5c;z14 ;">
								<StatementAssignment line="3" col="1" source="the_answer = the_answer - &#x5c;z14 ;">
									<WORD line="3" col="1" value="128">the_answer</WORD>
									<PUNCTUATOR line="3" col="12" value="=">=</PUNCTUATOR>
									<Expression line="3" col="14" source="the_answer - &#x5c;z14">
										<ExpressionAdditive line="3" col="14" source="the_answer - &#x5c;z14">
											<ExpressionAdditive line="3" col="14" source="the_answer">
												<ExpressionMultiplicative line="3" col="14" source="the_answer">
													<ExpressionExponential line="3" col="14" source="the_answer">
														<ExpressionUnarySymbol line="3" col="14" source="the_answer">
															<ExpressionUnit line="3" col="14" source="the_answer">
																<WORD line="3" col="14" value="128">the_answer</WORD>
															</ExpressionUnit>
														</ExpressionUnarySymbol>
													</ExpressionExponential>
												</ExpressionMultiplicative>
											</ExpressionAdditive>
											<PUNCTUATOR line="3" col="25" value="-">-</PUNCTUATOR>
											<ExpressionMultiplicative line="3" col="27" source="&#x5c;z14">
												<ExpressionExponential line="3" col="27" source="&#x5c;z14">
													<ExpressionUnarySymbol line="3" col="27" source="&#x5c;z14">
														<ExpressionUnit line="3" col="27" source="&#x5c;z14">
															<PrimitiveLiteral line="3" col="27" source="&#x5c;z14">
																<NUMBER line="3" col="27" value="40">\\z14</NUMBER>
															</PrimitiveLiteral>
														</ExpressionUnit>
													</ExpressionUnarySymbol>
												</ExpressionExponential>
											</ExpressionMultiplicative>
										</ExpressionAdditive>
									</Expression>
									<PUNCTUATOR line="3" col="31" value=";">;</PUNCTUATOR>
								</StatementAssignment>
							</Statement>
						</Goal__0__List>
						<FILEBOUND value="false">␃</FILEBOUND>
					</Goal>
				`.replace(/\n\t*/g, ''))
			})
		})
	})
})

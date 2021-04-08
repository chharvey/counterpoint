import type {
	NonemptyArray,
} from '@chharvey/parser';
import * as assert from 'assert'

import {
	Dev,
} from '../../src/core/';
import {
	Operator,
} from '../../src/enum/Operator.enum';
import {
	ParserSolid as Parser,
	PARSER,
} from '../../src/parser/';
import {
	Decorator,
	AST,
	SolidTypeConstant,
	SolidObject,
	SolidNull,
	SolidBoolean,
	Int16,
	Float64,
} from '../../src/validator/';
import {
	assert_arrayLength,
} from '../assert-helpers'
import {
	keywordTypeFromString,
	unitTypeFromString,
	unaryTypeFromString,
	intersectionTypeFromString,
	unionTypeFromString,
	primitiveLiteralFromSource,
} from '../helpers-parse'
import * as h from '../helpers-parse';
import {
	constantFromSource,
	variableFromSource,
	operationFromSource,
	statementExpressionFromSource,
	variableDeclarationFromSource,
	typeDeclarationFromSource,
	assignmentFromSource,
	goalFromSource,
} from '../helpers-semantic'



describe('Decorator', () => {
	describe('.decorate', () => {
		context('Goal ::= #x02 #x03', () => {
			it('makes an ASTNodeGoal node containing no children.', () => {
				const goal: AST.ASTNodeGoal = Decorator.decorate(new Parser(``).parse());
				assert_arrayLength(goal.children, 0, 'semantic goal should have 0 children')
			})
		})

		context('Statement ::= ";"', () => {
			it('makes an ASTNodeStatementExpression node containing no children.', () => {
				const statement: AST.ASTNodeStatementExpression = statementExpressionFromSource(`;`);
				assert_arrayLength(statement.children, 0, 'semantic statement should have 0 children')
				assert.strictEqual(statement.source, `;`)
			})
		})

		Dev.supports('literalCollection') && describe('Word ::= KEYWORD | IDENTIFIER', () => {
			it('makes an ASTNodeKey.', () => {
				/*
					<Key source="let" id=\x8c/>
					<Key source="foobar" id=\x100/>
				*/
				const srcs: string[] = [
					`let`,
					`foobar`,
				];
				assert.deepStrictEqual(
					srcs.map((src) => {
						const key: AST.ASTNodeKey = Decorator.decorate(h.wordFromString(src));
						return [key.source, key.id];
					}),
					srcs.map((src, i) => [src, [
						0x8dn,
						0x100n,
					][i]]),
				);
			});
		});

		describe('PrimitiveLiteral ::= "null" | "false" | "true" | INTEGER | FLOAT | STRING', () => {
			it('makes an ASTNodeConstant.', () => {
				/*
					<Constant source="null" value="null"/>
				*/
				assert.deepStrictEqual([
					`null;`,
					`false;`,
					`true;`,
					`42;`,
					`4.2;`,
				].map((src) => (Decorator.decorate(primitiveLiteralFromSource(src)) as unknown as AST.ASTNodeConstant).value), [
					SolidNull.NULL,
					SolidBoolean.FALSE,
					SolidBoolean.TRUE,
					new Int16(42n),
					new Float64(4.2),
				])
			})
		})

		describe('TypeKeyword ::= "bool" | "int" | "float" | "obj"', () => {
			it('makes an ASTNodeTypeConstant.', () => {
				/*
					<TypeConstant source="bool" value="Boolean"/>
				*/
				assert.deepStrictEqual([
					`bool`,
					`int`,
					`float`,
					`obj`,
				].map((src) => (Decorator.decorate(keywordTypeFromString(src)) as unknown as AST.ASTNodeTypeConstant).value), [
					SolidBoolean,
					Int16,
					Float64,
					SolidObject,
				])
			})
		})

		Dev.supports('literalCollection') && describe('PropertyType ::= Word ":" Type', () => {
			it('makes an ASTNodePropertyType.', () => {
				/*
					<PropertyType>
						<Key source="fontSize"/>
						<TypeConstant source="float"/>
					</PropertyType>
				*/
				const propertytype: AST.ASTNodePropertyType = Decorator.decorate(h.propertyTypeFromString(`fontSize: float`));
				assert.deepStrictEqual(
					propertytype.children.map((c) => c.source),
					[`fontSize`, `float`],
				);
			});
		});

		Dev.supports('literalCollection') && describe('TypeTupleLiteral ::= "[" ","? Type# ","? "]"', () => {
			it('makes an ASTNodeTypeList.', () => {
				/*
					<TypeList>
						<TypeAlias source="T"/>
						<TypeConstant source="42"/>
						<TypeOperation source="null | bool">...</TypeOperation>
					</TypeList>
				*/
				assert.deepStrictEqual(Decorator.decorate(h.tupleTypeFromString(`
					[
						T,
						42,
						null | bool,
					]
				`)).children.map((c) => c.source), [
					`T`,
					`42`,
					`null | bool`,
				]);
			});
		});

		Dev.supports('literalCollection') && describe('TypeRecordLiteral ::= "[" ","? PropertyType# ","? "]"', () => {
			it('makes an ASTNodeTypeRecord.', () => {
				/*
					<TypeRecord>
						<PropertyType source="let: bool">...</PropertyType>
						<PropertyType source="foobar: int">...</PropertyType>
					</TypeRecord>
				*/
				assert.deepStrictEqual(Decorator.decorate(h.recordTypeFromString(`
					[
						let: bool,
						foobar: int,
					]
				`)).children.map((c) => c.source), [
					`let : bool`,
					`foobar : int`,
				]);
			});
		});

		Dev.supports('literalCollection') && describe('TypeUnit ::= "[" "]"', () => {
			it('makes an ASTNodeTypeEmptyCollection.', () => {
				/*
					<TypeEmptyCollection/>
				*/
				const typeexpr: AST.ASTNodeType = Decorator.decorate(h.unitTypeFromString(`[]`));
				assert.ok(typeexpr instanceof AST.ASTNodeTypeEmptyCollection);
			});
		});

		describe('TypeUnit ::= IDENTIFIER', () => {
			it('makes an ASTNodeTypeAlias.', () => {
				/*
					<TypeAlias source="Foo" id=257/>
				*/
				assert.deepStrictEqual([
					`Foo`,
					`Bar`,
					`Qux`,
				].map((src) => {
					const constant: AST.ASTNodeType = Decorator.decorate(unitTypeFromString(src));
					assert.ok(constant instanceof AST.ASTNodeTypeAlias);
					return constant.id;
				}), [
					// 257 because `T` is 256 from `type T = ` in `unitTypeFromString`
					257n,
					257n,
					257n,
				]);
			});
			it('assigns a unique ID starting from 256.', () => {
				/*
					<TypeOperation operator=OR>
						<TypeAlias source="Foo" id=256/>
						<TypeAlias source="Bar" id=257/>
					</TypeOperation>
				*/
				assert.deepStrictEqual(Decorator.decorate(unionTypeFromString(`Foo | Bar`)).children.map((op) => {
					assert.ok(op instanceof AST.ASTNodeTypeAlias);
					return op.id;
				}), [257n, 258n]);
			});
		});

		describe('TypeUnit ::= PrimitiveLiteral', () => {
			it('makes an ASTNodeTypeConstant.', () => {
				/*
					<TypeConstant source="null" value="SolidNull"/>
				*/
				assert.deepStrictEqual([
					`null`,
					`false`,
					`true`,
					`42`,
					`4.2`,
				].map((src) => {
					const constant: AST.ASTNodeType = Decorator.decorate(unitTypeFromString(src));
					assert.ok(constant instanceof AST.ASTNodeTypeConstant);
					return constant.value
				}), [
					SolidNull,
					SolidBoolean.FALSETYPE,
					SolidBoolean.TRUETYPE,
					new SolidTypeConstant(new Int16(42n)),
					new SolidTypeConstant(new Float64(4.2)),
				])
			})
		})

		describe('TypeUnarySymbol ::= TypeUnarySymbol "!"', () => {
			it('makes an ASTNodeTypeOperation.', () => {
				/*
					<TypeOperation operator="!">
						<TypeConstant source="int" value="Int16"/>
					</TypeOperation>
				*/
				const operation: AST.ASTNodeType = Decorator.decorate(unaryTypeFromString(`int!`));
				assert.ok(operation instanceof AST.ASTNodeTypeOperationUnary);
				const operand: AST.ASTNodeType = operation.children[0];
				assert.deepStrictEqual(
					[operand.source, operation.operator],
					[`int`,          Operator.ORNULL],
				)
			})
		})

		describe('TypeIntersection ::= TypeIntersection "&" TypeUnarySymbol', () => {
			it('makes an ASTNodeTypeOperation.', () => {
				/*
					<TypeOperation operator="&">
						<TypeConstant source="int"/>
						<TypeConstant source="3"/>
					</TypeOperation>
				*/
				const operation: AST.ASTNodeType = Decorator.decorate(intersectionTypeFromString(`int & 3`));
				assert.ok(operation instanceof AST.ASTNodeTypeOperationBinary);
				const left:  AST.ASTNodeType = operation.children[0];
				const right: AST.ASTNodeType = operation.children[1];
				assert.deepStrictEqual(
					[left.source, operation.operator, right.source],
					[`int`,       Operator.AND,       `3`],
				)
			})
		})

		describe('TypeUnion ::= TypeUnion "|" TypeIntersection', () => {
			it('makes an ASTNodeTypeOperation.', () => {
				/*
					<TypeOperation operator="|">
						<TypeOperation source="4.2 !">...</TypeOperation>
						<TypeOperation source="int & int">...</TypeOperation>
					</TypeOperation>
				*/
				const operation: AST.ASTNodeType = Decorator.decorate(unionTypeFromString(`4.2! | int & int`));
				assert.ok(operation instanceof AST.ASTNodeTypeOperationBinary);
				const left: AST.ASTNodeType = operation.children[0];
				const right: AST.ASTNodeType = operation.children[1];
				assert.deepStrictEqual(
					[left.source, operation.operator, right.source],
					[`4.2 !`,     Operator.OR,        `int & int`],
				)
			})
		})

		describe('Type ::= TypeUnion', () => {
			it('makes an ASTNodeTypeOperation.', () => {
				/*
					<TypeOperation operator="&">
						<TypeOperation source="4.2 !">...</TypeOperation>
						<TypeOperation source="int | int">...</TypeOperation>
					</TypeOperation>
				*/
				const operation: AST.ASTNodeType = Decorator.decorate(unionTypeFromString(`4.2! & (int | int)`));
				assert.ok(operation instanceof AST.ASTNodeTypeOperationBinary);
				const left:  AST.ASTNodeType = operation.children[0];
				const right: AST.ASTNodeType = operation.children[1];
				assert.deepStrictEqual(
					[left.source, operation.operator, right.source],
					[`4.2 !`,     Operator.AND,       `int | int`],
				)
			})
		})

		Dev.supports('stringTemplate-decorate') && describe('StringTemplate', () => {
			function templateSources(tpl: PARSER.ParseNodeStringTemplate, ...srcs: Readonly<NonemptyArray<string>>): void {
				return assert.deepStrictEqual([...Decorator.decorate(tpl).children].map((c) => c.source), srcs);
			}
			specify('StringTemplate ::= TEMPLATE_FULL', () => {
				templateSources(h.stringTemplateFromSource(`
					'''full1''';
				`), `'''full1'''`);
			});
			specify('StringTemplate ::= TEMPLATE_HEAD TEMPLATE_TAIL', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{}}tail1''';
				`), `'''head1{{`, `}}tail1'''`);
			});
			specify('StringTemplate ::= TEMPLATE_HEAD Expression TEMPLATE_TAIL', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}tail1''';
				`), `'''head1{{`, `'''full1'''`, `}}tail1'''`);
			});
			specify('StringTemplate ::= TEMPLATE_HEAD StringTemplate__0__List TEMPLATE_TAIL', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{}}midd1{{}}tail1''';
				`), `'''head1{{`, `}}midd1{{`, `}}tail1'''`);
			});
			specify('StringTemplate ::= TEMPLATE_HEAD Expression StringTemplate__0__List TEMPLATE_TAIL', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}midd1{{}}tail1''';
				`), `'''head1{{`, `'''full1'''`, `}}midd1{{`, `}}tail1'''`);
			});

			specify('StringTemplate__0__List ::= TEMPLATE_MIDDLE Expression', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}tail1''';
				`), `'''head1{{`, `'''full1'''`, `}}midd1{{`, `'''full2'''`, `}}tail1'''`);
			});
			specify('StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{}}tail1''';
				`), `'''head1{{`, `'''full1'''`, `}}midd1{{`, `'''full2'''`, `}}midd2{{`, `}}tail1'''`);
			});
			specify('StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE Expression', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{ '''head2{{ '''full3''' }}tail2''' }}tail1''';
				`), `'''head1{{`, `'''full1'''`, `}}midd1{{`, `'''full2'''`, `}}midd2{{`, `'''head2{{ '''full3''' }}tail2'''`, `}}tail1'''`);
			});
		});

		Dev.supports('literalCollection') && context('Property ::= Word "=" Expression', () => {
			it('makes an ASTNodeProperty.', () => {
				/*
					<Property>
						<Key source="fontSize"/>
						<Operation source="1. + 0.25">...</Operation>
					</Property>
				*/
				const property = Decorator.decorate(h.propertyFromString(`fontSize= 1. + 0.25`));
				assert.ok(property instanceof AST.ASTNodeProperty); // FIXME: `AST.ASTNodeProperty` is assignable to `TemplatePartialType`, so `Decorator.decorate` overlads get confused
				assert.deepStrictEqual(
					property.children.map((c) => c.source),
					[`fontSize`, `1. + 0.25`],
				);
			});
		});

		Dev.supports('literalCollection') && context('Case ::= Expression "|->" Expression', () => {
			it('makes an ASTNodeCase', () => {
				/*
					<Case>
						<Operation source="1 + 0.25">...</Operation>
						<Constant source="1.25"/>
					</Case>
				*/
				const kase: AST.ASTNodeCase = Decorator.decorate(h.caseFromString(`1 + 0.25 |-> 1.25`));
				assert.deepStrictEqual(
					kase.children.map((c) => c.source),
					[`1 + 0.25`, `1.25`],
				);
			});
		});

		Dev.supports('literalCollection') && context('ListLiteral ::= "[" ","? Expression# ","? "]"', () => {
			it('makes an ASTNodeList.', () => {
				/*
					<List>
						<Constant source="42"/>
						<Constant source="true"/>
						<Operation source="null || false">...</Operation>
					</List>
				*/
				assert.deepStrictEqual(Decorator.decorate(h.listLiteralFromSource(`
					[
						42,
						true,
						null || false,
					];
				`)).children.map((c) => c.source), [
					`42`,
					`true`,
					`null || false`,
				]);
			});
		});

		Dev.supports('literalCollection') && context('RecordLiteral ::= "[" ","? Property# ","? "]"', () => {
			it('makes an ASTNodeRecord.', () => {
				/*
					<Record>
						<Property source="let = true">...</Property>
						<Property source="foobar = 42">...</Property>
					</Record>
				*/
				assert.deepStrictEqual(Decorator.decorate(h.recordLiteralFromSource(`
					[
						let= true,
						foobar= 42,
					];
				`)).children.map((c) => c.source), [
					`let = true`,
					`foobar = 42`,
				]);
			});
		});

		Dev.supports('literalCollection') && context('MappingLiteral ::= "[" ","? Case# ","? "]"', () => {
			it('makes an ASTNodeMapping.', () => {
				/*
					<Mapping>
						<Case source="1 |-> null">...</Case>
						<Case source="4 |-> false">...</Case>
						<Case source="7 |-> true">...</Case>
						<Case source="9 |-> 42.0">...</Case>
					</Mapping>
				*/
				assert.deepStrictEqual(Decorator.decorate(h.mappingLiteralFromSource(`
					[
						1 |-> null,
						4 |-> false,
						7 |-> true,
						9 |-> 42.0,
					];
				`)).children.map((c) => c.source), [
					`1 |-> null`,
					`4 |-> false`,
					`7 |-> true`,
					`9 |-> 42.0`,
				]);
			});
		});

		Dev.supports('literalCollection') && context('ExpressionUnit ::= "[" "]"', () => {
			it('makes an ASTNodeEmptyCollection.', () => {
				/*
					<EmptyCollection/>
				*/
				const expr: AST.ASTNodeExpression = Decorator.decorate(h.unitExpressionFromSource(`[];`));
				assert.ok(expr instanceof AST.ASTNodeEmptyCollection);
			});
		});

		context('ExpressionUnit ::= IDENTIFIER', () => {
			it('assigns a unique ID starting from 256.', () => {
				/*
					<Goal source="␂ variable ; ␃">
						<StatementExpression source="variable ;">
							<Variable source="variable" id="256"/>
						</StatementExpression>
					</Goal>
				*/
				assert.deepStrictEqual([
					`variable;`,
					`var;`,
				].map((src) => variableFromSource(src).id), [
					256n,
					256n,
				]);
			});
			it('increments IDs for each variable.', () => {
				/*
					<Goal source="␂ variable || var ; ␃">
						<StatementExpression>
							<Operation operator=OR>
								<Variable source="variable" id="256"/>
								<Variable source="var" id="257"/>
							</Operation>
						</StatementExpression>
					</Goal>
				*/
				assert.deepStrictEqual(operationFromSource(`variable || var;`).children.map((op) => {
					assert.ok(op instanceof AST.ASTNodeVariable);
					return op.id;
				}), [256n, 257n]);
			});
			it('increments IDs even across statements.', () => {
				/*
					<Goal source="␂ variable ; var ; ␃">
						<StatementExpression>
							<Variable source="variable" id="256"/>
						</StatementExpression>
						<StatementExpression>
							<Variable source="var" id="257"/>
						</StatementExpression>
					</Goal>
				*/
				const goal: AST.ASTNodeGoal = goalFromSource(`variable; var;`);
				assert_arrayLength(goal.children, 2);
				assert.deepStrictEqual(goal.children.map((stmt) => {
					assert.ok(stmt instanceof AST.ASTNodeStatementExpression);
					assert_arrayLength(stmt.children, 1);
					const ident: AST.ASTNodeExpression = stmt.children[0];
					assert.ok(ident instanceof AST.ASTNodeVariable);
					return ident.id;
				}), [256n, 257n]);
			});
		});

		context('ExpressionUnit ::= PrimitiveLiteral', () => {
			it('makes an ASTNodeConstant.', () => {
				/*
					<Goal source="␂ null ; ␃">
						<StatementExpression line="1" col="1" source="null ;">
							<Constant line="1" col="1" source="null" value="null"/>
						</StatementExpression>
					</Goal>
				*/
				assert.deepStrictEqual([
					`null;`,
					`false;`,
					`true;`,
					`42;`,
				].map((src) => constantFromSource(src).value), [
					SolidNull.NULL,
					SolidBoolean.FALSE,
					SolidBoolean.TRUE,
					new Int16(42n),
				])
			})
		})

		context('ExpressionUnit ::= "(" Expression ")"', () => {
			it('returns the inner Expression node.', () => {
				/*
					<Operation operator=ADD>
						<Constant source="2"/>
						<Constant source="-3"/>
					</Operation>
				*/
				const operation: AST.ASTNodeOperation = operationFromSource(`(2 + -3);`);
				assert.ok(operation instanceof AST.ASTNodeOperationBinary);
				const [left, right]: readonly AST.ASTNodeExpression[] = operation.children;
				assert.ok(left  instanceof AST.ASTNodeConstant);
				assert.ok(right instanceof AST.ASTNodeConstant);
				assert.deepStrictEqual(
					[left.source, operation.operator, right.source],
					[`2`,         Operator.ADD,       `-3`],
				)
			})
			it('recursively applies to several sub-expressions.', () => {
				/*
					<Operation operator=EXP>
						<Operation operator=NEG>
							<Constant source="42"/>
						</Operation>
						<Operation operator=MUL>
							<Constant source="2"/>
							<Constant source="420"/>
						</Operation>
					</Operation>
				*/
				const operation: AST.ASTNodeOperation = operationFromSource(`(-(42) ^ +(2 * 420));`);
				assert.ok(operation instanceof AST.ASTNodeOperationBinary);
				assert.strictEqual(operation.operator, Operator.EXP)
				const [left, right]: readonly AST.ASTNodeExpression[] = operation.children;
				assert.ok(left instanceof AST.ASTNodeOperationUnary);
				assert.strictEqual(left.operator, Operator.NEG)
				assert_arrayLength(left.children, 1)
				assert.ok(left.children[0] instanceof AST.ASTNodeConstant);
				assert.strictEqual(left.children[0].source, `42`)

				assert.ok(right instanceof AST.ASTNodeOperationBinary);
				assert.strictEqual(right.operator, Operator.MUL)
				assert_arrayLength(right.children, 2)
				assert.deepStrictEqual(right.children.map((child) => {
					assert.ok(child instanceof AST.ASTNodeConstant);
					return child.source
				}), [`2`, `420`])
			})
		})

		context('ExpressionUnarySymbol ::= ("!" | "?" | "-") ExpressionUnarySymbol', () => {
			it('makes an ASTNodeOperation node with 1 child.', () => {
				/*
					<Operation operator=NEG>
						<Constant source="42"/>
					</Operation>
				*/
				assert.deepStrictEqual([
					`!null;`,
					`?41;`,
					`- 42;`,
				].map((src) => {
					const operation: AST.ASTNodeOperation = operationFromSource(src);
					assert.ok(operation instanceof AST.ASTNodeOperationUnary);
					const operand: AST.ASTNodeExpression = operation.children[0];
					assert.ok(operand instanceof AST.ASTNodeConstant);
					return [operand.source, operation.operator]
				}), [
					[`null`, Operator.NOT],
					[`41`,   Operator.EMP],
					[`42`,   Operator.NEG],
				])
			})
		})

		context('SemanticOperation ::= SemanticExpression SemanticExpression', () => {
			it('makes an ASTNodeOperation node with 2 children.', () => {
				/*
					<Operation operator=EXP>
						<Constant source="2"/>
						<Constant source="-3"/>
					</Operation>
				*/
				assert.deepStrictEqual([
					`2 ^ -3;`,
					`2 * -3;`,
					`2 + -3;`,
				].map((src) => {
					const operation: AST.ASTNodeOperation = operationFromSource(src);
					assert.ok(operation instanceof AST.ASTNodeOperationBinary);
					assert.deepStrictEqual(operation.children.map((operand) => {
						assert.ok(operand instanceof AST.ASTNodeConstant);
						return operand.source
					}), [`2`, `-3`])
					return operation.operator
				}), [
					Operator.EXP,
					Operator.MUL,
					Operator.ADD,
				])
			})
		})

		context('ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative', () => {
			it('makes an ASTNodeOperation with the `+` operator and negates the 2nd operand.', () => {
				/*
					<Operation operator=ADD>
						<Constant source="2"/>
						<Operation operator=NEG>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				const operation: AST.ASTNodeOperation = operationFromSource(`2 - 3;`);
				assert.ok(operation instanceof AST.ASTNodeOperationBinary);
				assert.strictEqual(operation.operator, Operator.ADD)
				const left:  AST.ASTNodeExpression = operation.children[0];
				const right: AST.ASTNodeExpression = operation.children[1];
				assert.ok(left  instanceof AST.ASTNodeConstant);
				assert.ok(right instanceof AST.ASTNodeOperationUnary);
				assert.ok(right.children[0] instanceof AST.ASTNodeConstant);
				assert.deepStrictEqual(
					[left.source, right.operator, right.children[0].source],
					[`2`,         Operator.NEG,   `3`],
				)
			})
		})

		context('ExpressionComparative ::= ExpressionComparative ("!<" | "!>") ExpressionAdditive', () => {
			it('makes an ASTNodeOperation with the `<` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=LT>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				const operation: AST.ASTNodeOperation = operationFromSource(`2 !< 3;`);
				assert.ok(operation instanceof AST.ASTNodeOperationUnary);
				assert.strictEqual(operation.operator, Operator.NOT)
				const child: AST.ASTNodeExpression = operation.children[0];
				assert.ok(child instanceof AST.ASTNodeOperationBinary);
				const left:  AST.ASTNodeExpression = child.children[0];
				const right: AST.ASTNodeExpression = child.children[1];
				assert.ok(left  instanceof AST.ASTNodeConstant);
				assert.ok(right instanceof AST.ASTNodeConstant);
				assert.deepStrictEqual(
					[left.source, child.operator, right.source],
					[`2`,         Operator.LT,    `3`],
				)
			})
			it('makes an ASTNodeOperation with the `>` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=GT>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				const operation: AST.ASTNodeOperation = operationFromSource(`2 !> 3;`);
				assert.ok(operation instanceof AST.ASTNodeOperationUnary);
				assert.strictEqual(operation.operator, Operator.NOT)
				const child: AST.ASTNodeExpression = operation.children[0];
				assert.ok(child instanceof AST.ASTNodeOperationBinary);
				const left:  AST.ASTNodeExpression = child.children[0];
				const right: AST.ASTNodeExpression = child.children[1];
				assert.ok(left  instanceof AST.ASTNodeConstant);
				assert.ok(right instanceof AST.ASTNodeConstant);
				assert.deepStrictEqual(
					[left.source, child.operator, right.source],
					[`2`,         Operator.GT,    `3`],
				)
			})
		})

		context('ExpressionEquality ::= ExpressionEquality ("isnt" | "!=") ExpressionComparative', () => {
			it('makes an ASTNodeOperation with the `is` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=IS>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				const operation: AST.ASTNodeOperation = operationFromSource(`2 isnt 3;`);
				assert.ok(operation instanceof AST.ASTNodeOperationUnary);
				assert.strictEqual(operation.operator, Operator.NOT)
				const child: AST.ASTNodeExpression = operation.children[0];
				assert.ok(child instanceof AST.ASTNodeOperationBinary);
				const left:  AST.ASTNodeExpression = child.children[0];
				const right: AST.ASTNodeExpression = child.children[1];
				assert.ok(left  instanceof AST.ASTNodeConstant);
				assert.ok(right instanceof AST.ASTNodeConstant);
				assert.deepStrictEqual(
					[left.source, child.operator, right.source],
					[`2`,         Operator.IS,    `3`],
				)
			})
			it('makes an ASTNodeOperation with the `==` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=EQ>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				const operation: AST.ASTNodeOperation = operationFromSource(`2 != 3;`);
				assert.ok(operation instanceof AST.ASTNodeOperationUnary);
				assert.strictEqual(operation.operator, Operator.NOT)
				const child: AST.ASTNodeExpression = operation.children[0];
				assert.ok(child instanceof AST.ASTNodeOperationBinary);
				const left:  AST.ASTNodeExpression = child.children[0];
				const right: AST.ASTNodeExpression = child.children[1];
				assert.ok(left  instanceof AST.ASTNodeConstant);
				assert.ok(right instanceof AST.ASTNodeConstant);
				assert.deepStrictEqual(
					[left.source, child.operator, right.source],
					[`2`,         Operator.EQ,    `3`],
				)
			})
		})

		context('ExpressionConjunctive ::= ExpressionConjunctive "!&" ExpressionEquality', () => {
			it('makes an ASTNodeOperation with the `&&` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=AND>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				const operation: AST.ASTNodeOperation = operationFromSource(`2 !& 3;`);
				assert.ok(operation instanceof AST.ASTNodeOperationUnary);
				assert.strictEqual(operation.operator, Operator.NOT)
				const child: AST.ASTNodeExpression = operation.children[0];
				assert.ok(child instanceof AST.ASTNodeOperationBinary);
				const left:  AST.ASTNodeExpression = child.children[0];
				const right: AST.ASTNodeExpression = child.children[1];
				assert.ok(left  instanceof AST.ASTNodeConstant);
				assert.ok(right instanceof AST.ASTNodeConstant);
				assert.deepStrictEqual(
					[left.source, child.operator, right.source],
					[`2`,         Operator.AND,   `3`],
				)
			})
		})

		context('ExpressionDisjunctive ::= ExpressionDisjunctive "!|" ExpressionConjunctive', () => {
			it('makes an ASTNodeOperation with the `||` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=OR>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				const operation: AST.ASTNodeOperation = operationFromSource(`2 !| 3;`);
				assert.ok(operation instanceof AST.ASTNodeOperationUnary);
				assert.strictEqual(operation.operator, Operator.NOT)
				const child: AST.ASTNodeExpression = operation.children[0];
				assert.ok(child instanceof AST.ASTNodeOperationBinary);
				const left:  AST.ASTNodeExpression = child.children[0];
				const right: AST.ASTNodeExpression = child.children[1];
				assert.ok(left  instanceof AST.ASTNodeConstant);
				assert.ok(right instanceof AST.ASTNodeConstant);
				assert.deepStrictEqual(
					[left.source, child.operator, right.source],
					[`2`,         Operator.OR,    `3`],
				)
			})
		})

		context('ExpressionConditional ::= "if" Expression "then" Expression "else" Expression', () => {
			it('makes an ASTNodeOperation with the COND operator and 3 children.', () => {
				/*
					<Operation operator=COND>
						<Constant value=true/>
						<Constant value=2n/>
						<Constant value=3n/>
					</Operation>
				*/
				const operation: AST.ASTNodeOperation = operationFromSource(`if true then 2 else 3;`);
				assert.ok(operation instanceof AST.ASTNodeOperationTernary);
				assert.deepStrictEqual(operation.children.map((child) => {
					assert.ok(child instanceof AST.ASTNodeConstant);
					return child.value
				}), [
					SolidBoolean.TRUE,
					new Int16(2n),
					new Int16(3n),
				])
			})
		})

		describe('DeclarationVariable ::= "let" "unfixed"? IDENTIFIER ":" Type "=" Expression ";"', () => {
			it('makes an unfixed ASTNodeDeclarationVariable node.', () => {
				/*
					<DeclarationVariable unfixed=true>
						<Variable source="the_answer" id=256n/>
						<TypeOperation operator=OR source="int | float">...</TypeOperation>
						<Operation operator=MUL source="21 * 2">...</Operation>
					</DeclarationVariable>
				*/
				const src: string = `let unfixed the_answer:  int | float =  21  *  2;`
				const decl: AST.ASTNodeDeclarationVariable = variableDeclarationFromSource(src);
				assert.strictEqual(decl.unfixed, true);
				assert.strictEqual(decl.children[0].id, 256n);
				const type_: AST.ASTNodeType = decl.children[1]
				assert.ok(type_ instanceof AST.ASTNodeTypeOperationBinary)
				assert.strictEqual(type_.operator, Operator.OR)
				const assigned_expr: AST.ASTNodeExpression = decl.children[2];
				assert.ok(assigned_expr instanceof AST.ASTNodeOperationBinary);
				assert.strictEqual(assigned_expr.operator, Operator.MUL)
				assert.deepStrictEqual(decl.children.map((child) => child.source), [
					`the_answer`, `int | float`, `21 * 2`,
				])
			})
			it('makes a fixed ASTNodeDeclarationVariable node.', () => {
				/*
					<DeclarationVariable unfixed=false>
						<Variable source="`the £ answer`" id=256n/>
						<TypeConstant source="int | float">...</TypeOperation>
						<Operation operator=MUL source="the_answer * 10">
							<Variable source="the_answer" id=257n/>
							<Constant source="10" value=10/>
						</Operation>
					</DeclarationVariable>
				*/
				const src: string = `let \`the £ answer\`: int = the_answer * 10;`
				const decl: AST.ASTNodeDeclarationVariable = variableDeclarationFromSource(src);
				assert.strictEqual(decl.unfixed, false);
				assert.strictEqual(decl.children[0].id, 256n);
				const type_: AST.ASTNodeType = decl.children[1]
				assert.ok(type_ instanceof AST.ASTNodeTypeConstant)
				const assigned_expr: AST.ASTNodeExpression = decl.children[2]
				assert.ok(assigned_expr instanceof AST.ASTNodeOperationBinary)
				assert.strictEqual(assigned_expr.operator, Operator.MUL)
				assert.ok(assigned_expr.children[0] instanceof AST.ASTNodeVariable);
				assert.strictEqual(assigned_expr.children[0].id, 257n);
				assert.deepStrictEqual(decl.children.map((child) => child.source), [
					`\`the £ answer\``, `int`, `the_answer * 10`,
				])
			})
		})

		describe('DeclarationType ::= "type" IDENTIFIER "=" Type ";"', () => {
			it('makes an ASTNodeDeclarationType node.', () => {
				/*
					<DeclarationType>
						<Variable source="T" id=256n/>
						<TypeOperation operator=OR source="int | float">...</TypeOperation>
					</DeclarationType>
				*/
				const decl: AST.ASTNodeDeclarationType = typeDeclarationFromSource(`
					type T  =  int | float;
				`);
				assert.strictEqual(decl.children[0].id, 256n);
				const typ: AST.ASTNodeType = decl.children[1];
				assert.ok(typ instanceof AST.ASTNodeTypeOperationBinary);
				assert.strictEqual(typ.operator, Operator.OR);
				assert.deepStrictEqual(decl.children.map((child) => child.source), [
					`T`, `int | float`,
				]);
			});
		});

		describe('Assignee ::= IDENTIFIER', () => {
			it('makes an ASTNodeVariable node.', () => {
				/*
					<Variable source="the_answer" id=256n/>
				*/
				const id: AST.ASTNodeVariable = assignmentFromSource(`the_answer = the_answer - 40;`).children[0];
				assert.strictEqual(id.id, 256n);
				assert.strictEqual(id.source, `the_answer`);
			});
		});

		describe('StatementAssignment ::= Assignee "=" Expression ";"', () => {
			it('makes an ASTNodeAssignment node.', () => {
				/*
					<Assignment>
						<Variable source="the_answer">...</Variable>
						<Operation operator=ADD source="the_answer - 40">
							<Variable source="the_answer" id="256"/>
							<Operation operator=NEG source="40">...</Operation>
						</Operation>
					</Assignment>
				*/
				const src: string = `the_answer = the_answer - 40;`;
				const assn: AST.ASTNodeAssignment = assignmentFromSource(src);
				const assigned_expr: AST.ASTNodeExpression = assn.children[1];
				assert.ok(assigned_expr instanceof AST.ASTNodeOperationBinary);
				assert.strictEqual(assigned_expr.operator, Operator.ADD);
				assert.ok(assigned_expr.children[0] instanceof AST.ASTNodeVariable);
				assert.strictEqual(assigned_expr.children[0].id, 256n);
				assert.deepStrictEqual(assn.children.map((child) => child.source), [
					`the_answer`, `the_answer - 40`
				]);
			})
		})

		context('Goal__0__List ::= Goal__0__List Statement', () => {
			it('decorates multiple statements.', () => {
				/*
					<Goal>
						<StatementExpression source="42 ;">...</StatementExpression>
						<StatementExpression source="420 ;">...</StatementExpression>
					</Goal>
				*/
				const goal: AST.ASTNodeGoal = Decorator.decorate(new Parser(`42; 420;`).parse());
				assert_arrayLength(goal.children, 2, 'goal should have 2 children')
				assert.deepStrictEqual(goal.children.map((stat) => {
					assert.ok(stat instanceof AST.ASTNodeStatementExpression);
					return stat.source
				}), ['42 ;', '420 ;'])
			})
		})
	})
})

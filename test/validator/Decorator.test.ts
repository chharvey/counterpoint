import * as assert from 'assert'

import Util from '../../src/class/Util.class'
import Dev from '../../src/class/Dev.class'
import Operator from '../../src/enum/Operator.enum'
import {
	ParserSolid as Parser,
} from '../../src/parser/';
import {
	Decorator,
	SemanticNodeType,
	SemanticNodeTypeConstant,
	SemanticNodeTypeOperationUnary,
	SemanticNodeTypeOperationBinary,
	SemanticNodeExpression,
	SemanticNodeConstant,
	SemanticNodeTemplate,
	SemanticNodeOperation,
	SemanticNodeOperationUnary,
	SemanticNodeOperationBinary,
	SemanticNodeOperationTernary,
	SemanticNodeStatementExpression,
	SemanticNodeDeclarationVariable,
	SemanticNodeGoal,
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
import {
	constantFromSource,
	identifierFromSource,
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
			it('makes a SemanticNodeGoal node containing no children.', () => {
				const goal: SemanticNodeGoal = Decorator.decorate(new Parser(``).parse())
				assert_arrayLength(goal.children, 0, 'semantic goal should have 0 children')
			})
		})

		context('Statement ::= ";"', () => {
			it('makes a SemanticNodeStatementExpression node containing no children.', () => {
				const statement: SemanticNodeStatementExpression = statementExpressionFromSource(`;`)
				assert_arrayLength(statement.children, 0, 'semantic statement should have 0 children')
				assert.strictEqual(statement.source, `;`)
			})
		})

		describe('PrimitiveLiteral ::= "null" | "false" | "true" | INTEGER | FLOAT | STRING', () => {
			it('makes a SemanticNodeConstant.', () => {
				/*
					<Constant source="null" value="null"/>
				*/
				assert.deepStrictEqual([
					`null;`,
					`false;`,
					`true;`,
					`42;`,
					`4.2;`,
				].map((src) => Decorator.decorate(primitiveLiteralFromSource(src)).value), [
					SolidNull.NULL,
					SolidBoolean.FALSE,
					SolidBoolean.TRUE,
					new Int16(42n),
					new Float64(4.2),
				])
			})
		})

		Dev.supports('typingExplicit') && describe('TypeKeyword ::= "bool" | "int" | "float" | "obj"', () => {
			it('makes a SemanticNodeTypeConstant.', () => {
				/*
					<TypeConstant source="bool" value="Boolean"/>
				*/
				assert.deepStrictEqual([
					`bool`,
					`int`,
					`float`,
					`obj`,
				].map((src) => Decorator.decorate(keywordTypeFromString(src)).value), [
					SolidBoolean,
					Int16,
					Float64,
					SolidObject,
				])
			})
		})

		Dev.supports('typingExplicit') && describe('TypeUnit ::= PrimitiveLiteral', () => {
			it('makes a SemanticNodeTypeConstant.', () => {
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
					const constant: SemanticNodeType = Decorator.decorate(unitTypeFromString(src))
					assert.ok(constant instanceof SemanticNodeTypeConstant)
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

		Dev.supports('typingExplicit') && describe('TypeUnarySymbol ::= TypeUnarySymbol "!"', () => {
			it('makes a SemanticTypeOperation.', () => {
				/*
					<TypeOperation operator="!">
						<TypeConstant source="int" value="Int16"/>
					</TypeOperation>
				*/
				const operation: SemanticNodeType = Decorator.decorate(unaryTypeFromString(`int!`))
				assert.ok(operation instanceof SemanticNodeTypeOperationUnary)
				const operand: SemanticNodeType = operation.children[0]
				assert.deepStrictEqual(
					[operand.source, operation.operator],
					[`int`,          Operator.ORNULL],
				)
			})
		})

		Dev.supports('typingExplicit') && describe('TypeIntersection ::= TypeIntersection "&" TypeUnarySymbol', () => {
			it('makes a SemanticTypeOperation.', () => {
				/*
					<TypeOperation operator="&">
						<TypeConstant source="int"/>
						<TypeConstant source="3"/>
					</TypeOperation>
				*/
				const operation: SemanticNodeType = Decorator.decorate(intersectionTypeFromString(`int & 3`))
				assert.ok(operation instanceof SemanticNodeTypeOperationBinary)
				const left:  SemanticNodeType = operation.children[0]
				const right: SemanticNodeType = operation.children[1]
				assert.deepStrictEqual(
					[left.source, operation.operator, right.source],
					[`int`,       Operator.AND,       `3`],
				)
			})
		})

		Dev.supports('typingExplicit') && describe('TypeUnion ::= TypeUnion "|" TypeIntersection', () => {
			it('makes a SemanticTypeOperation.', () => {
				/*
					<TypeOperation operator="|">
						<TypeOperation source="4.2 !">...</TypeOperation>
						<TypeOperation source="int & int">...</TypeOperation>
					</TypeOperation>
				*/
				const operation: SemanticNodeType = Decorator.decorate(unionTypeFromString(`4.2! | int & int`))
				assert.ok(operation instanceof SemanticNodeTypeOperationBinary)
				const left:  SemanticNodeType = operation.children[0]
				const right: SemanticNodeType = operation.children[1]
				assert.deepStrictEqual(
					[left.source, operation.operator, right.source],
					[`4.2 !`,     Operator.OR,        `int & int`],
				)
			})
		})

		Dev.supports('typingExplicit') && describe('Type ::= TypeUnion', () => {
			it('makes a SemanticTypeOperation.', () => {
				/*
					<TypeOperation operator="&">
						<TypeOperation source="4.2 !">...</TypeOperation>
						<TypeOperation source="int | int">...</TypeOperation>
					</TypeOperation>
				*/
				const operation: SemanticNodeType = Decorator.decorate(unionTypeFromString(`4.2! & (int | int)`))
				assert.ok(operation instanceof SemanticNodeTypeOperationBinary)
				const left:  SemanticNodeType = operation.children[0]
				const right: SemanticNodeType = operation.children[1]
				assert.deepStrictEqual(
					[left.source, operation.operator, right.source],
					[`4.2 !`,     Operator.AND,       `int | int`],
				)
			})
		})

		Dev.supports('variables') && context('ExpressionUnit ::= IDENTIFIER', () => {
			it('assigns a unique ID starting from 256.', () => {
				/*
					<Goal source="␂ variable ; ␃">
						<StatementExpression source="variable ;">
							<Identifier source="variable" id="256"/>
						</StatementExpression>
					</Goal>
				*/
				assert.deepStrictEqual([
					`variable;`,
					`var;`,
				].map((src) => identifierFromSource(src).id), [
					256n,
					256n,
				]);
			});
			it('increments IDs for each variable.', () => {
				/*
					<Goal source="␂ variable || var ; ␃">
						<StatementExpression>
							<Operation operator=OR>
								<Identifier source="variable" id="256"/>
								<Identifier source="var" id="257"/>
							</Operation>
						</StatementExpression>
					</Goal>
				*/
				assert.deepStrictEqual(operationFromSource(`variable || var;`).children.map((op) => {
					assert.ok(op instanceof AST.SemanticNodeIdentifier);
					return op.id;
				}), [256n, 257n]);
			});
			it('increments IDs even across statements.', () => {
				/*
					<Goal source="␂ variable ; var ; ␃">
						<StatementExpression>
							<Identifier source="variable" id="256"/>
						</StatementExpression>
						<StatementExpression>
							<Identifier source="var" id="257"/>
						</StatementExpression>
					</Goal>
				*/
				const goal: AST.SemanticNodeGoal = goalFromSource(`variable; var;`);
				assert_arrayLength(goal.children, 2);
				assert.deepStrictEqual(goal.children.map((stmt) => {
					assert.ok(stmt instanceof AST.SemanticNodeStatementExpression);
					assert_arrayLength(stmt.children, 1);
					const ident: AST.SemanticNodeExpression = stmt.children[0];
					assert.ok(ident instanceof AST.SemanticNodeIdentifier);
					return ident.id;
				}), [256n, 257n]);
			});
		});

		context('ExpressionUnit ::= PrimitiveLiteral', () => {
			it('makes a SemanticNodeConstant node.', () => {
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

		Dev.supports('literalTemplate') && context('ExpressionUnit ::= StringTemplate', () => {
			function stringTemplateSemanticNode(src: string): string {
				return ((Decorator
					.decorate(new Parser(src).parse())
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeTemplate)
					.serialize()
			}
			specify('head, tail.', () => {
				assert.strictEqual(stringTemplateSemanticNode(Util.dedent(`
					'''head1{{}}tail1''';
				`)), `
					<Template line="1" col="1" source="&apos;&apos;&apos;head1{{ }}tail1&apos;&apos;&apos;">
						<Constant line="1" col="1" source="&apos;&apos;&apos;head1{{" value="head1"/>
						<Constant line="1" col="11" source="}}tail1&apos;&apos;&apos;" value="tail1"/>
					</Template>
				`.replace(/\n\t*/g, ''))
			})
			specify('head, expr, tail.', () => {
				assert.strictEqual(stringTemplateSemanticNode(Util.dedent(`
					'''head1{{ '''full1''' }}tail1''';
				`)), `
					<Template line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}tail1&apos;&apos;&apos;">
						<Constant line="1" col="1" source="&apos;&apos;&apos;head1{{" value="head1"/>
						<Template line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
							<Constant line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;" value="full1"/>
						</Template>
						<Constant line="1" col="24" source="}}tail1&apos;&apos;&apos;" value="tail1"/>
					</Template>
				`.replace(/\n\t*/g, ''))
			})
			specify('head, expr, middle, tail.', () => {
				assert.strictEqual(stringTemplateSemanticNode(Util.dedent(`
					'''head1{{ '''full1''' }}midd1{{}}tail1''';
				`)), `
					<Template line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}midd1{{ }}tail1&apos;&apos;&apos;">
						<Constant line="1" col="1" source="&apos;&apos;&apos;head1{{" value="head1"/>
						<Template line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
							<Constant line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;" value="full1"/>
						</Template>
						<Constant line="1" col="24" source="}}midd1{{" value="midd1"/>
						<Constant line="1" col="33" source="}}tail1&apos;&apos;&apos;" value="tail1"/>
					</Template>
				`.replace(/\n\t*/g, ''))
			})
			specify('head, expr, middle, expr, tail.', () => {
				assert.strictEqual(stringTemplateSemanticNode(Util.dedent(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}tail1''';
				`)), `
					<Template line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos; }}tail1&apos;&apos;&apos;">
						<Constant line="1" col="1" source="&apos;&apos;&apos;head1{{" value="head1"/>
						<Template line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
							<Constant line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;" value="full1"/>
						</Template>
						<Constant line="1" col="24" source="}}midd1{{" value="midd1"/>
						<Template line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
							<Constant line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;" value="full2"/>
						</Template>
						<Constant line="1" col="46" source="}}tail1&apos;&apos;&apos;" value="tail1"/>
					</Template>
				`.replace(/\n\t*/g, ''))
			})
			specify('head, expr, middle, expr, middle, tail.', () => {
				assert.strictEqual(stringTemplateSemanticNode(Util.dedent(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{}}tail1''';
				`)), `
					<Template line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos; }}midd2{{ }}tail1&apos;&apos;&apos;">
						<Constant line="1" col="1" source="&apos;&apos;&apos;head1{{" value="head1"/>
						<Template line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
							<Constant line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;" value="full1"/>
						</Template>
						<Constant line="1" col="24" source="}}midd1{{" value="midd1"/>
						<Template line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
							<Constant line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;" value="full2"/>
						</Template>
						<Constant line="1" col="46" source="}}midd2{{" value="midd2"/>
						<Constant line="1" col="55" source="}}tail1&apos;&apos;&apos;" value="tail1"/>
					</Template>
				`.replace(/\n\t*/g, ''))
			})
			specify('head, expr, middle, expr, middle, expr, tail.', () => {
				assert.strictEqual(stringTemplateSemanticNode(Util.dedent(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{ '''head2{{ '''full3''' }}tail2''' }}tail1''';
				`)), `
					<Template line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos; }}midd2{{ &apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos; }}tail1&apos;&apos;&apos;">
						<Constant line="1" col="1" source="&apos;&apos;&apos;head1{{" value="head1"/>
						<Template line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
							<Constant line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;" value="full1"/>
						</Template>
						<Constant line="1" col="24" source="}}midd1{{" value="midd1"/>
						<Template line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
							<Constant line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;" value="full2"/>
						</Template>
						<Constant line="1" col="46" source="}}midd2{{" value="midd2"/>
						<Template line="1" col="56" source="&apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
							<Constant line="1" col="56" source="&apos;&apos;&apos;head2{{" value="head2"/>
							<Template line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;">
								<Constant line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;" value="full3"/>
							</Template>
							<Constant line="1" col="79" source="}}tail2&apos;&apos;&apos;" value="tail2"/>
						</Template>
						<Constant line="1" col="90" source="}}tail1&apos;&apos;&apos;" value="tail1"/>
					</Template>
				`.replace(/\n\t*/g, ''))
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
				const operation: SemanticNodeOperation = operationFromSource(`(2 + -3);`);
				assert.ok(operation instanceof SemanticNodeOperationBinary)
				const [left, right]: readonly SemanticNodeExpression[] = operation.children
				assert.ok(left instanceof SemanticNodeConstant)
				assert.ok(right instanceof SemanticNodeConstant)
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
				const operation: SemanticNodeOperation = operationFromSource(`(-(42) ^ +(2 * 420));`);
				assert.ok(operation instanceof SemanticNodeOperationBinary)
				assert.strictEqual(operation.operator, Operator.EXP)
				const [left, right]: readonly SemanticNodeExpression[] = operation.children
				assert.ok(left instanceof SemanticNodeOperationUnary)
				assert.strictEqual(left.operator, Operator.NEG)
				assert_arrayLength(left.children, 1)
				assert.ok(left.children[0] instanceof SemanticNodeConstant)
				assert.strictEqual(left.children[0].source, `42`)

				assert.ok(right instanceof SemanticNodeOperationBinary)
				assert.strictEqual(right.operator, Operator.MUL)
				assert_arrayLength(right.children, 2)
				assert.deepStrictEqual(right.children.map((child) => {
					assert.ok(child instanceof SemanticNodeConstant)
					return child.source
				}), [`2`, `420`])
			})
		})

		context('ExpressionUnarySymbol ::= ("!" | "?" | "-") ExpressionUnarySymbol', () => {
			it('makes a SemanticNodeOperation node with 1 child.', () => {
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
					const operation: SemanticNodeOperation = operationFromSource(src);
					assert.ok(operation instanceof SemanticNodeOperationUnary)
					const operand: SemanticNodeExpression = operation.children[0]
					assert.ok(operand instanceof SemanticNodeConstant)
					return [operand.source, operation.operator]
				}), [
					[`null`, Operator.NOT],
					[`41`,   Operator.EMP],
					[`42`,   Operator.NEG],
				])
			})
		})

		context('SemanticOperation ::= SemanticExpression SemanticExpression', () => {
			it('makes a SemanticNodeOperation node with 2 children.', () => {
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
					const operation: SemanticNodeOperation = operationFromSource(src);
					assert.ok(operation instanceof SemanticNodeOperationBinary)
					assert.deepStrictEqual(operation.children.map((operand) => {
						assert.ok(operand instanceof SemanticNodeConstant)
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
			it('makes a SemanticNodeOperation with the `+` operator and negates the 2nd operand.', () => {
				/*
					<Operation operator=ADD>
						<Constant source="2"/>
						<Operation operator=NEG>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				const operation: SemanticNodeOperation = operationFromSource(`2 - 3;`);
				assert.ok(operation instanceof SemanticNodeOperationBinary)
				assert.strictEqual(operation.operator, Operator.ADD)
				const left:  SemanticNodeExpression = operation.children[0]
				const right: SemanticNodeExpression = operation.children[1]
				assert.ok(left  instanceof SemanticNodeConstant)
				assert.ok(right instanceof SemanticNodeOperationUnary)
				assert.ok(right.children[0] instanceof SemanticNodeConstant)
				assert.deepStrictEqual(
					[left.source, right.operator, right.children[0].source],
					[`2`,         Operator.NEG,   `3`],
				)
			})
		})

		context('ExpressionComparative ::= ExpressionComparative ("!<" | "!>") ExpressionAdditive', () => {
			it('makes a SemanticNodeOperation with the `<` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=LT>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				const operation: SemanticNodeOperation = operationFromSource(`2 !< 3;`);
				assert.ok(operation instanceof SemanticNodeOperationUnary)
				assert.strictEqual(operation.operator, Operator.NOT)
				const child: SemanticNodeExpression = operation.children[0]
				assert.ok(child instanceof SemanticNodeOperationBinary)
				const left:  SemanticNodeExpression = child.children[0]
				const right: SemanticNodeExpression = child.children[1]
				assert.ok(left  instanceof SemanticNodeConstant)
				assert.ok(right instanceof SemanticNodeConstant)
				assert.deepStrictEqual(
					[left.source, child.operator, right.source],
					[`2`,         Operator.LT,    `3`],
				)
			})
			it('makes a SemanticNodeOperation with the `>` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=GT>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				const operation: SemanticNodeOperation = operationFromSource(`2 !> 3;`);
				assert.ok(operation instanceof SemanticNodeOperationUnary)
				assert.strictEqual(operation.operator, Operator.NOT)
				const child: SemanticNodeExpression = operation.children[0]
				assert.ok(child instanceof SemanticNodeOperationBinary)
				const left:  SemanticNodeExpression = child.children[0]
				const right: SemanticNodeExpression = child.children[1]
				assert.ok(left  instanceof SemanticNodeConstant)
				assert.ok(right instanceof SemanticNodeConstant)
				assert.deepStrictEqual(
					[left.source, child.operator, right.source],
					[`2`,         Operator.GT,    `3`],
				)
			})
		})

		context('ExpressionEquality ::= ExpressionEquality ("isnt" | "!=") ExpressionComparative', () => {
			it('makes a SemanticNodeOperation with the `is` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=IS>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				const operation: SemanticNodeOperation = operationFromSource(`2 isnt 3;`);
				assert.ok(operation instanceof SemanticNodeOperationUnary)
				assert.strictEqual(operation.operator, Operator.NOT)
				const child: SemanticNodeExpression = operation.children[0]
				assert.ok(child instanceof SemanticNodeOperationBinary)
				const left:  SemanticNodeExpression = child.children[0]
				const right: SemanticNodeExpression = child.children[1]
				assert.ok(left  instanceof SemanticNodeConstant)
				assert.ok(right instanceof SemanticNodeConstant)
				assert.deepStrictEqual(
					[left.source, child.operator, right.source],
					[`2`,         Operator.IS,    `3`],
				)
			})
			it('makes a SemanticNodeOperation with the `==` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=EQ>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				const operation: SemanticNodeOperation = operationFromSource(`2 != 3;`);
				assert.ok(operation instanceof SemanticNodeOperationUnary)
				assert.strictEqual(operation.operator, Operator.NOT)
				const child: SemanticNodeExpression = operation.children[0]
				assert.ok(child instanceof SemanticNodeOperationBinary)
				const left:  SemanticNodeExpression = child.children[0]
				const right: SemanticNodeExpression = child.children[1]
				assert.ok(left  instanceof SemanticNodeConstant)
				assert.ok(right instanceof SemanticNodeConstant)
				assert.deepStrictEqual(
					[left.source, child.operator, right.source],
					[`2`,         Operator.EQ,    `3`],
				)
			})
		})

		context('ExpressionConjunctive ::= ExpressionConjunctive "!&" ExpressionEquality', () => {
			it('makes a SemanticNodeOperation with the `&&` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=AND>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				const operation: SemanticNodeOperation = operationFromSource(`2 !& 3;`);
				assert.ok(operation instanceof SemanticNodeOperationUnary)
				assert.strictEqual(operation.operator, Operator.NOT)
				const child: SemanticNodeExpression = operation.children[0]
				assert.ok(child instanceof SemanticNodeOperationBinary)
				const left:  SemanticNodeExpression = child.children[0]
				const right: SemanticNodeExpression = child.children[1]
				assert.ok(left  instanceof SemanticNodeConstant)
				assert.ok(right instanceof SemanticNodeConstant)
				assert.deepStrictEqual(
					[left.source, child.operator, right.source],
					[`2`,         Operator.AND,   `3`],
				)
			})
		})

		context('ExpressionDisjunctive ::= ExpressionDisjunctive "!|" ExpressionConjunctive', () => {
			it('makes a SemanticNodeOperation with the `||` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=OR>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				const operation: SemanticNodeOperation = operationFromSource(`2 !| 3;`);
				assert.ok(operation instanceof SemanticNodeOperationUnary)
				assert.strictEqual(operation.operator, Operator.NOT)
				const child: SemanticNodeExpression = operation.children[0]
				assert.ok(child instanceof SemanticNodeOperationBinary)
				const left:  SemanticNodeExpression = child.children[0]
				const right: SemanticNodeExpression = child.children[1]
				assert.ok(left  instanceof SemanticNodeConstant)
				assert.ok(right instanceof SemanticNodeConstant)
				assert.deepStrictEqual(
					[left.source, child.operator, right.source],
					[`2`,         Operator.OR,    `3`],
				)
			})
		})

		context('ExpressionConditional ::= "if" Expression "then" Expression "else" Expression', () => {
			it('makes a SemanticNodeOperation with the COND operator and 3 children.', () => {
				/*
					<Operation operator=COND>
						<Constant value=true/>
						<Constant value=2n/>
						<Constant value=3n/>
					</Operation>
				*/
				const operation: SemanticNodeOperation = operationFromSource(`if true then 2 else 3;`);
				assert.ok(operation instanceof SemanticNodeOperationTernary)
				assert.deepStrictEqual(operation.children.map((child) => {
					assert.ok(child instanceof SemanticNodeConstant)
					return child.value
				}), [
					SolidBoolean.TRUE,
					new Int16(2n),
					new Int16(3n),
				])
			})
		})

		Dev.supportsAll('variables', 'typingExplicit') && describe('DeclarationVariable', () => {
			it('makes an unfixed SemanticNodeDeclarationVariable node.', () => {
				/*
					<SemanticDeclarationVariable unfixed=true>
						<Assignee>
							<Identifier source="the_answer" id=256n/>
						</Assignee>
						<TypeOperation operator=OR source="int | float">...</TypeOperation>
						<Operation operator=MUL source="21 * 2">...</Operation>
					</SemanticDeclarationVariable>
				*/
				const src: string = `let unfixed the_answer:  int | float =  21  *  2;`
				const decl: SemanticNodeDeclarationVariable = variableDeclarationFromSource(src);
				assert.strictEqual(decl.unfixed, true);
				const assignee: AST.SemanticNodeAssignee = decl.children[0];
				assert.strictEqual(assignee.children[0].id, 256n);
				const type_: SemanticNodeType = decl.children[1]
				assert.ok(type_ instanceof SemanticNodeTypeOperationBinary)
				assert.strictEqual(type_.operator, Operator.OR)
				const assigned_expr: SemanticNodeExpression = decl.children[2]
				assert.ok(assigned_expr instanceof SemanticNodeOperationBinary)
				assert.strictEqual(assigned_expr.operator, Operator.MUL)
				assert.deepStrictEqual(decl.children.map((child) => child.source), [
					`the_answer`, `int | float`, `21 * 2`,
				])
			})
			it('makes a fixed SemanticNodeDeclarationVariable node.', () => {
				/*
					<SemanticDeclarationVariable unfixed=false>
						<Assignee>
							<Identifier source="`the £ answer`" id=256n/>
						</Assignee>
						<TypeConstant source="int | float">...</TypeOperation>
						<Operation operator=MUL source="the_answer * 10">
							<Identifier source="the_answer" id=257n/>
							<Constant source="10" value=10/>
						</Operation>
					</SemanticDeclarationVariable>
				*/
				const src: string = `let \`the £ answer\`: int = the_answer * 10;`
				const decl: SemanticNodeDeclarationVariable = variableDeclarationFromSource(src);
				assert.strictEqual(decl.unfixed, false);
				const assignee: AST.SemanticNodeAssignee = decl.children[0];
				assert.strictEqual(assignee.children[0].id, 256n);
				const type_: SemanticNodeType = decl.children[1]
				assert.ok(type_ instanceof SemanticNodeTypeConstant)
				const assigned_expr: SemanticNodeExpression = decl.children[2]
				assert.ok(assigned_expr instanceof SemanticNodeOperationBinary)
				assert.strictEqual(assigned_expr.operator, Operator.MUL)
				assert.ok(assigned_expr.children[0] instanceof AST.SemanticNodeIdentifier);
				assert.strictEqual(assigned_expr.children[0].id, 257n);
				assert.deepStrictEqual(decl.children.map((child) => child.source), [
					`\`the £ answer\``, `int`, `the_answer * 10`,
				])
			})
		})

		Dev.supportsAll('variables', 'typingExplicit') && describe('DeclarationType', () => {
			it('makes a SemanticNodeDeclarationType node.', () => {
				/*
					<SemanticDeclarationType>
						<Assignee>
							<Identifier source="T" id=256n/>
						</Assignee>
						<TypeOperation operator=OR source="int | float">...</TypeOperation>
					</SemanticDeclarationType>
				*/
				const decl: AST.SemanticNodeDeclarationType = typeDeclarationFromSource(`
					type T  =  int | float;
				`);
				assert.strictEqual(decl.children[0].children[0].id, 256n);
				const typ: AST.SemanticNodeType = decl.children[1];
				assert.ok(typ instanceof AST.SemanticNodeTypeOperationBinary);
				assert.strictEqual(typ.operator, Operator.OR);
				assert.deepStrictEqual(decl.children.map((child) => child.source), [
					`T`, `int | float`,
				]);
			});
		});

		Dev.supports('variables') && describe('StatementAssignment', () => {
			it('makes SemanticNodeAssignment nodes.', () => {
				/*
					<Assignment>
						<Assignee>
							<Identifier source="the_answer" id=256n/>
						</Assignee>
						<Operation operator=ADD source="the_answer - 40">
							<Identifier source="the_answer" id="256"/>
							<Operation operator=NEG source="40">...</Operation>
						</Operation>
					</Assignment>
				*/
				const src: string = `the_answer = the_answer - 40;`;
				const assn: AST.SemanticNodeAssignment = assignmentFromSource(src);
				const assignee: AST.SemanticNodeAssignee = assn.children[0];
				assert.strictEqual(assignee.children[0].id, 256n);
				const assigned_expr: AST.SemanticNodeExpression = assn.children[1];
				assert.ok(assigned_expr instanceof AST.SemanticNodeOperationBinary);
				assert.strictEqual(assigned_expr.operator, Operator.ADD);
				assert.ok(assigned_expr.children[0] instanceof AST.SemanticNodeIdentifier);
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
				const goal: SemanticNodeGoal = Decorator.decorate(new Parser(`42; 420;`).parse())
				assert_arrayLength(goal.children, 2, 'goal should have 2 children')
				assert.deepStrictEqual(goal.children.map((stat) => {
					assert.ok(stat instanceof SemanticNodeStatementExpression)
					return stat.source
				}), ['42 ;', '420 ;'])
			})
		})
	})
})

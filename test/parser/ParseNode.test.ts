import * as assert from 'assert'

import {CONFIG_DEFAULT} from '../../src/SolidConfig'
import Util   from '../../src/class/Util.class'
import Dev from '../../src/class/Dev.class'
import Operator from '../../src/enum/Operator.enum'
import {
	ScannerSolid as Scanner,
} from '../../src/lexer/'
import {
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
	SemanticNodeGoal,
	SolidTypeConstant,
	SolidObject,
	SolidNull,
	SolidBoolean,
	Int16,
	Float64,
} from '../../src/validator/'

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
	constantFromStatementExpression,
	operationFromStatementExpression,
	statementExpressionFromSource,
} from '../helpers-semantic'



describe('ParseNodeSolid', () => {
	describe('#decorate', () => {
		context('Goal ::= #x02 #x03', () => {
			it('makes a SemanticNodeGoal node containing no children.', () => {
				const goal: SemanticNodeGoal = new Scanner('', CONFIG_DEFAULT).lexer.screener.parser.parse().decorate()
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
				].map((src) => primitiveLiteralFromSource(src).decorate().value), [
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
				].map((src) => keywordTypeFromString(src).decorate().value), [
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
					const constant: SemanticNodeType = unitTypeFromString(src).decorate()
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
				const operation: SemanticNodeType = unaryTypeFromString(`int!`).decorate()
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
				const operation: SemanticNodeType = intersectionTypeFromString(`int & 3`).decorate()
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
				const operation: SemanticNodeType = unionTypeFromString(`4.2! | int & int`).decorate()
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
				const operation: SemanticNodeType = unionTypeFromString(`4.2! & (int | int)`).decorate()
				assert.ok(operation instanceof SemanticNodeTypeOperationBinary)
				const left:  SemanticNodeType = operation.children[0]
				const right: SemanticNodeType = operation.children[1]
				assert.deepStrictEqual(
					[left.source, operation.operator, right.source],
					[`4.2 !`,     Operator.AND,       `int | int`],
				)
			})
		})

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
				].map((src) =>
					constantFromStatementExpression(
						statementExpressionFromSource(src)
					).value
				), [
					SolidNull.NULL,
					SolidBoolean.FALSE,
					SolidBoolean.TRUE,
					new Int16(42n),
				])
			})
		})

		Dev.supports('literalTemplate') && context('ExpressionUnit ::= StringTemplate', () => {
			function stringTemplateSemanticNode(src: string): string {
				return ((new Scanner(src, CONFIG_DEFAULT).lexer.screener.parser
					.parse()
					.decorate()
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
				const operation: SemanticNodeOperation = operationFromStatementExpression(
					statementExpressionFromSource(`(2 + -3);`)
				)
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
				const operation: SemanticNodeOperation = operationFromStatementExpression(
					statementExpressionFromSource(`(-(42) ^ +(2 * 420));`)
				)
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
					const operation: SemanticNodeOperation = operationFromStatementExpression(
						statementExpressionFromSource(src)
					)
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
					const operation: SemanticNodeOperation = operationFromStatementExpression(
						statementExpressionFromSource(src)
					)
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
				const operation: SemanticNodeOperation = operationFromStatementExpression(
					statementExpressionFromSource(`2 - 3;`)
				)
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
				const operation: SemanticNodeOperation = operationFromStatementExpression(
					statementExpressionFromSource(`2 !< 3;`)
				)
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
				const operation: SemanticNodeOperation = operationFromStatementExpression(
					statementExpressionFromSource(`2 !> 3;`)
				)
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
				const operation: SemanticNodeOperation = operationFromStatementExpression(
					statementExpressionFromSource(`2 isnt 3;`)
				)
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
				const operation: SemanticNodeOperation = operationFromStatementExpression(
					statementExpressionFromSource(`2 != 3;`)
				)
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
				const operation: SemanticNodeOperation = operationFromStatementExpression(
					statementExpressionFromSource(`2 !& 3;`)
				)
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
				const operation: SemanticNodeOperation = operationFromStatementExpression(
					statementExpressionFromSource(`2 !| 3;`)
				)
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
				const operation: SemanticNodeOperation = operationFromStatementExpression(
					statementExpressionFromSource(`if true then 2 else 3;`)
				)
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

		Dev.supports('variables') && context.skip('DeclarationVariable, StatementAssignment', () => {
			it('makes SemanticNodeDeclaration and SemanticNodeAssignment nodes.', () => {
				assert.strictEqual(new Scanner(Util.dedent(`
					let unfixed the_answer = 42;
					let \`the £ answer\` = the_answer * 10;
					the_answer = the_answer - 40;
				`), CONFIG_DEFAULT).lexer.screener.parser.parse().decorate().serialize(), `
					<Goal source="␂ let unfixed the_answer = 42 ; let \`the &#xa3; answer\` = the_answer * 10 ; the_answer = the_answer - 40 ; ␃">
						<Declaration line="1" col="1" source="let unfixed the_answer = 42 ;" type="variable" unfixed="true">
							<Assignee line="1" col="13" source="the_answer">
								<Identifier line="1" col="13" source="the_answer" id="256"/>
							</Assignee>
							<Assigned line="1" col="26" source="42">
								<Constant line="1" col="26" source="42" value="42"/>
							</Assigned>
						</Declaration>
						<Declaration line="2" col="1" source="let \`the &#xa3; answer\` = the_answer * 10 ;" type="variable" unfixed="false">
							<Assignee line="2" col="5" source="\`the &#xa3; answer\`">
								<Identifier line="2" col="5" source="\`the &#xa3; answer\`" id="257"/>
							</Assignee>
							<Assigned line="2" col="22" source="the_answer * 10">
								<Operation line="2" col="22" source="the_answer * 10" operator="5">
									<Identifier line="2" col="22" source="the_answer" id="256"/>
									<Constant line="2" col="35" source="10" value="10"/>
								</Operation>
							</Assigned>
						</Declaration>
						<Assignment line="3" col="1" source="the_answer = the_answer - 40 ;">
							<Assignee line="3" col="1" source="the_answer">
								<Identifier line="3" col="1" source="the_answer" id="256"/>
							</Assignee>
							<Assigned line="3" col="14" source="the_answer - 40">
								<Operation line="3" col="14" source="the_answer - 40" operator="7">
									<Identifier line="3" col="14" source="the_answer" id="256"/>
									<Operation line="3" col="27" source="40" operator="3">
										<Constant line="3" col="27" source="40" value="40"/>
									</Operation>
								</Operation>
							</Assigned>
						</Assignment>
					</Goal>
				`.replace(/\n\t*/g, ''))
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
				const goal: SemanticNodeGoal = new Scanner(`42; 420;`, CONFIG_DEFAULT).lexer.screener.parser.parse().decorate()
				assert_arrayLength(goal.children, 2, 'goal should have 2 children')
				assert.deepStrictEqual(goal.children.map((stat) => {
					assert.ok(stat instanceof SemanticNodeStatementExpression)
					return stat.source
				}), ['42 ;', '420 ;'])
			})
		})
	})
})

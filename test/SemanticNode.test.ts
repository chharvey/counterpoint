import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../src/SolidConfig'
import Dev from '../src/class/Dev.class'
import Parser from '../src/class/Parser.class'
import CodeGenerator from '../src/class/CodeGenerator.class'
import {Punctuator} from '../src/class/Token.class'
import type {
	ParseNodeExpression,
	ParseNodeStatement,
	ParseNodeGoal__0__List,
} from '../src/class/ParseNode.class'
import {
	SolidLanguageTypeDraft,
	SemanticNodeExpression,
	SemanticNodeConstant,
	SemanticNodeIdentifier,
	SemanticNodeTemplate,
	SemanticNodeOperation,
	SemanticNodeStatementExpression,
} from '../src/class/SemanticNode.class'
import SolidLanguageValue, {
	SolidNull,
	SolidBoolean,
} from '../src/vm/SolidLanguageValue.class'
import {
	InstructionNone,
	InstructionConst,
	InstructionBinop,
	InstructionStatement,
	InstructionModule,
} from '../src/vm/Instruction.class'



describe('SemanticNode', () => {
	describe('.constructor', () => {
		context('SemanticNodeExpression', () => {
			it('rethrows `this.type()`.', () => {
				[
					`null;`,
					`42;`,
					`21 + 21;`,
				].forEach((src) => {
					(new Parser(src, CONFIG_DEFAULT).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeExpression
				})
				assert.throws(() => {
					(new Parser(`null + 5;`, CONFIG_DEFAULT).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeExpression
				}, /Invalid operation./)
			})
		})

		context('SemanticNodeStatementExpression', () => {
			it('rethrows the type of the expression.', () => {
				[
					`null;`,
					`42;`,
					`21 + 21;`,
				].forEach((src) => {
					new Parser(src, CONFIG_DEFAULT).parse().decorate()
						.children[0] as SemanticNodeStatementExpression
				})
				assert.throws(() => {
					new Parser(`null + 5;`, CONFIG_DEFAULT).parse().decorate()
						.children[0] as SemanticNodeStatementExpression
				}, /Invalid operation./)
			})
		})

		context('SemanticNodeGoal', () => {
			it('rethrows the type of each statement.', () => {
				[
					`null;`,
					`42;`,
					`21 + 21;`,
				].forEach((src) => {
					new Parser(src, CONFIG_DEFAULT).parse().decorate()
				})
				assert.throws(() => {
					new Parser(`null + 5;`, CONFIG_DEFAULT).parse().decorate()
				}, TypeError)
			})
		})
	})


	describe('#build', () => {
		context('SemanticNodeGoal ::= SOT EOT', () => {
			it('returns InstructionNone.', () => {
				const src: [string, SolidConfig] = [``, CONFIG_DEFAULT]
				const instr: InstructionNone | InstructionModule = new Parser(...src).parse().decorate()
					.build(new CodeGenerator(...src))
				assert.ok(instr instanceof InstructionNone)
			})
		})

		context('SemanticNodeStatement ::= ";"', () => {
			it('returns InstructionNone.', () => {
				const src: [string, SolidConfig] = [`;`, CONFIG_DEFAULT]
				const instr: InstructionNone | InstructionStatement = (new Parser(...src).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.build(new CodeGenerator(...src))
				assert.ok(instr instanceof InstructionNone)
			})
		})

		context('SemanticNodeConstant', () => {
			it('returns InstructionConst.', () => {
				assert.deepStrictEqual([
					'null;',
					'false;',
					'true;',
					'42;',
					'+42;',
					'-42;',
				].map((src) => [src, CONFIG_DEFAULT] as [string, SolidConfig]).map((srcs) =>
					((new Parser(...srcs).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeConstant)
						.build(new CodeGenerator(...srcs))
				), [
					0,
					0,
					1,
					42,
					42,
					-42,
				].map((v) => new InstructionConst(v)))
			})
		})

		context('SemanticNodeOperation', () => {
			specify('ExpressionAdditive ::= ExpressionAdditive "+" ExpressionMultiplicative', () => {
				const srcs: [string, SolidConfig] = [`42 + 420;`, CONFIG_DEFAULT]
				const expr: SemanticNodeOperation = ((new Parser(...srcs).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation)
				assert.deepStrictEqual(expr.assess().build(new CodeGenerator(...srcs)), new InstructionConst(
					42 + 420,
				))
				assert.deepStrictEqual(expr.build(new CodeGenerator(...srcs)), new InstructionBinop(
					Punctuator.ADD,
					new InstructionConst(42),
					new InstructionConst(420),
				))
			})
			specify('ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative', () => {
				const srcs: [string, SolidConfig] = [`42 - 420;`, CONFIG_DEFAULT]
				const expr: SemanticNodeOperation = ((new Parser(...srcs).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation)
				assert.deepStrictEqual(expr.assess().build(new CodeGenerator(...srcs)), new InstructionConst(
					42 + -420,
				))
				assert.deepStrictEqual(expr.build(new CodeGenerator(...srcs)), new InstructionBinop(
					Punctuator.ADD,
					new InstructionConst(42),
					new InstructionConst(-420),
				))
			})
			specify('ExpressionMultiplicative ::= ExpressionMultiplicative "/" ExpressionExponential', () => {
				;[
					' 126 /  3;',
					'-126 /  3;',
					' 126 / -3;',
					'-126 / -3;',
					' 200 /  3;',
					' 200 / -3;',
					'-200 /  3;',
					'-200 / -3;',
				].map((src) => [src, CONFIG_DEFAULT] as [string, SolidConfig]).forEach((srcs, i) => {
					const expr: SemanticNodeOperation = ((new Parser(...srcs).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation)
					assert.deepStrictEqual(expr.assess().build(new CodeGenerator(...srcs)), new InstructionConst([
						Math.trunc( 126 /  3),
						Math.trunc(-126 /  3),
						Math.trunc( 126 / -3),
						Math.trunc(-126 / -3),
						Math.trunc( 200 /  3),
						Math.trunc( 200 / -3),
						Math.trunc(-200 /  3),
						Math.trunc(-200 / -3),
					][i]))
					assert.deepStrictEqual(expr.build(new CodeGenerator(...srcs)), new InstructionBinop(
						Punctuator.DIV,
						new InstructionConst([
							 126,
							-126,
							 126,
							-126,
							 200,
							 200,
							-200,
							-200,
						][i]),
						new InstructionConst([
							 3,
							 3,
							-3,
							-3,
							 3,
							-3,
							 3,
							-3,
						][i]),
					))
				})
			})
			specify('compound expression.', () => {
				const srcs: [string, SolidConfig] = [`42 ^ 2 * 420;`, CONFIG_DEFAULT]
				const expr: SemanticNodeOperation = ((new Parser(...srcs).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation)
				assert.deepStrictEqual(expr.assess().build(new CodeGenerator(...srcs)), new InstructionConst(
					(42 ** 2 * 420) % (2 ** 16),
				))
				assert.deepStrictEqual(expr.build(new CodeGenerator(...srcs)), new InstructionBinop(
					Punctuator.MUL,
					new InstructionConst(42 ** 2),
					new InstructionConst(420),
				))
			})
			specify('overflow.', () => {
				;[
					`2 ^ 15 + 2 ^ 14;`,
					`-(2 ^ 14) - 2 ^ 15;`,
				].map((src) => [src, CONFIG_DEFAULT] as [string, SolidConfig]).forEach((srcs, i) => {
					const expr: SemanticNodeOperation = ((new Parser(...srcs).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation)
					assert.deepStrictEqual(expr.assess().build(new CodeGenerator(...srcs)), new InstructionConst([
						-(2 ** 14),
						2 ** 14,
					][i]))
					assert.deepStrictEqual(expr.build(new CodeGenerator(...srcs)), new InstructionBinop(
						Punctuator.ADD,
						new InstructionConst([
							-(2 ** 15), // negative becuase of overflow
							-(2 ** 14),
						][i]),
						new InstructionConst([
							2 ** 14,
							-(2 ** 15),
						][i]),
					))
				})
			})
			specify('compound expression with grouping.', () => {
				const srcs: [string, SolidConfig] = [`-(5) ^ +(2 * 3);`, CONFIG_DEFAULT]
				const expr: SemanticNodeOperation = ((new Parser(...srcs).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation)
				assert.deepStrictEqual(expr.assess().build(new CodeGenerator(...srcs)), new InstructionConst(
					(-5) ** (2 * 3),
				))
				assert.deepStrictEqual(expr.build(new CodeGenerator(...srcs)), new InstructionBinop(
					Punctuator.EXP,
					new InstructionConst(-5),
					new InstructionConst(2 * 3),
				))
			})
			specify('multiple statements.', () => {
				const srcs: [string, SolidConfig] = [`42; 420;`, CONFIG_DEFAULT]
				const generator: CodeGenerator = new CodeGenerator(...srcs)
				new Parser(...srcs).parse().decorate().children.forEach((stmt, i) => {
					assert.ok(stmt instanceof SemanticNodeStatementExpression)
					assert.deepStrictEqual(stmt.build(generator), new InstructionStatement(BigInt(i), new InstructionConst([
						42,
						420,
					][i])))
				})
			})
		})
	})


	context('SemanticNodeExpression', () => {
		describe('#type', () => {
			it('returns `Null` for SemanticNodeConstant with null value.', () => {
				assert.strictEqual(((new Parser(`null;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeConstant).type(), SolidNull)
			})
			it('returns `Boolean` for SemanticNodeConstant with bool value.', () => {
				[
					`false;`,
					`true;`,
				].forEach((src) => {
					assert.strictEqual(((new Parser(src, CONFIG_DEFAULT).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeConstant).type(), SolidBoolean)
				})
			})
			it('returns `Integer` for SemanticNodeConstant with number value.', () => {
				assert.strictEqual(((new Parser(`42;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeConstant).type(), SolidLanguageTypeDraft.NUMBER)
			})
			Dev.supports('variables') && it('throws for identifiers.', () => {
				assert.throws(() => ((new Parser(`x;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeIdentifier).type(), /Not yet supported./)
			})
			it('returns `String` for SemanticNodeConstant with string value.', () => {
				;[
					...(Dev.supports('literalString') ? [
						(new Parser(`'42';`, CONFIG_DEFAULT).parse().decorate()
							.children[0] as SemanticNodeStatementExpression)
							.children[0] as SemanticNodeConstant,
					] : []),
					...(Dev.supports('literalTemplate') ? [
						(new Parser(`'''42''';`, CONFIG_DEFAULT).parse().decorate()
							.children[0] as SemanticNodeStatementExpression)
							.children[0] as SemanticNodeTemplate,
						(new Parser(`'''the answer is {{ 7 * 3 * 2 }} but what is the question?''';`, CONFIG_DEFAULT).parse().decorate()
							.children[0] as SemanticNodeStatementExpression)
							.children[0] as SemanticNodeTemplate,
					] : []),
				].forEach((node) => {
					assert.strictEqual(node.type(), SolidLanguageTypeDraft.STRING)
				})
			})
			it('returns `Integer` or any operation of numbers.', () => {
				assert.strictEqual(((new Parser(`7 * 3 * 2;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation).type(), SolidLanguageTypeDraft.NUMBER)
			})
			it('throws for operation of non-numbers.', () => {
				[
					`null + 5;`,
					`5 * null;`,
					`false - 2;`,
					`2 / true;`,
					`null ^ false;`,
					...(Dev.supports('literalString') ? [`'hello' + 5;`] : []),
				].forEach((src) => {
					assert.throws(() => ((new Parser(src, CONFIG_DEFAULT).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation).type(), /Invalid operation./)
				})
			})
		})

		describe('#assess', () => {
			it('computes the value of constant null or boolean expression.', () => {
				assert.deepStrictEqual([
					'null;',
					'false;',
					'true;',
				].map((src) => (((new Parser(src, CONFIG_DEFAULT).parse()
					.children[1] as ParseNodeGoal__0__List)
					.children[0] as ParseNodeStatement)
					.children[0] as ParseNodeExpression
				).decorate().assess().value), [
					SolidNull.NULL,
					SolidBoolean.FALSE,
					SolidBoolean.TRUE,
				])
			})
			it('computes the value of a constant numeric expression.', () => {
				const values: (number | SolidLanguageValue | SemanticNodeExpression)[] = [
					'42 + 420;',
					'42 - 420;',
					'126 / 3;',
					'-126 / 3;',
					'126 / -3;',
					'-126 / -3;',
					'200 / 3;',
					'200 / -3;',
					'-200 / 3;',
					'-200 / -3;',
					'42 ^ 2 * 420;',
					'2 ^ 15 + 2 ^ 14;',
					'-(2 ^ 14) - 2 ^ 15;',
					'-(5) ^ +(2 * 3);',
				].map((src) => (((new Parser(src, CONFIG_DEFAULT).parse()
					.children[1] as ParseNodeGoal__0__List)
					.children[0] as ParseNodeStatement)
					.children[0] as ParseNodeExpression
				).decorate().assess().value)
				values.forEach((value) => {
					assert.strictEqual(typeof value, 'number')
				})
				assert.deepStrictEqual(values, [
					42 + 420,
					42 + -420,
					126 / 3,
					-126 / 3,
					126 / -3,
					-126 / -3,
					Math.trunc(200 / 3),
					Math.trunc(200 / -3),
					Math.trunc(-200 / 3),
					Math.trunc(-200 / -3),
					(42 ** 2 * 420) % (2 ** 16),
					-(2 ** 14),
					2 ** 14,
					(-(5)) ** +(2 * 3),
				])
			})
		})
	})
})

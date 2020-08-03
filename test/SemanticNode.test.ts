import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../src/SolidConfig'
import Dev from '../src/class/Dev.class'
import Parser from '../src/class/Parser.class'
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
import {
	CompletionStructureAssessment,
} from '../src/spec/CompletionStructure.class'
import Builder from '../src/vm/Builder.class'
import {
	SolidNull,
	SolidBoolean,
	Float64,
} from '../src/vm/SolidLanguageValue.class'
import Int16 from '../src/vm/Int16.class'
import {
	InstructionNone,
	InstructionConstInt,
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
					.build(new Builder(...src))
				assert.ok(instr instanceof InstructionNone)
			})
		})

		context('SemanticNodeStatement ::= ";"', () => {
			it('returns InstructionNone.', () => {
				const src: [string, SolidConfig] = [`;`, CONFIG_DEFAULT]
				const instr: InstructionNone | InstructionStatement = (new Parser(...src).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.build(new Builder(...src))
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
						.build(new Builder(...srcs))
				), [
					0n,
					0n,
					1n,
					42n,
					42n,
					-42n,
				].map((v) => new InstructionConstInt(v)))
			})
		})

		context('SemanticNodeOperation', () => {
			specify('ExpressionAdditive ::= ExpressionAdditive "+" ExpressionMultiplicative', () => {
				const srcs: [string, SolidConfig] = [`42 + 420;`, CONFIG_DEFAULT]
				assert.deepStrictEqual((
					(new Parser(...srcs).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation
				).build(new Builder(...srcs)), new InstructionBinop(
					Punctuator.ADD,
					new InstructionConstInt(42n),
					new InstructionConstInt(420n),
				))
			})
			specify('ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative', () => {
				const srcs: [string, SolidConfig] = [`42 - 420;`, CONFIG_DEFAULT]
				assert.deepStrictEqual((
					(new Parser(...srcs).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation
				).build(new Builder(...srcs)), new InstructionBinop(
					Punctuator.ADD,
					new InstructionConstInt(42n),
					new InstructionConstInt(-420n),
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
					assert.deepStrictEqual((
						(new Parser(...srcs).parse().decorate()
							.children[0] as SemanticNodeStatementExpression)
							.children[0] as SemanticNodeOperation
					).build(new Builder(...srcs)), new InstructionBinop(
						Punctuator.DIV,
						new InstructionConstInt([
							 126n,
							-126n,
							 126n,
							-126n,
							 200n,
							 200n,
							-200n,
							-200n,
						][i]),
						new InstructionConstInt([
							 3n,
							 3n,
							-3n,
							-3n,
							 3n,
							-3n,
							 3n,
							-3n,
						][i]),
					))
				})
			})
			specify('compound expression.', () => {
				const srcs: [string, SolidConfig] = [`42 ^ 2 * 420;`, CONFIG_DEFAULT]
				assert.deepStrictEqual((
					(new Parser(...srcs).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation
				).build(new Builder(...srcs)), new InstructionBinop(
					Punctuator.MUL,
					new InstructionConstInt(42n ** 2n),
					new InstructionConstInt(420n),
				))
			})
			specify('overflow.', () => {
				;[
					`2 ^ 15 + 2 ^ 14;`,
					`-(2 ^ 14) - 2 ^ 15;`,
				].map((src) => [src, CONFIG_DEFAULT] as [string, SolidConfig]).forEach((srcs, i) => {
					assert.deepStrictEqual((
						(new Parser(...srcs).parse().decorate()
							.children[0] as SemanticNodeStatementExpression)
							.children[0] as SemanticNodeOperation
					).build(new Builder(...srcs)), new InstructionBinop(
						Punctuator.ADD,
						new InstructionConstInt([
							-(2n ** 15n), // negative becuase of overflow
							-(2n ** 14n),
						][i]),
						new InstructionConstInt([
							2n ** 14n,
							-(2n ** 15n),
						][i]),
					))
				})
			})
			specify('compound expression with grouping.', () => {
				const srcs: [string, SolidConfig] = [`-(5) ^ +(2 * 3);`, CONFIG_DEFAULT]
				assert.deepStrictEqual((
					(new Parser(...srcs).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation
				).build(new Builder(...srcs)), new InstructionBinop(
					Punctuator.EXP,
					new InstructionConstInt(-5n),
					new InstructionConstInt(2n * 3n),
				))
			})
			specify('multiple statements.', () => {
				const srcs: [string, SolidConfig] = [`42; 420;`, CONFIG_DEFAULT]
				const generator: Builder = new Builder(...srcs)
				new Parser(...srcs).parse().decorate().children.forEach((stmt, i) => {
					assert.ok(stmt instanceof SemanticNodeStatementExpression)
					assert.deepStrictEqual(stmt.build(generator), new InstructionStatement(BigInt(i), new InstructionConstInt([
						42n,
						420n,
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
			it('returns `Integer` for SemanticNodeConstant with integer value.', () => {
				assert.strictEqual(((new Parser(`42;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeConstant).type(), Int16)
			})
			it('returns `Float` for SemanticNodeConstant with float value.', () => {
				assert.strictEqual(((new Parser(`4.2e+1;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeConstant).type(), Float64)
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
					.children[0] as SemanticNodeOperation).type(), Int16)
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
				].map((src) => {
					const assess: CompletionStructureAssessment | null = (((new Parser(src, CONFIG_DEFAULT).parse()
						.children[1] as ParseNodeGoal__0__List)
						.children[0] as ParseNodeStatement)
						.children[0] as ParseNodeExpression
					).decorate().assess()
					assert.ok(assess)
					return assess.value
				}), [
					SolidNull.NULL,
					SolidBoolean.FALSE,
					SolidBoolean.TRUE,
				])
			})
			it('computes the value of a constant integer expression.', () => {
				assert.deepStrictEqual([
					'42 + 420;',
					'42 - 420;',
					' 126 /  3;',
					'-126 /  3;',
					' 126 / -3;',
					'-126 / -3;',
					' 200 /  3;',
					' 200 / -3;',
					'-200 /  3;',
					'-200 / -3;',
					'42 ^ 2 * 420;',
					'2 ^ 15 + 2 ^ 14;',
					'-(2 ^ 14) - 2 ^ 15;',
					'-(5) ^ +(2 * 3);',
				].map((src) => {
					const assess: CompletionStructureAssessment | null = (((new Parser(src, CONFIG_DEFAULT).parse()
						.children[1] as ParseNodeGoal__0__List)
						.children[0] as ParseNodeStatement)
						.children[0] as ParseNodeExpression
					).decorate().assess()
					assert.ok(assess)
					assert.ok(assess.value instanceof Int16)
					return assess
				}), [
					42 + 420,
					42 + -420,
					Math.trunc( 126 /  3),
					Math.trunc(-126 /  3),
					Math.trunc( 126 / -3),
					Math.trunc(-126 / -3),
					Math.trunc( 200 /  3),
					Math.trunc( 200 / -3),
					Math.trunc(-200 /  3),
					Math.trunc(-200 / -3),
					(42 ** 2 * 420) % (2 ** 16),
					-(2 ** 14),
					2 ** 14,
					(-(5)) ** +(2 * 3),
				].map((v) => new CompletionStructureAssessment(new Int16(BigInt(v)))))
			})
			it('computes the value of a constant float expression.', () => {
				assert.deepStrictEqual(`
					55.  -55.  033.  -033.  2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.  -0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => {
					const assess: CompletionStructureAssessment | null = (((new Parser(`${ src };`, CONFIG_DEFAULT).parse()
						.children[1] as ParseNodeGoal__0__List)
						.children[0] as ParseNodeStatement)
						.children[0] as ParseNodeExpression
					).decorate().assess()
					assert.ok(assess)
					assert.ok(assess.value instanceof Float64)
					return assess
				}), [
						55, -55, 33, -33, 2.007, -2.007,
						91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
						-0, -0, 6.8, 6.8, 0, -0,
				].map((v) => new CompletionStructureAssessment(new Float64(v))))
			})
		})
	})
})

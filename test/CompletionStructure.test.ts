import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../src/SolidConfig'
import Parser from '../src/class/Parser.class'
import type {
	SemanticNodeOperation,
	SemanticNodeStatementExpression,
} from '../src/class/SemanticNode.class'
import {
	CompletionStructureAssessment,
} from '../src/spec/CompletionStructure.class'
import {Float64} from '../src/vm/SolidLanguageValue.class'
import {
	InstructionConstInt,
	InstructionConstFloat,
} from '../src/vm/Instruction.class'



describe('CompletionStructureAssessment', () => {
	describe('#build', () => {
		specify('CompletionStructureAssessment[value: Float]', () => {
			const values: number[] = [
				55, -55, 33, -33, 2.007, -2.007,
				91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
				-0, -0, 6.8, 6.8, 0, -0,
			]
			assert.deepStrictEqual(
				values.map((x) => new CompletionStructureAssessment(new Float64(x)).build()),
				values.map((x) => new InstructionConstFloat(x)),
			)
		})
		specify('ExpressionAdditive ::= ExpressionAdditive "+" ExpressionMultiplicative', () => {
			const assessment: CompletionStructureAssessment | null = ((new Parser(`42 + 420;`, CONFIG_DEFAULT).parse().decorate()
				.children[0] as SemanticNodeStatementExpression)
				.children[0] as SemanticNodeOperation)
				.assess()
			assert.ok(assessment)
			assert.deepStrictEqual(assessment.build(), new InstructionConstInt(
				42n + 420n,
			))
		})
		specify('ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative', () => {
			const assessment: CompletionStructureAssessment | null = ((new Parser(`42 - 420;`, CONFIG_DEFAULT).parse().decorate()
				.children[0] as SemanticNodeStatementExpression)
				.children[0] as SemanticNodeOperation)
				.assess()
			assert.ok(assessment)
			assert.deepStrictEqual(assessment.build(), new InstructionConstInt(
				42n + -420n,
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
				const assessment: CompletionStructureAssessment | null = ((new Parser(...srcs).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation)
					.assess()
				assert.ok(assessment)
				assert.deepStrictEqual(assessment.build(), new InstructionConstInt([
					 126 /  3,
					-126 /  3,
					 126 / -3,
					-126 / -3,
					 200 /  3,
					 200 / -3,
					-200 /  3,
					-200 / -3,
				].map((x) => BigInt(Math.trunc(x)))[i]))
			})
		})
		specify('compound expression.', () => {
			const assessment: CompletionStructureAssessment | null = ((new Parser(`42 ^ 2 * 420;`, CONFIG_DEFAULT).parse().decorate()
				.children[0] as SemanticNodeStatementExpression)
				.children[0] as SemanticNodeOperation)
				.assess()
			assert.ok(assessment)
			assert.deepStrictEqual(assessment.build(), new InstructionConstInt(
				(42n ** 2n * 420n) % (2n ** 16n),
			))
		})
		specify('overflow.', () => {
			;[
				`2 ^ 15 + 2 ^ 14;`,
				`-(2 ^ 14) - 2 ^ 15;`,
			].map((src) => [src, CONFIG_DEFAULT] as [string, SolidConfig]).forEach((srcs, i) => {
				const assessment: CompletionStructureAssessment | null = ((new Parser(...srcs).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation)
					.assess()
				assert.ok(assessment)
				assert.deepStrictEqual(assessment.build(), new InstructionConstInt([
					-(2n ** 14n),
					2n ** 14n,
				][i]))
			})
		})
		specify('compound expression with grouping.', () => {
			const assessment: CompletionStructureAssessment | null = ((new Parser(`-(5) ^ +(2 * 3);`, CONFIG_DEFAULT).parse().decorate()
				.children[0] as SemanticNodeStatementExpression)
				.children[0] as SemanticNodeOperation)
				.assess()
			assert.ok(assessment)
			assert.deepStrictEqual(assessment.build(), new InstructionConstInt(
				(-5n) ** (2n * 3n),
			))
		})
	})
})

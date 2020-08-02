import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../src/SolidConfig'
import Parser from '../src/class/Parser.class'
import type {
	SemanticNodeOperation,
	SemanticNodeStatementExpression,
} from '../src/class/SemanticNode.class'
import type {
	CompletionStructureAssessment,
} from '../src/spec/CompletionStructure.class'
import {
	InstructionConst,
} from '../src/vm/Instruction.class'



describe('CompletionStructureAssessment', () => {
	describe('#build', () => {
		specify('ExpressionAdditive ::= ExpressionAdditive "+" ExpressionMultiplicative', () => {
			const assessment: CompletionStructureAssessment | null = ((new Parser(`42 + 420;`, CONFIG_DEFAULT).parse().decorate()
				.children[0] as SemanticNodeStatementExpression)
				.children[0] as SemanticNodeOperation)
				.assess()
			assert.ok(assessment)
			assert.deepStrictEqual(assessment.build(), new InstructionConst(
				42n + 420n,
			))
		})
		specify('ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative', () => {
			const assessment: CompletionStructureAssessment | null = ((new Parser(`42 - 420;`, CONFIG_DEFAULT).parse().decorate()
				.children[0] as SemanticNodeStatementExpression)
				.children[0] as SemanticNodeOperation)
				.assess()
			assert.ok(assessment)
			assert.deepStrictEqual(assessment.build(), new InstructionConst(
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
				assert.deepStrictEqual(assessment.build(), new InstructionConst([
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
			assert.deepStrictEqual(assessment.build(), new InstructionConst(
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
				assert.deepStrictEqual(assessment.build(), new InstructionConst([
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
			assert.deepStrictEqual(assessment.build(), new InstructionConst(
				(-5n) ** (2n * 3n),
			))
		})
	})
})

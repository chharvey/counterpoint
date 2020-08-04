import * as assert from 'assert'

import {
	CompletionStructureAssessment,
} from '../src/spec/CompletionStructure.class'
import Int16 from '../src/vm/Int16.class'
import Float64 from '../src/vm/Float64.class'
import {
	InstructionConstInt,
	InstructionConstFloat,
} from '../src/vm/Instruction.class'



describe('CompletionStructureAssessment', () => {
	describe('#build', () => {
		specify('CompletionStructureAssessment[value: Integer]', () => {
			const values: bigint[] = [
				42n + -420n,
				...[
					 126 /  3,
					-126 /  3,
					 126 / -3,
					-126 / -3,
					 200 /  3,
					 200 / -3,
					-200 /  3,
					-200 / -3,
				].map((x) => BigInt(Math.trunc(x))),
				(42n ** 2n * 420n) % (2n ** 16n),
				(-5n) ** (2n * 3n),
			]
			assert.deepStrictEqual(
				values.map((x) => new CompletionStructureAssessment(new Int16(x)).build()),
				values.map((x) => new InstructionConstInt(x)),
			)
		})
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
	})
})

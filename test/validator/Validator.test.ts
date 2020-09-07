import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../../src/SolidConfig'
import {Parser} from '../../src/parser/'



describe('Validator', () => {
	describe('#validate', () => {
		describe('type-checks the input source.', () => {
			it('does not throw for valid type operations.', () => {
				;[
					`null;`,
					`42;`,
					`21 + 21;`,
				].forEach((src) => {
					new Parser(src, CONFIG_DEFAULT).validator.validate()
				})
			})
			it('throws for invalid type operations.', () => {
				assert.throws(() => new Parser(`null + 5;`,    CONFIG_DEFAULT).validator.validate(), /Invalid operation./, 'SemanticNodeOperationBinaryArithmetic')
				assert.throws(() => new Parser(`7.0 <= null;`, CONFIG_DEFAULT).validator.validate(), /Invalid operation./, 'SemanticNodeOperationBinaryComparative')
			})
			context('with int coercion off.', () => {
				const coercion_off: SolidConfig = {
					...CONFIG_DEFAULT,
					compilerOptions: {
						...CONFIG_DEFAULT.compilerOptions,
						intCoercion: false,
					},
				}
				it('throws if operands have different numeric types.', () => {
					assert.throws(() => new Parser(`7.0 + 3;`,  coercion_off).validator.validate(), /Invalid operation./, 'SemanticNodeOperationBinaryArithmetic')
					assert.throws(() => new Parser(`7.0 <= 3;`, coercion_off).validator.validate(), /Invalid operation./, 'SemanticNodeOperationBinaryComparative')
				})
			})
		})
	})
})

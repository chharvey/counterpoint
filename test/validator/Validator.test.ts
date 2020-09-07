import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../../src/SolidConfig'
import {Screener} from '../../src/lexer/'
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
					new Screener(src, CONFIG_DEFAULT).parser.validator.validate()
				})
			})
			it('throws for invalid type operations.', () => {
				assert.throws(() => new Screener(`null + 5;`,    CONFIG_DEFAULT).parser.validator.validate(), /Invalid operation./, 'SemanticNodeOperationBinaryArithmetic')
				assert.throws(() => new Screener(`7.0 <= null;`, CONFIG_DEFAULT).parser.validator.validate(), /Invalid operation./, 'SemanticNodeOperationBinaryComparative')
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
					assert.throws(() => new Screener(`7.0 + 3;`,  coercion_off).parser.validator.validate(), /Invalid operation./, 'SemanticNodeOperationBinaryArithmetic')
					assert.throws(() => new Screener(`7.0 <= 3;`, coercion_off).parser.validator.validate(), /Invalid operation./, 'SemanticNodeOperationBinaryComparative')
				})
			})
		})
	})
})

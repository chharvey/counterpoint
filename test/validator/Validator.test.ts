import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../../src/SolidConfig'
import {
	TypeError01,
} from '../../src/error/SolidTypeError.class'
import {Scanner} from '../../src/lexer/'



describe('Validator', () => {
	describe('#validate', () => {
		describe('type-checks the input source.', () => {
			it('does not throw for valid type operations.', () => {
				;[
					`null;`,
					`42;`,
					`21 + 21;`,
				].forEach((src) => {
					new Scanner(src, CONFIG_DEFAULT).lexer.screener.parser.validator.validate()
				})
			})
			it('throws for invalid type operations.', () => {
				assert.throws(() => new Scanner(`null + 5;`,    CONFIG_DEFAULT).lexer.screener.parser.validator.validate(), TypeError01, 'SemanticNodeOperationBinaryArithmetic')
				assert.throws(() => new Scanner(`7.0 <= null;`, CONFIG_DEFAULT).lexer.screener.parser.validator.validate(), TypeError01, 'SemanticNodeOperationBinaryComparative')
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
					assert.throws(() => new Scanner(`7.0 + 3;`,  coercion_off).lexer.screener.parser.validator.validate(), TypeError01, 'SemanticNodeOperationBinaryArithmetic')
					assert.throws(() => new Scanner(`7.0 <= 3;`, coercion_off).lexer.screener.parser.validator.validate(), TypeError01, 'SemanticNodeOperationBinaryComparative')
				})
			})
		})
	})
})

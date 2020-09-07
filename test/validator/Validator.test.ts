import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../../src/SolidConfig'
import {Lexer} from '../../src/lexer/'



describe('Validator', () => {
	describe('#validate', () => {
		describe('type-checks the input source.', () => {
			it('does not throw for valid type operations.', () => {
				;[
					`null;`,
					`42;`,
					`21 + 21;`,
				].forEach((src) => {
					new Lexer(src, CONFIG_DEFAULT).screener.parser.validator.validate()
				})
			})
			it('throws for invalid type operations.', () => {
				assert.throws(() => new Lexer(`null + 5;`,    CONFIG_DEFAULT).screener.parser.validator.validate(), /Invalid operation./, 'SemanticNodeOperationBinaryArithmetic')
				assert.throws(() => new Lexer(`7.0 <= null;`, CONFIG_DEFAULT).screener.parser.validator.validate(), /Invalid operation./, 'SemanticNodeOperationBinaryComparative')
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
					assert.throws(() => new Lexer(`7.0 + 3;`,  coercion_off).screener.parser.validator.validate(), /Invalid operation./, 'SemanticNodeOperationBinaryArithmetic')
					assert.throws(() => new Lexer(`7.0 <= 3;`, coercion_off).screener.parser.validator.validate(), /Invalid operation./, 'SemanticNodeOperationBinaryComparative')
				})
			})
		})
	})
})

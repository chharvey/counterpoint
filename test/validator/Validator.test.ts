import * as assert from 'assert'

import {CONFIG_DEFAULT} from '../../src/SolidConfig'
import Validator from '../../src/validator/Validator.class'



describe('Validator', () => {
	describe('#validate', () => {
		describe('type-checks the input source.', () => {
			it('does not throw for valid type operations.', () => {
				;[
					`null;`,
					`42;`,
					`21 + 21;`,
				].forEach((src) => {
					new Validator(src, CONFIG_DEFAULT).validate()
				})
			})
			it('throws for invalid type operations.', () => {
				assert.throws(() => new Validator(`null + 5;`, CONFIG_DEFAULT).validate(), /Invalid operation./)
			})
		})
	})
})

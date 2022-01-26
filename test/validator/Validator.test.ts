import * as assert from 'assert';
import {
	Validator,
} from '../../src/index.js';



describe('Validator', () => {
	describe('#cookTokenIdentifier', () => {
		it('assigns a unique ID starting from 256.', () => {
			const validator = new Validator();
			assert.deepStrictEqual([
				validator.cookTokenIdentifier(`Foo`),
				validator.cookTokenIdentifier(`Bar`),
			], [
				0x100n,
				0x101n,
			]);
		});
	});
})

import * as assert from 'assert';
import {
	PUNCTUATORS,
	Validator,
} from '../../src/index.js';



describe('Validator', () => {
	describe('.cookTokenPunctuator', () => {
		it('assigns values 0n–127n to punctuator tokens.', () => {
			const cooked: bigint[] = PUNCTUATORS.map((p) => Validator.cookTokenPunctuator(p));
			const expected: bigint[] = [...new Array(128)].map((_, i) => BigInt(i)).slice(0, PUNCTUATORS.length);
			assert.deepStrictEqual(cooked, expected);
			cooked.forEach((value) => {
				assert.ok(0n <= value, 'cooked value should be >= 0n.');
				assert.ok(value < 128n, 'cooked value should be < 128n.');
			});
		});
	});


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

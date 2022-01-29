import * as assert from 'assert';
import {
	PUNCTUATORS,
	KEYWORDS,
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


	describe('.cookTokenKeyword', () => {
		it('assigns values 128n–255n to reserved keywords.', () => {
			const cooked: bigint[] = KEYWORDS.map((k) => Validator.cookTokenKeyword(k));
			const expected: bigint[] = [...new Array(128)].map((_, i) => BigInt(i + 128)).slice(0, KEYWORDS.length);
			assert.deepStrictEqual(cooked, expected);
			cooked.forEach((value) => {
				assert.ok(128n <= value, 'cooked value should be >= 128n.');
				assert.ok(value < 256n, 'cooked value should be < 256n.');
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

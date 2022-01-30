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
		[
			`
				this be a word
				_words _can _start _with _underscores
				_and0 _can1 contain2 numb3rs
				a word _can repeat _with the same id
			`,
			`
				\`this\` \`is\` \`a\` \`unicode word\`
				\`any\` \`unicode word\` \`can\` \`contain\` \`any\` \`character\`
				\`except\` \`back-ticks\` \`.\`
			`,
		].forEach((src, i) => {
			const validator = new Validator();
			let cooked: bigint[];
			context([
				'basic identifiers.',
				'unicode identifiers.',
			][i], () => {
				before(() => {
					cooked = src.trim().split(/\s+/).map((word) => validator.cookTokenIdentifier(word));
				});
				it('assigns ids starting from 256n', () => {
					return assert.deepStrictEqual(cooked.slice(0, 4), [0x100n, 0x101n, 0x102n, 0x103n]);
				});
				it('assigns unique ids 256n or greater.', () => {
					return cooked.forEach((value) => {
						assert.ok(value >= 256n);
					});
				});
			});
		});

		it('assigns the same value to identical identifier names.', () => {
			const validator = new Validator();
			const cooked: bigint[] = `
				alpha bravo charlie delta echo
				echo delta charlie bravo alpha
			`.trim().split(/\s+/).map((word) => validator.cookTokenIdentifier(word));
			return assert.deepStrictEqual(
				cooked.slice(0, 5),
				cooked.slice(5).reverse(),
			);
		});
	});
})

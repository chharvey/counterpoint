import * as assert from 'assert';
import {
	PUNCTUATORS,
	KEYWORDS,
	Validator,
} from '../../src/index.js';
import {
	CONFIG_RADICES_SEPARATORS_ON,
} from '../helpers.js';



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

	describe('.cookTokenNumber', () => {
		new Map<string, [string, number[]]>([
			['implicit radix integers', [
				`
					370  037  +9037  -9037  +06  -06
				`,
				[
					370, 37, 9037, -9037, 6, -6,
				],
			]],
			['explicit radix integers', [
				`
					\\b100  \\b001  +\\b1000  -\\b1000  +\\b01  -\\b01
					\\q320  \\q032  +\\q1032  -\\q1032  +\\q03  -\\q03
					\\o370  \\o037  +\\o1037  -\\o1037  +\\o06  -\\o06
					\\d370  \\d037  +\\d9037  -\\d9037  +\\d06  -\\d06
					\\xe70  \\x0e7  +\\x90e7  -\\x90e7  +\\x06  -\\x06
					\\ze70  \\z0e7  +\\z90e7  -\\z90e7  +\\z06  -\\z06
				`,
				[
					    4,  1,       8,      -8, 1, -1,
					   56, 14,      78,     -78, 3, -3,
					  248, 31,     543,    -543, 6, -6,
					  370, 37,    9037,   -9037, 6, -6,
					 3696, 231,  37095,  -37095, 6, -6,
					18396, 511, 420415, -420415, 6, -6,
				],
			]],
			['floats', [
				`
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				`,
				[
					2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					-0.0, 6.8, 6.8, 0.0, -0.0,
				],
			]],
			['implicit radix integers with separators', [
				`
					12_345  +12_345  -12_345  0123_4567  +0123_4567  -0123_4567  012_345_678  +012_345_678  -012_345_678
				`,
				[
					12345, 12345, -12345, 1234567, 1234567, -1234567, 12345678, 12345678, -12345678,
				],
			]],
			['explicit radix integers with separators', [
				`
					\\b1_00  \\b0_01  +\\b1_000  -\\b1_000  +\\b0_1  -\\b0_1
					\\q3_20  \\q0_32  +\\q1_032  -\\q1_032  +\\q0_3  -\\q0_3
					\\o3_70  \\o0_37  +\\o1_037  -\\o1_037  +\\o0_6  -\\o0_6
					\\d3_70  \\d0_37  +\\d9_037  -\\d9_037  +\\d0_6  -\\d0_6
					\\xe_70  \\x0_e7  +\\x9_0e7  -\\x9_0e7  +\\x0_6  -\\x0_6
					\\ze_70  \\z0_e7  +\\z9_0e7  -\\z9_0e7  +\\z0_6  -\\z0_6
				`,
				[
					    4,  1,       8,      -8, 1, -1,
					   56, 14,      78,     -78, 3, -3,
					  248, 31,     543,    -543, 6, -6,
					  370, 37,    9037,   -9037, 6, -6,
					 3696, 231,  37095,  -37095, 6, -6,
					18396, 511, 420415, -420415, 6, -6,
				],
			]],
		]).forEach(([source, values], description) => {
			it(description, () => {
				return assert.deepStrictEqual(
					source.trim().split(/\s+/).map((number) => Validator.cookTokenNumber(number, CONFIG_RADICES_SEPARATORS_ON)[0]),
					values,
				);
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

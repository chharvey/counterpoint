import * as assert from 'assert';

import Util, {EncodedChar} from '../src/class/Util.class';


describe('Util', () => {
	function randomInt(lower: number, upper: number): bigint {
		return BigInt(Math.floor(Math.random() * (upper - lower)) + lower);
	}

	describe('.utf8Encode', () => {
		it('throws if given number is less than 0.', () => {
			assert.throws(() => Util.utf8Encode(-1n), RangeError);
		});
		it('throws if given number is greater than 0x7fff_ffff.', () => {
			assert.throws(() => Util.utf8Encode(0x8000_0000n), RangeError);
		});
		new Map<readonly [bigint, bigint], (n: bigint) => bigint[]>([
			[[0n, 0x80n], (n) => [
				n,
			]],
			[[0x80n, 0x800n], (n) => [
				0xc0n + n / 0x40n,
				0x80n + n % 0x40n,
			]],
			[[0x800n, 0x1_0000n], (n) => [
				0xe0n + n / 0x40n / 0x40n,
				0x80n + n / 0x40n % 0x40n,
				0x80n + n % 0x40n,
			]],
			[[0x1_0000n, 0x1f_ffffn], (n) => [
				0xf0n + n / 0x40n / 0x40n / 0x40n,
				0x80n + n / 0x40n / 0x40n % 0x40n,
				0x80n + n / 0x40n % 0x40n,
				0x80n + n % 0x40n,
			]],
			[[0x20_0000n, 0x3ff_ffffn], (n) => [
				0xf8n + n / 0x40n / 0x40n / 0x40n / 0x40n,
				0x80n + n / 0x40n / 0x40n / 0x40n % 0x40n,
				0x80n + n / 0x40n / 0x40n % 0x40n,
				0x80n + n / 0x40n % 0x40n,
				0x80n + n % 0x40n,
			]],
			[[0x400_0000n, 0x7fff_ffffn], (n) => [
				0xfcn + n / 0x40n / 0x40n / 0x40n / 0x40n / 0x40n,
				0x80n + n / 0x40n / 0x40n / 0x40n / 0x40n % 0x40n,
				0x80n + n / 0x40n / 0x40n / 0x40n % 0x40n,
				0x80n + n / 0x40n / 0x40n % 0x40n,
				0x80n + n / 0x40n % 0x40n,
				0x80n + n % 0x40n,
			]],
		]).forEach((expect, [min, max]) => {
			specify(`U+${ min.toString(16) } — U+${ max.toString(16) }`, () => {
				const codepoints: readonly bigint[] = Array.from(new Array(100), () => randomInt(Number(min), Number(max)));
				assert.deepStrictEqual(
					codepoints.map((n) => Util.utf8Encode(n)),
					codepoints.map((n) => expect(n)),
				);
			});
		});
	});

	describe('.utf8Decode', () => {
		function expected(a: bigint, b: bigint): bigint {
			return a * 0x40n + b - 0x80n;
		}
		it('returns unknown character if first entry is less than 0.', () => {
			assert.strictEqual(Util.utf8Decode([-1n]), Util.REPLACEMENT_CHARACTER);
		});
		it('returns unknown character if first entry is between 0b1000_0000 and 0b1100_0000.', () => {
			assert.strictEqual(Util.utf8Decode([randomInt(0b1000_0000, 0b1100_0000)]), Util.REPLACEMENT_CHARACTER);
		});
		it('returns unknown character if first entry is greater than 0xfe.', () => {
			assert.strictEqual(Util.utf8Decode([0xffn]), Util.REPLACEMENT_CHARACTER);
		});
		[
			(units: readonly bigint[]): bigint =>                                              units[0],
			(units: readonly bigint[]): bigint =>                                     expected(units[0] - 0xc0n, units[1]),
			(units: readonly bigint[]): bigint =>                            expected(expected(units[0] - 0xe0n, units[1]), units[2]),
			(units: readonly bigint[]): bigint =>                   expected(expected(expected(units[0] - 0xf0n, units[1]), units[2]), units[3]),
			(units: readonly bigint[]): bigint =>          expected(expected(expected(expected(units[0] - 0xf8n, units[1]), units[2]), units[3]), units[4]),
			(units: readonly bigint[]): bigint => expected(expected(expected(expected(expected(units[0] - 0xfcn, units[1]), units[2]), units[3]), units[4]), units[5]),
		].forEach((expect, continuations) => {
			const code_unit_tpl: readonly string[] = [
				['0bbb_bbbb'],
				['110b_bbbb', '10bb_bbbb'],
				['1110_bbbb', '10bb_bbbb', '10bb_bbbb'],
				['1111_0bbb', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb'],
				['1111_10bb', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb'],
				['1111_110b', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb'],
			][continuations];
			specify(code_unit_tpl.join(', '), () => {
				const encodings: readonly EncodedChar[] = Array.from(new Array(100), () => code_unit_tpl.map((unit_tpl) => randomInt(
					parseInt(unit_tpl.replace(/_/g, '').replace(/b/g, '0'), 2),
					parseInt(unit_tpl.replace(/_/g, '').replace(/b/g, '1'), 2) + 1,
				)) as readonly bigint[] as EncodedChar);
				assert.deepStrictEqual(
					encodings.map((codeunits) => Util.utf8Decode(codeunits)),
					encodings.map((codeunits) => expect(codeunits)),
				);
			});
		});
	});
});

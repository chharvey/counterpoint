import * as assert from 'assert';

import Util, {
	EncodedChar,
	UTF8DecodeError,
} from '../src/class/Util.class';


describe('Util', () => {
	function randomInt(lower: number, upper: number): bigint {
		return BigInt(Math.floor(Math.random() * (upper - lower)) + lower);
	}
	/**
	 * Return a random number from a string template matching /[0-1b_]{8}/,
	 * where the random number is between the lowest possible value and the highest possible value.
	 */
	function fromTemplate(unit_template: string): bigint {
		return randomInt(
			parseInt(unit_template.replace(/_/g, '').replace(/b/g, '0'), 2),
			parseInt(unit_template.replace(/_/g, '').replace(/b/g, '1'), 2) + 1,
		);
	}

	const code_unit_templates = [
		['0bbb_bbbb'],
		['110b_bbbb', '10bb_bbbb'],
		['1110_bbbb', '10bb_bbbb', '10bb_bbbb'],
		['1111_0bbb', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb'],
		['1111_10bb', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb'],
		['1111_110b', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb'],
	] as const;

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
		it('returns replacement character if first entry is less than 0.', () => {
			assert.strictEqual(Util.utf8Decode([-1n]), Util.REPLACEMENT_CHARACTER);
		});
		it('returns replacement character if first entry is between 0x80 and 0xc0.', () => {
			assert.strictEqual(Util.utf8Decode([fromTemplate('10bb_bbbb')]), Util.REPLACEMENT_CHARACTER);
		});
		it('returns replacement character if first entry is greater than 0xfe.', () => {
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
			const code_unit_tpl: readonly string[] = code_unit_templates[continuations];
			specify(code_unit_tpl.join(', '), () => {
				const encodings: readonly EncodedChar[] = Array.from(new Array(100), () =>
					code_unit_tpl.map((unit_tpl) => fromTemplate(unit_tpl)) as readonly bigint[] as EncodedChar
				);
				assert.deepStrictEqual(
					encodings.map((codeunits) => Util.utf8Decode(codeunits)),
					encodings.map((codeunits) => expect(codeunits)),
				);
			});
		});
		it('throws if a sequence of code units does not conform to the UTF-8 specification.', () => {
			for (let i = 0; i < 10; i++) {
				([
					// 2-byte characters
					['110b_bbbb', '0bbb_bbbb'],
					['110b_bbbb', '11bb_bbbb'],
					// 3-byte characters
					['1110_bbbb', '0bbb_bbbb'],
					['1110_bbbb', '11bb_bbbb'],
					['1110_bbbb', '10bb_bbbb', '0bbb_bbbb'],
					['1110_bbbb', '10bb_bbbb', '11bb_bbbb'],
					// 4-byte characters
					['1111_0bbb', '0bbb_bbbb'],
					['1111_0bbb', '11bb_bbbb'],
					['1111_0bbb', '10bb_bbbb', '0bbb_bbbb'],
					['1111_0bbb', '10bb_bbbb', '11bb_bbbb'],
					['1111_0bbb', '10bb_bbbb', '10bb_bbbb', '0bbb_bbbb'],
					['1111_0bbb', '10bb_bbbb', '10bb_bbbb', '11bb_bbbb'],
					// 5-byte characters
					['1111_10bb', '0bbb_bbbb'],
					['1111_10bb', '11bb_bbbb'],
					['1111_10bb', '10bb_bbbb', '0bbb_bbbb'],
					['1111_10bb', '10bb_bbbb', '11bb_bbbb'],
					['1111_10bb', '10bb_bbbb', '10bb_bbbb', '0bbb_bbbb'],
					['1111_10bb', '10bb_bbbb', '10bb_bbbb', '11bb_bbbb'],
					['1111_10bb', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb', '0bbb_bbbb'],
					['1111_10bb', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb', '11bb_bbbb'],
					// 6-byte characters
					['1111_110b', '0bbb_bbbb'],
					['1111_110b', '11bb_bbbb'],
					['1111_110b', '10bb_bbbb', '0bbb_bbbb'],
					['1111_110b', '10bb_bbbb', '11bb_bbbb'],
					['1111_110b', '10bb_bbbb', '10bb_bbbb', '0bbb_bbbb'],
					['1111_110b', '10bb_bbbb', '10bb_bbbb', '11bb_bbbb'],
					['1111_110b', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb', '0bbb_bbbb'],
					['1111_110b', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb', '11bb_bbbb'],
					['1111_110b', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb', '0bbb_bbbb'],
					['1111_110b', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb', '10bb_bbbb', '11bb_bbbb'],
				]).map((sequence) => sequence.map((tpl) => fromTemplate(tpl))).forEach((sequence) => {
					assert.throws(() => Util.utf8Decode(sequence as readonly bigint[] as EncodedChar), (err) => {
						const invalid: string = sequence.map((n) => `0x${ n.toString(16) }`).join();
						assert.ok(err instanceof UTF8DecodeError, 'thrown error was not an instance of UTF8DecodeError');
						assert.strictEqual(err.message, `Invalid sequence of code points: ${ invalid }`);
						assert.deepStrictEqual(err.index, sequence.length - 1, `testing code points: ${ invalid }`);
						return true;
					});
				});
			};
		});
	});

	describe('.decodeUTF8Stream', () => {
		const src: string = 'A😀B💛C';
		const codepoints: readonly bigint[] = [0x41n, 0x1f600n,                   0x42n, 0x1f49bn,                   0x43n];
		const encoding:   readonly bigint[] = [0x41n, 0xf0n, 0x9fn, 0x98n, 0x80n, 0x42n, 0xf0n, 0x9fn, 0x92n, 0x9bn, 0x43n];
		it('encodes a text example.', () => {
			assert.deepStrictEqual([...src].map((c) => BigInt(c.codePointAt(0))), codepoints);
			assert.deepStrictEqual(codepoints.flatMap((c) => Util.utf8Encode(c)), encoding);
		});
		it('decodes a stream of encodings.', () => {
			assert.deepStrictEqual (Util.decodeUTF8Stream(encoding),                           codepoints);
			assert.strictEqual     (String.fromCodePoint(...codepoints.map((n) => Number(n))), src);
		});
		it('returns replacement character for errors, but continues.', () => {
			assert.strictEqual(String.fromCodePoint(...Util.decodeUTF8Stream(
				[0x41n, 0xf0n, 0x9fn, 0x80n, 0x42n, 0xf0n, 0x92n, 0x9bn, 0x43n]
			).map((n) => Number(n))), 'A�B�C');
		});
	});
});

import * as assert from 'assert';

import Util, {
	CodePoint,
	CodeUnit,
	EncodedChar,
	UTF8DecodeError,
} from '../src/class/Util.class';


describe('Util', () => {
	function randomInt(lower: number, upper: number): number {
		return Math.floor(Math.floor(Math.random() * (upper - lower)) + lower);
	}
	/**
	 * Return a random number from a string template matching /[0-1b_]{8}/,
	 * where the random number is between the lowest possible value and the highest possible value.
	 */
	function fromTemplate(unit_template: string): CodeUnit {
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
		function fldiv(a: number, ...b: number[]): number {
			return (b.length)
				? b.reduce((x, y) => Math.floor(x / y), a)
				: a
			;
		}
		it('throws if given number is less than 0.', () => {
			assert.throws(() => Util.utf8Encode(-1));
		});
		it('throws if given number is greater than 0x7fff_ffff.', () => {
			assert.throws(() => Util.utf8Encode(0x8000_0000), RangeError);
		});
		new Map<readonly [CodePoint, CodePoint], (n: CodePoint) => CodeUnit[]>([
			[[0, 0x80], (n) => [
				n,
			]],
			[[0x80, 0x800], (n) => [
				0xc0 + fldiv(n, 0x40),
				0x80 + n % 0x40,
			]],
			[[0x800, 0x1_0000], (n) => [
				0xe0 + fldiv(n, 0x40, 0x40),
				0x80 + fldiv(n, 0x40) % 0x40,
				0x80 + n % 0x40,
			]],
			[[0x1_0000, 0x1f_ffff], (n) => [
				0xf0 + fldiv(n, 0x40, 0x40, 0x40),
				0x80 + fldiv(n, 0x40, 0x40) % 0x40,
				0x80 + fldiv(n, 0x40) % 0x40,
				0x80 + n % 0x40,
			]],
			[[0x20_0000, 0x3ff_ffff], (n) => [
				0xf8 + fldiv(n, 0x40, 0x40, 0x40, 0x40),
				0x80 + fldiv(n, 0x40, 0x40, 0x40) % 0x40,
				0x80 + fldiv(n, 0x40, 0x40) % 0x40,
				0x80 + fldiv(n, 0x40) % 0x40,
				0x80 + n % 0x40,
			]],
			[[0x400_0000, 0x7fff_ffff], (n) => [
				0xfc + fldiv(n, 0x40, 0x40, 0x40, 0x40, 0x40),
				0x80 + fldiv(n, 0x40, 0x40, 0x40, 0x40) % 0x40,
				0x80 + fldiv(n, 0x40, 0x40, 0x40) % 0x40,
				0x80 + fldiv(n, 0x40, 0x40) % 0x40,
				0x80 + fldiv(n, 0x40) % 0x40,
				0x80 + n % 0x40,
			]],
		]).forEach((expect, [min, max]) => {
			specify(`U+${ min.toString(16) } — U+${ max.toString(16) }`, () => {
				const codepoints: readonly CodePoint[] = Array.from(new Array(100), () => randomInt(min, max));
				assert.deepStrictEqual(
					codepoints.map((n) => Util.utf8Encode(n)),
					codepoints.map((n) => expect(n)),
				);
			});
		});
	});

	describe('.utf8Decode', () => {
		function expected(a: number, b: number): number {
			return a * 0x40 + b - 0x80;
		}
		it('returns replacement character if first entry is less than 0.', () => {
			assert.strictEqual(Util.utf8Decode([-1]), Util.REPLACEMENT_CHARACTER);
		});
		it('returns replacement character if first entry is between 0x80 and 0xc0.', () => {
			assert.strictEqual(Util.utf8Decode([fromTemplate('10bb_bbbb')]), Util.REPLACEMENT_CHARACTER);
		});
		it('returns replacement character if first entry is greater than 0xfe.', () => {
			assert.strictEqual(Util.utf8Decode([0xff]), Util.REPLACEMENT_CHARACTER);
		});
		[
			(units: readonly CodeUnit[]): CodePoint =>                                              units[0],
			(units: readonly CodeUnit[]): CodePoint =>                                     expected(units[0] - 0xc0, units[1]),
			(units: readonly CodeUnit[]): CodePoint =>                            expected(expected(units[0] - 0xe0, units[1]), units[2]),
			(units: readonly CodeUnit[]): CodePoint =>                   expected(expected(expected(units[0] - 0xf0, units[1]), units[2]), units[3]),
			(units: readonly CodeUnit[]): CodePoint =>          expected(expected(expected(expected(units[0] - 0xf8, units[1]), units[2]), units[3]), units[4]),
			(units: readonly CodeUnit[]): CodePoint => expected(expected(expected(expected(expected(units[0] - 0xfc, units[1]), units[2]), units[3]), units[4]), units[5]),
		].forEach((expect, continuations) => {
			const code_unit_tpl: readonly string[] = code_unit_templates[continuations];
			specify(code_unit_tpl.join(', '), () => {
				const encodings: readonly EncodedChar[] = Array.from(new Array(100), () =>
					code_unit_tpl.map((unit_tpl) => fromTemplate(unit_tpl)) as readonly number[] as EncodedChar
				);
				assert.deepStrictEqual(
					encodings.map((codeunits) => Util.utf8Decode(codeunits)),
					encodings.map((codeunits) => expect(codeunits)),
				);
			});
		});
		it('throws if a sequence of code units is not well-formed.', () => {
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
					assert.throws(() => Util.utf8Decode(sequence as readonly number[] as EncodedChar), (err) => {
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
		const codepoints: readonly number[] = [0x41, 0x1f600,                0x42, 0x1f49b,                0x43];
		const encoding:   readonly number[] = [0x41, 0xf0, 0x9f, 0x98, 0x80, 0x42, 0xf0, 0x9f, 0x92, 0x9b, 0x43];
		it('encodes a text example.', () => {
			assert.deepStrictEqual([...src].map((c) => c.codePointAt(0)),         codepoints);
			assert.deepStrictEqual(codepoints.flatMap((c) => Util.utf8Encode(c)), encoding);
		});
		it('decodes a stream of encodings.', () => {
			assert.deepStrictEqual (Util.decodeUTF8Stream(encoding),     codepoints);
			assert.strictEqual     (String.fromCodePoint(...codepoints), src);
		});
		it('returns replacement character for errors, but continues.', () => {
			assert.strictEqual(String.fromCodePoint(...Util.decodeUTF8Stream(
				[0x41, 0xf0, 0x9f, 0x80, 0x42, 0xf0, 0x92, 0x9b, 0x43]
			)), 'A�B�C');
		});
	});
});

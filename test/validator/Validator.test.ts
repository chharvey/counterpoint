import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	KEYWORDS,
	Validator,
} from '../../src/index.ts';



test.suite('Validator', () => {
	test.suite('.cookTokenKeyword', () => {
		test.test('assigns values 0x40n–0x80n to reserved keywords.', () => {
			const cooked:   readonly bigint[] = KEYWORDS.map((k) => Validator.cookTokenKeyword(k));
			const expected: readonly bigint[] = Array.from(new Array<undefined>(0x80 - 0x40), (_, i) => BigInt(i + 0x40)).slice(0, KEYWORDS.length);
			assert.deepStrictEqual(cooked, expected);
			cooked.forEach((value) => {
				assert.ok(0x40n <= value, 'cooked value should be >= 0x40n.');
				assert.ok(value <  0x80n, 'cooked value should be <  0x80n.');
			});
		});
	});


	test.suite('.cookTokenIdentifier', () => {
		type Data = {
			readonly src: string,
			readonly raw: string[],
		};
		test.test('assigns intrinsic ids an index.', () => {
			const intrinsics = [
				'Object',
				'Integer',
				'Natural',
				'Float',
				'String',
				'List',
				'Dict',
				'Set',
				'Map',
			];
			return assert.deepStrictEqual(
				intrinsics.map((s) => Validator.cookTokenIdentifier(s)),
				Array.from(Array(intrinsics.length), (_, i) => 0x80n + BigInt(i)),
			);
		});
		new Map<string, [Data, Data]>([
			['basic identifiers.', [
				{
					src: `
						this be a word
						_words _can _start _with _underscores_
						and can1 contain2 numb3rs and under_scores_
						a word can_ repeat with_ the same id
					`,
					raw: ['this', 'be', 'a', 'word', '_words', '_can', '_start', '_with', '_underscores_', 'and', 'can1', 'contain2', 'numb3rs', 'and', 'under_scores_', 'a', 'word', 'can_', 'repeat', 'with_', 'the', 'same', 'id'],
				},
				{
					src: `
						alpha bravo charlie delta echo
						echo delta charlie bravo alpha
					`,
					raw: ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'echo', 'delta', 'charlie', 'bravo', 'alpha'],
				},
			]],
			['unicode identifiers.', [
				{
					src: `
						'this' 'is' 'a' 'unicode word'
						'unicode words start and end with' 'apostrophes' 'but cannot contain them'
						'ány' 'unicödè wörd' 'cán' 'cöntáin' 'ány' 'cháráctèr'
						'èxcèpt' '‘ápöströphès’' '.'
					`,
					raw: ['\'this\'', '\'is\'', '\'a\'', '\'unicode word\'', '\'unicode words start and end with\'', '\'apostrophes\'', '\'but cannot contain them\'', '\'ány\'', '\'unicödè wörd\'', '\'cán\'', '\'cöntáin\'', '\'ány\'', '\'cháráctèr\'', '\'èxcèpt\'', '\'‘ápöströphès’\'', '\'.\''],
				},
				{
					src: `
						'alpha' 'bravo' 'charlie' 'delta' 'echo'
						'echo' 'delta' 'charlie' 'bravo' 'alpha'
					`,
					raw: ['\'alpha\'', '\'bravo\'', '\'charlie\'', '\'delta\'', '\'echo\'', '\'echo\'', '\'delta\'', '\'charlie\'', '\'bravo\'', '\'alpha\''],
				},
			]],
		]).forEach((datas, cxt) => {
			test.suite(cxt, () => {
				datas.forEach((data, i) => {
					const actual_raw: RegExpMatchArray = data.src.match(/[A-Za-z_][A-Za-z0-9_]*|'[^']*'/g)!;
					let cooked: bigint[] = [];
					test.before(() => {
						assert.deepStrictEqual(actual_raw, data.raw);
						cooked = actual_raw.map((word) => Validator.cookTokenIdentifier(word));
					});
					if (i === 0) {
						test.test('assigns unique ids 0x100n or greater.', () => {
							cooked.forEach((value) => assert.ok(value >= 0x100n));
						});
					} else {
						assert.strictEqual(i, 1);
						test.test('assigns the same value to identical identifier names.', () => {
							assert.deepStrictEqual(
								cooked.slice(0, 5),
								cooked.slice(5).reverse(),
							);
						});
					}
				});
			});
		});
	});


	test.suite('.cookTokenNumber', () => {
		new Map<string, [string, readonly bigint[] | readonly number[]]>([
			/* eslint-disable @stylistic/array-element-newline */
			['implicit radix integers', [
				`
					370  037  +9037  -9037  +06  -06
				`,
				[
					370, 37, 9037, -9037, 6, -6,
				].map((n) => BigInt(n)),
			]],
			['explicit radix integers', [
				`
					\\b100  \\b001  +\\b1000  -\\b1000  +\\b01  -\\b01
					\\q320  \\q032  +\\q1032  -\\q1032  +\\q03  -\\q03
					\\s320  \\s032  +\\s1432  -\\s1532  +\\s03  -\\s03
					\\o370  \\o037  +\\o1037  -\\o1037  +\\o06  -\\o06
					\\d370  \\d037  +\\d9037  -\\d9037  +\\d06  -\\d06
					\\xe70  \\x0e7  +\\x90e7  -\\x90e7  +\\x06  -\\x06
					\\ze70  \\z0e7  +\\z90e7  -\\z90e7  +\\z06  -\\z06
				`,
				/* eslint-disable @stylistic/indent */
				[
					    4,  1,       8,      -8, 1, -1,
					   56, 14,      78,     -78, 3, -3,
					  120, 20,     380,    -416, 3, -3,
					  248, 31,     543,    -543, 6, -6,
					  370, 37,    9037,   -9037, 6, -6,
					 3696, 231,  37095,  -37095, 6, -6,
					18396, 511, 420415, -420415, 6, -6,
				].map((n) => BigInt(n)),
				/* eslint-enable @stylistic/indent */
			]],
			['implicit radix integers with separators', [
				`
					12_345  +12_345  -12_345  0123_4567  +0123_4567  -0123_4567  012_345_678  +012_345_678  -012_345_678
				`,
				[
					12345, 12345, -12345, 1234567, 1234567, -1234567, 12345678, 12345678, -12345678,
				].map((n) => BigInt(n)),
			]],
			['explicit radix integers with separators', [
				`
					\\b1_00  \\b0_01  +\\b1_000  -\\b1_000  +\\b0_1  -\\b0_1
					\\q3_20  \\q0_32  +\\q1_032  -\\q1_032  +\\q0_3  -\\q0_3
					\\s3_20  \\s0_32  +\\s1_432  -\\s1_532  +\\s0_3  -\\s0_3
					\\o3_70  \\o0_37  +\\o1_037  -\\o1_037  +\\o0_6  -\\o0_6
					\\d3_70  \\d0_37  +\\d9_037  -\\d9_037  +\\d0_6  -\\d0_6
					\\xe_70  \\x0_e7  +\\x9_0e7  -\\x9_0e7  +\\x0_6  -\\x0_6
					\\ze_70  \\z0_e7  +\\z9_0e7  -\\z9_0e7  +\\z0_6  -\\z0_6
				`,
				/* eslint-disable @stylistic/indent */
				[
					    4,  1,       8,      -8, 1, -1,
					   56, 14,      78,     -78, 3, -3,
					  120, 20,     380,    -416, 3, -3,
					  248, 31,     543,    -543, 6, -6,
					  370, 37,    9037,   -9037, 6, -6,
					 3696, 231,  37095,  -37095, 6, -6,
					18396, 511, 420415, -420415, 6, -6,
				].map((n) => BigInt(n)),
				/* eslint-enable @stylistic/indent */
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
			/* eslint-enable @stylistic/array-element-newline */
		]).forEach(([source, values], description) => {
			test.test(`numerical value: ${ description }.`, () => {
				assert.deepStrictEqual(
					source.trim().split(/\s+/).map((nsrc) => Validator.cookTokenNumber(nsrc).value),
					values,
				);
			});
		});
		test.test('types.', () => {
			assert.deepStrictEqual(
				`
					370  037  +9037  -9037  +06  -06
					\\b100  \\b001  +\\b1000  -\\b1000  +\\b01  -\\b01
					12_345  +12_345  -12_345  0123_4567  +0123_4567  -0123_4567  012_345_678  +012_345_678  -012_345_678
					\\b1_00  \\b0_01  +\\b1_000  -\\b1_000  +\\b0_1  -\\b0_1
					91.27e4  -91.27e4  +91.27e-4  -91.27e-4
				`.trim().split(/\s+/).map((nsrc) => Validator.cookTokenNumber(nsrc).type),
				`
					int int nat int nat int
					int int nat int nat int
					int nat int int nat int int nat int
					int int nat int nat int
					float float float float
				`.trim().split(/\s+/),
			);
		});
	});


	test.suite('.cookTokenString', () => {
		function decodeCooked(source: string): string {
			return new TextDecoder().decode(new Uint8Array(Validator.cookTokenString(source)));
		}
		test.test('produces the cooked string value.', () => {
			assert.deepStrictEqual([
				'""',
				'"hello"',
				'"0 \\" 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6"',
				'"0 \\u{24} 1 \\u{005f} 2 \\u{} 3"',
				xjs.String.dedent`"012\\
				345\\%
				678"`,
				'"😀"',
				'"\u{10001}"',
				'"\\\u{10001}"',
				'"\\u{10001}"',
			].map((src) => decodeCooked(src)), [
				'',
				'hello',
				'0 " 1 \\ 2 \u0020 3 \t 4 \n 5 \r 6',
				'0 $ 1 _ 2 \0 3',
				'012 345%\n678',
				'\u{1f600}',
				'\u{10001}',
				'\u{10001}',
				'\u{10001}',
			]);
		});
		test.test('may contain an escaped `u` anywhere.', () => {
			assert.strictEqual(
				decodeCooked('"abc\\udef\\u"'),
				'abcudefu',
			);
		});
		test.suite('In-String Comments', () => {
			function cook(): string[] {
				return [
					xjs.String.dedent`"The five boxing wizards % jump quickly."`,

					xjs.String.dedent`"The five % boxing wizards
					jump quickly."`,

					xjs.String.dedent`"The five boxing wizards %
					jump quickly."`,

					xjs.String.dedent`"The five boxing wizards jump quickly.%
					"`,

					'"The five %% boxing wizards %% jump quickly."',

					'"The five boxing wizards %%%% jump quickly."',

					xjs.String.dedent`"The five %% boxing
					wizards %% jump
					quickly."`,

					xjs.String.dedent`"The five boxing
					wizards %% jump
					quickly.%%"`,

					xjs.String.dedent`"The five boxing
					wizards %% jump
					quickly."`,
				].map((src) => decodeCooked(src));
			}
			test.suite('with comments enabled.', () => {
				const data: Array<{description: string, expected: string}> = [
					{description: 'removes a line comment not ending in a LF.',   expected: 'The five boxing wizards '},
					{description: 'preserves a LF when line comment ends in LF.', expected: 'The five \njump quickly.'},
					{description: 'preserves a LF with empty line comment.',      expected: 'The five boxing wizards \njump quickly.'},
					{description: 'preserves a LF with last empty line comment.', expected: 'The five boxing wizards jump quickly.\n'},
					{description: 'removes multiline comments.',                  expected: 'The five  jump quickly.'},
					{description: 'removes empty multiline comments.',            expected: 'The five boxing wizards  jump quickly.'},
					{description: 'removes multiline comments containing LFs.',   expected: 'The five  jump\nquickly.'},
					{description: 'removes last multiline comment.',              expected: 'The five boxing\nwizards '},
					{description: 'removes multiline comment without end delim.', expected: 'The five boxing\nwizards '},
				];
				cook().forEach((actual, i) => {
					test.test(data[i].description, () => {
						assert.strictEqual(actual, data[i].expected);
					});
				});
			});
			test.test('`String.fromCodePoint` throws when UTF-8 encoding input is out of range.', () => {
				const out_of_range = 'a00061'; // NOTE: the valid range of input may change as Unicode evolves
				assert.throws(() => Validator.cookTokenString(`'a string literal with a unicode \\u{${ out_of_range }} escape sequence out of range'`), RangeError);
			});
		});
	});


	test.suite('.cookTokenTemplate', () => {
		function decodeCooked(source: string): string {
			return new TextDecoder().decode(new Uint8Array(Validator.cookTokenTemplate(source)));
		}
		test.test('produces the cooked template value.', () => {
			assert.deepStrictEqual(
				[
					'""""""',
					'"""hello"""',
					'"""head{{',
					'}}midl{{',
					'}}tail"""',
					'"""0 \\" 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6"""',
					'"""0 \\u{24} 1 \\u{005f} 2 \\u{} 3"""',
					xjs.String.dedent`"""012\\
					345
					678"""`,
					'"""😀 \\😀 \\u{1f600}"""',
				].map((src) => decodeCooked(src)),
				[
					'',
					'hello',
					'head',
					'midl',
					'tail',
					'0 \\" 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6',
					'0 \\u{24} 1 \\u{005f} 2 \\u{} 3',
					'012\\\n345\n678',
					'\u{1f600} \\\u{1f600} \\u{1f600}',
				],
			);
		});
	});
});

import * as assert from 'assert'
import * as xjs from 'extrajs';
import utf8 from 'utf8';
import type {
	CodeUnit,
} from '../../src/lib/index.js';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
} from '../../src/core/index.js';
import {
	TOKEN_SOLID as TOKEN,
	LexerSolid,
	LEXER,
} from '../../src/parser/index.js';



describe('TokenComment', () => {
	specify('#serialize', () => {
		assert.strictEqual([...LEXER.generate(`
			%% multiline
			comment %%
		`)][2].serialize(), `
			<COMMENT line="2" col="4">%% multiline
			comment %%</COMMENT>
		`.trim());
	});
});



describe('TokenSolid', () => {
	describe('#cook', () => {
		/**
		 * Decode a stream of numeric UTF-8 code units into a string.
		 * @param   codeunits a stream of numeric code units, each conforming to the UTF-8 specification
		 * @returns           a decoded string
		 */
		function utf8Decode(codeunits: readonly CodeUnit[]): string {
			return utf8.decode(String.fromCodePoint(...codeunits));
		}

		context('TokenKeyword', () => {
			it('assigns values 128n–255n to reserved keywords.', () => {
				const cooked: bigint[] = [...LEXER.generate(TOKEN.TokenKeyword.KEYWORDS.join(' '))]
					.filter((token): token is TOKEN.TokenKeyword => token instanceof TOKEN.TokenKeyword)
					.map((keyword) => keyword.cook())
				const expected: bigint[] = [...new Array(128)].map((_, i) => BigInt(i + 128)).slice(0, TOKEN.TokenKeyword.KEYWORDS.length)
				assert.deepStrictEqual(cooked, expected)
				cooked.forEach((value) => {
					assert.ok(128n <= value, 'cooked value should be >= 128n.')
					assert.ok(value < 256n, 'cooked value should be < 256n.')
				})
			})
		})

		context('TokenIdentifier', () => {
			context('TokenIdentifierBasic', () => {
				let cooked: (bigint | null)[];
				before(() => {
					cooked = [...LEXER.generate(`
						this be a word
						_words _can _start _with _underscores
						_and0 _can1 contain2 numb3rs

						a word _can repeat _with the same id
					`)]
						.filter((token): token is TOKEN.TokenIdentifier => token instanceof TOKEN.TokenIdentifier)
						.map((identifier) => identifier.cook());
				});
				it('assigns values 256n or greater.', () => {
					cooked.forEach((value) => {
						assert.ok(value !== null, 'cooked value should not be null.')
						assert.ok(value ! >= 256n, 'cooked value should be >= 256n.')
					})
				})
				it('assigns the same value to identical identifier names.', () => {
					assert.deepStrictEqual([
						cooked[2],
						cooked[3],
						cooked[5],
						cooked[7],
					], [
						cooked[13],
						cooked[14],
						cooked[15],
						cooked[17],
					])
				})
			})

			context('TokenIdentifierUnicode', () => {
				let cooked: (bigint | null)[];
				before(() => {
					cooked = [...LEXER.generate(`
						\`this\` \`is\` \`a\` \`unicode word\`
						\`any\` \`unicode word\` \`can\` \`contain\` \`any\` \`character\`
						\`except\` \`back-ticks\` \`.\`
					`)]
						.filter((token): token is TOKEN.TokenIdentifierUnicode => token instanceof TOKEN.TokenIdentifierUnicode)
						.map((identifier) => identifier.cook());
				});
				it('assigns values 256n or greater.', () => {
					cooked.forEach((value) => {
						assert.ok(value !== null, 'cooked value should not be null.')
						assert.ok(value ! >= 256n, 'cooked value should be >= 256n.')
					})
				})
				it('assigns the same value to identical identifier names.', () => {
					assert.deepStrictEqual([
						cooked[3],
						cooked[4],
					], [
						cooked[5],
						cooked[8],
					])
				})
			})
		})

		context('TokenNumber', () => {
			const lexer: LexerSolid = new LexerSolid({
				...CONFIG_DEFAULT,
				languageFeatures: {
					...CONFIG_DEFAULT.languageFeatures,
					integerRadices: true,
					numericSeparators: true,
				},
			});
			;[...new Map<string, [string, number[]]>([
				['implicit radix integers', [`
					370  037  +9037  -9037  +06  -06
				`, [
					370, 37, 9037, -9037, 6, -6,
				]]],
				['explicit radix integers', [`
					\\b100  \\b001  +\\b1000  -\\b1000  +\\b01  -\\b01
					\\q320  \\q032  +\\q1032  -\\q1032  +\\q03  -\\q03
					\\o370  \\o037  +\\o1037  -\\o1037  +\\o06  -\\o06
					\\d370  \\d037  +\\d9037  -\\d9037  +\\d06  -\\d06
					\\xe70  \\x0e7  +\\x90e7  -\\x90e7  +\\x06  -\\x06
					\\ze70  \\z0e7  +\\z90e7  -\\z90e7  +\\z06  -\\z06
				`, [
						    4,  1,       8,      -8, 1, -1,
						   56, 14,      78,     -78, 3, -3,
						  248, 31,     543,    -543, 6, -6,
						  370, 37,    9037,   -9037, 6, -6,
						 3696, 231,  37095,  -37095, 6, -6,
						18396, 511, 420415, -420415, 6, -6,
				]]],
				['floats', [`
					55.  -55.  033.  -033.  2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.  -0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				`, [
					55.0, -55.0, 33.0, -33.0, 2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					-0.0, -0.0, 6.8, 6.8, 0.0, -0.0,
				]]],
				['implicit radix integers with separators', [`
					12_345  +12_345  -12_345  0123_4567  +0123_4567  -0123_4567  012_345_678  +012_345_678  -012_345_678
				`, [
					12345, 12345, -12345, 1234567, 1234567, -1234567, 12345678, 12345678, -12345678,
				]]],
				['explicit radix integers with separators', [`
					\\b1_00  \\b0_01  +\\b1_000  -\\b1_000  +\\b0_1  -\\b0_1
					\\q3_20  \\q0_32  +\\q1_032  -\\q1_032  +\\q0_3  -\\q0_3
					\\o3_70  \\o0_37  +\\o1_037  -\\o1_037  +\\o0_6  -\\o0_6
					\\d3_70  \\d0_37  +\\d9_037  -\\d9_037  +\\d0_6  -\\d0_6
					\\xe_70  \\x0_e7  +\\x9_0e7  -\\x9_0e7  +\\x0_6  -\\x0_6
					\\ze_70  \\z0_e7  +\\z9_0e7  -\\z9_0e7  +\\z0_6  -\\z0_6
				`, [
						    4,  1,       8,      -8, 1, -1,
						   56, 14,      78,     -78, 3, -3,
						  248, 31,     543,    -543, 6, -6,
						  370, 37,    9037,   -9037, 6, -6,
						 3696, 231,  37095,  -37095, 6, -6,
						18396, 511, 420415, -420415, 6, -6,
				]]],
			])].forEach(([name, [source, values]]) => {
				it(`correctly cooks ${name}.`, () => {
					assert.deepStrictEqual([...lexer.generate(source)]
						.filter((token) => token instanceof TOKEN.TokenNumber)
						.map((token) => (token as TOKEN.TokenNumber).cook()), values)
				})
			})
		})

		Dev.supports('literalString-cook') && context('TokenString', () => {
			it('produces the cooked string value.', () => {
				assert.deepStrictEqual([...LEXER.generate(xjs.String.dedent`
					5 + 03 + '' * 'hello' *  -2;
					'0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6';
					'0 \\u{24} 1 \\u{005f} 2 \\u{} 3';
					'012\\
					345\\%
					678';
					'😀' '\u{10001}' '\\\u{10001}' '\\u{10001}';
				`)]
					.filter((token): token is TOKEN.TokenString => token instanceof TOKEN.TokenString)
					.map((token) => utf8Decode(token.cook()))
				, [
					``,
					`hello`,
					`0 ' 1 \\ 2 \u0020 3 \t 4 \n 5 \r 6`,
					`0 $ 1 _ 2 \0 3`,
					`012 345%\n678`,
					`\u{1f600}`, `\u{10001}`, `\u{10001}`, `\u{10001}`,
				]);
			})
			it('may contain an escaped `u` anywhere.', () => {
				assert.strictEqual(utf8Decode(([...LEXER.generate(`
					'abc\\udef\\u';
				`)][2] as TOKEN.TokenString).cook()), `abcudefu`);
			});
			describe('In-String Comments', () => {
				function cook(config: SolidConfig): string[] {
					return [...new LexerSolid(config).generate(xjs.String.dedent`
						'The five boxing wizards % jump quickly.'

						'The five % boxing wizards
						jump quickly.'

						'The five boxing wizards %
						jump quickly.'

						'The five boxing wizards jump quickly.%
						'

						'The five %% boxing wizards %% jump quickly.'

						'The five boxing wizards %%%% jump quickly.'

						'The five %% boxing
						wizards %% jump
						quickly.'

						'The five boxing
						wizards %% jump
						quickly.%%'

						'The five boxing
						wizards %% jump
						quickly.'
					`)]
						.filter((token): token is TOKEN.TokenString => token instanceof TOKEN.TokenString)
						.map((token) => utf8Decode(token.cook()))
					;
				}
				context('with comments enabled.', () => {
					const data: {testdesc: string, expected: string}[] = [
						{testdesc: 'removes a line comment not ending in a LF.',   expected: 'The five boxing wizards '},
						{testdesc: 'preserves a LF when line comment ends in LF.', expected: 'The five \njump quickly.'},
						{testdesc: 'preserves a LF with empty line comment.',      expected: 'The five boxing wizards \njump quickly.'},
						{testdesc: 'preserves a LF with last empty line comment.', expected: 'The five boxing wizards jump quickly.\n'},
						{testdesc: 'removes multiline comments.',                  expected: 'The five  jump quickly.'},
						{testdesc: 'removes empty multiline comments.',            expected: 'The five boxing wizards  jump quickly.'},
						{testdesc: 'removes multiline comments containing LFs.',   expected: 'The five  jump\nquickly.'},
						{testdesc: 'removes last multiline comment.',              expected: 'The five boxing\nwizards '},
						{testdesc: 'removes multiline comment without end delim.', expected: 'The five boxing\nwizards '},
					];
					cook(CONFIG_DEFAULT).forEach((actual, i) => {
						it(data[i].testdesc, () => {
							assert.strictEqual(actual, data[i].expected);
						});
					})
				});
				it('with comments disabled.', () => {
					assert.deepStrictEqual(cook({
						...CONFIG_DEFAULT,
						languageFeatures: {
							...CONFIG_DEFAULT.languageFeatures,
							comments: false,
						},
					}), [
						'The five boxing wizards % jump quickly.',
						'The five % boxing wizards\njump quickly.',
						'The five boxing wizards %\njump quickly.',
						'The five boxing wizards jump quickly.%\n',
						'The five %% boxing wizards %% jump quickly.',
						'The five boxing wizards %%%% jump quickly.',
						'The five %% boxing\nwizards %% jump\nquickly.',
						'The five boxing\nwizards %% jump\nquickly.%%',
						'The five boxing\nwizards %% jump\nquickly.',
					]);
				});
			});
		})

		Dev.supports('literalTemplate-cook') && context('TokenTemplate', () => {
			it('produces the cooked template value.', () => {
				assert.deepStrictEqual(
					[...LEXER.generate(xjs.String.dedent`
						600  /  '''''' * 3 + '''hello''' *  2;
						3 + '''head{{ * 2
						3 + }}midl{{ * 2
						3 + }}tail''' * 2
						'''0 \\\` 1''';
						'''0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6 \\\\\` 7''';
						'''0 \\u{24} 1 \\u{005f} 2 \\u{} 3''';
						'''012\\
						345
						678''';
						'''😀 \\😀 \\u{1f600}''';
					`)]
						.filter((token): token is TOKEN.TokenTemplate => token instanceof TOKEN.TokenTemplate)
						.map((token) => utf8Decode(token.cook()))
					,
					[
						``, `hello`,
						`head`,
						`midl`,
						`tail`,
						`0 \\\` 1`,
						`0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6 \\\\\` 7`,
						`0 \\u{24} 1 \\u{005f} 2 \\u{} 3`,
						`012\\\n345\n678`,
						`\u{1f600} \\\u{1f600} \\u{1f600}`,
					],
				);
			})
		})

		Dev.supports('literalString-cook') && it('`String.fromCodePoint` throws when UTF-8 encoding input is out of range.', () => {
			const stringtoken: TOKEN.TokenString = [...LEXER.generate(`
				'a string literal with a unicode \\u{a00061} escape sequence out of range';
			`)][2] as TOKEN.TokenString;
			assert.throws(() => stringtoken.cook(), RangeError)
		})
	})

	describe('#serialize', () => {
		specify('TokenCommentLine', () => {
			assert.strictEqual([...LEXER.generate(xjs.String.dedent`
				500  +  30; ;  % line comment  *  2
				8;
			`)][11].serialize(), `
				<COMMENT line="2" col="16">% line comment  *  2\n</COMMENT>
			`.trim());
		})
		specify('TokenCommentMulti', () => {
			assert.strictEqual([...LEXER.generate(xjs.String.dedent`
				%% multiline
				that has a
				comment %%
			`)][2].serialize(), xjs.String.dedent`
				<COMMENT line="2" col="1">%% multiline
				that has a
				comment %%</COMMENT>
			`.trim());
		})
	})
})

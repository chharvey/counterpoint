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

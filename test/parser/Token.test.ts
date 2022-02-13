import * as assert from 'assert'
import * as xjs from 'extrajs';
import utf8 from 'utf8';
import type {
	CodeUnit,
} from '../../src/lib/index.js';
import {
	Dev,
} from '../../src/core/index.js';
import {
	TOKEN_SOLID as TOKEN,
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

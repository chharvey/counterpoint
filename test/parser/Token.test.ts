import * as assert from 'assert'
import * as xjs from 'extrajs';
import {
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

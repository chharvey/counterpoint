import type {Token} from '@chharvey/parser';
import * as assert from 'assert';
import {
	TerminalInteger,
	TerminalString,
} from '../../src/parser/terminal/index.js';
import {LEXER} from '../../src/index.js';



describe('Terminal', () => {
	describe('#displayName', () => {
		it('returns the display name.', () => {
			assert.strictEqual(TerminalInteger .instance.displayName, 'INTEGER');
			assert.strictEqual(TerminalString  .instance.displayName, 'STRING');
		});
	});

	describe('#match', () => {
		it('returns whether a token satisfies a terminal.', () => {
			const tokens: Token[] = [...LEXER.generate(`
				42 || 'hello';
			`)];
			assert.ok( TerminalInteger .instance.match(tokens[2]));
			assert.ok( TerminalString  .instance.match(tokens[6]));
			assert.ok(!TerminalInteger .instance.match(tokens[6]));
			assert.ok(!TerminalString  .instance.match(tokens[2]));
		});
	});
});

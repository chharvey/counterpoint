import * as assert from 'assert';
import {
	LEXER,
	Token,
} from '../../src/index.js';
import {
	TerminalInteger,
	TerminalString,
} from '../../src/parser/terminal/index.js';



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

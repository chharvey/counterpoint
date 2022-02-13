import * as assert from 'assert';
import {
	Char,
	LexError01,
} from '../../src/index.js';



describe('LexError', () => {
	describe('#message', () => {
		specify('LexError01', () => {
			assert.strictEqual(
				new LexError01(new Char(`\u0002\n-\n\u0003`, 2)).message,
				'Unrecognized character: \`-\` at line 1 col 1.',
			);
		});
	});
});

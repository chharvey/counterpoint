import * as assert from 'assert';
import {
	Char,
	LexError03,
	LexError04,
	LexError05,
} from '../../src/index.js';



describe('ErrorCode', () => {
	describe('#message', () => {
		describe('LexError', () => {
			specify('LexError03', () => {
				const err: LexError03 = new LexError03(`\\a0`, 0, 0);
				assert.strictEqual(err.message, 'Invalid escape sequence: `\\a0` at line 1 col 1.');
			});
			specify('LexError04', () => {
				const err: LexError04 = new LexError04(new Char(`1000__000`, 0));
				assert.strictEqual(err.message, 'Numeric separator not allowed: at line 0 col 1.');
			});
			specify('LexError05', () => {
				const err: LexError05 = new LexError05(new Char('5.e+2', 0));
				assert.strictEqual(err.message, 'Invalid exponential notation: at line 0 col 1.');
			});
		});
	});
});

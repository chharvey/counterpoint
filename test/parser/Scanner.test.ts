import * as assert from 'assert';
import * as xjs from 'extrajs';
import {Filebound} from '../../src/index.js';
import {Scanner} from '../../src/parser/Scanner.js';



describe('Scanner', () => {
	describe('.normalize', () => {
		const normalized: string = Scanner.normalize(xjs.String.dedent`
			5  +  30 \u000d
			6 ^ 2 - 37 *
			( 4 * \u000d9 ^ 3
			3 - 50 + * 2
			5 + 03 + '' * 'hello' *  -2
			600  /  3  *  2
			600  /  (3  *  2
			4 * 2 ^ 3
		`);

		it('wraps source text.', () => {
			assert.strictEqual(normalized[0], Filebound.SOT);
			assert.strictEqual(normalized[1], '\n');
			assert.strictEqual(normalized[3], '5');
			assert.strictEqual(normalized[normalized.length - 2], '\n');
			assert.strictEqual(normalized[normalized.length - 1], Filebound.EOT);
		});

		context('normalizes line endings.', () => {
			it('replaces CR+LF with LF.', () => {
				assert.strictEqual(normalized[12], '\n');
			});
			it('replaces CR (not followed by LF) with LF.', () => {
				assert.strictEqual(normalized[32], '\n');
				assert.strictEqual(normalized[33], '9');
			});
			it('leaves LF as LF.', () => {
				assert.strictEqual(normalized[25], '\n');
				assert.strictEqual(normalized[26], '(');
			});
		});
	});
});

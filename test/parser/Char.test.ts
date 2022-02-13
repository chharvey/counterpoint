import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	Filebound,
	Char,
} from '../../src/index.js';



describe('Char', () => {
	function normalize(source: string): string {
		return [Filebound.SOT, '\n', source.replace(/\r\n|\r/g, '\n'), '\n', Filebound.EOT].join('');
	}
	const source_text: string = normalize(xjs.String.dedent`
		5  +  30 \u000d
		6 ^ 2 - 37 *
		( 4 * \u000d9 ^ 3
		3 - 50 + * 2
		5 + 03 + '' * 'hello' *  -2
		600  /  3  *  2
		600  /  (3  *  2
		4 * 2 ^ 3
	`);

	describe('.eq', () => {
		it('compares one character.', () => {
			assert.ok(Char.eq('+', new Char(source_text, 6)))
		});
		it('compares several characters.', () => {
			assert.ok(Char.eq('30', new Char(source_text, 9), new Char(source_text, 10)))
		});
	});

	describe('.inc', () => {
		it('the characters, concatenated, should be among the array entries.', () => {
			assert.ok(Char.inc(['he', 'llo'], new Char(source_text, 67), new Char(source_text, 68)))
		});
	});

	describe('#{source,line,column}', () => {
		it('returns the source text, line number, and column number.', () => {
			const {source, line_index, col_index} = new Char(source_text, 37);
			assert.deepStrictEqual(
				[source, line_index + 1, col_index + 1],
				['3',    5,              5],
			);
		});
	});

	describe('#lookahead', () => {
		it('is Char.', () => {
			const lookahead: Char | null = new Char(source_text, 23).lookahead();
			assert.ok(lookahead instanceof Char);
			const {source, line_index, col_index} = lookahead;
			assert.deepStrictEqual(
				[source, line_index + 1, col_index + 1],
				['*',    3,              12],
			);
		});
		it('if last is null.', () => {
			const char: Char = new Char(source_text, source_text.length - 1);
			assert.strictEqual(char.source, Filebound.EOT);
			assert.strictEqual(char.lookahead(), null);
		});
	});
});

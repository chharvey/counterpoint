import * as assert from 'assert';
import {
	Char,
	Token,
	ParseError01,
} from '../../src/index.js';
import {Scanner} from '../../src/parser/Scanner.js';



describe('ParseError01', () => {
	specify('#message', () => {
		const src: string = `lookahead`;
		const chars: Char[] = [...Scanner.generate(src)].slice(2, -2); // slice off line normalization
		assert.strictEqual(
			new ParseError01(new Token('TOKEN', chars[0], ...chars.slice(1))).message,
			'Unexpected token: \`lookahead\` at line 1 col 1.',
		);
	});
});

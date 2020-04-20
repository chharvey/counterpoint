import * as assert from 'assert'

import Lexer    from '../src/class/Lexer.class'
import Screener from '../src/class/Screener.class'
import {
	TokenString,
} from '../src/class/Token.class'
import {
	LexError02,
	LexError03,
} from '../src/error/LexError.class'



suite('Lexer recognizes `TokenString` conditions.', () => {
	test('Basic strings.', () => {
		const tokens = [...new Lexer(`
3 - 50 + * 2

5 + 03 + '' * 'hello' *  -2

600  /  3  *  2

600  /  (3  *  2

4 * 2 ^ 3
		`.trim()).generate()]
		assert.ok(tokens[22] instanceof TokenString)
		assert.strictEqual(tokens[22].source.length, 2)
		assert.ok(tokens[26] instanceof TokenString)
		assert.strictEqual(tokens[26].source, `'hello'`)
	})

	test('Escaped characters.', () => {
		const tokenstring = [...new Lexer(`
'0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6';
		`.trim()).generate()][2]
		assert.strictEqual(tokenstring.source.slice( 3,  5), `\\'`)
		assert.strictEqual(tokenstring.source.slice( 8, 10), `\\\\`)
		assert.strictEqual(tokenstring.source.slice(13, 15), `\\s`)
		assert.strictEqual(tokenstring.source.slice(18, 20), `\\t`)
		assert.strictEqual(tokenstring.source.slice(23, 25), `\\n`)
		assert.strictEqual(tokenstring.source.slice(28, 30), `\\r`)
	})

	test('Escaped character sequences.', () => {
		const tokenstring = [...new Lexer(`
'0 \\u{24} 1 \\u{005f} 2 \\u{} 3';
		`.trim()).generate()][2]
		assert.strictEqual(tokenstring.source.slice( 3,  9), `\\u{24}`)
		assert.strictEqual(tokenstring.source.slice(12, 20), `\\u{005f}`)
		assert.strictEqual(tokenstring.source.slice(23, 27), `\\u{}`)
	})

	test('Line continuation.', () => {
		const tokenstring = [...new Lexer(`
'012\\
345
678';
		`.trim()).generate()][2]
		assert.strictEqual(tokenstring.source.slice(4,  6), `\\\n`)
		assert.strictEqual(tokenstring.source.slice(9, 10), `\n`)
	})

	test('Strings containing comment syntax.', () => {
		;[`
'Here is a string % that contains a line comment start marker.'
		`, `
'Here is a string {% that contains %} a multiline comment.'
		`, `
'Here is a string {% that contains a comment start marker but no end.'
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			assert.doesNotThrow(() => [...lexer.generate()])
		})
	})

	test('Unfinished string throws.', () => {
		;[`
'string without end delimiter
		`, `
'string with end delimiter but contains \u0003 character'
8;
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			assert.throws(() => [...lexer.generate()], LexError02)
		})
	})

	test('Invalid escape sequences.', () => {
		;[`
'a string literal with \\u{6g} an invalid escape sequence'
		`, `
'a string literal with \\u{61 an invalid escape sequence'
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			assert.throws(() => [...lexer.generate()], LexError03)
		})
	})
})



test('Screener computes `TokenString` values.', () => {
	const tokens = [...new Screener(`
5 + 03 + '' * 'hello' *  -2;

'0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6';

'0 \\u{24} 1 \\u{005f} 2 \\u{} 3';

'012\\
345
678';
	`.trim()).generate()]
	assert.strictEqual(tokens[ 5].cook(), ``)
	assert.strictEqual(tokens[ 7].cook(), `hello`)
	assert.strictEqual(tokens[11].cook(), `0 \' 1 \\ 2 \u0020 3 \t 4 \n 5 \r 6`)
	assert.strictEqual(tokens[13].cook(), `0 $ 1 _ 2 \0 3`)
	assert.strictEqual(tokens[15].cook(), `012 345\n678`)
})



test('UTF-16 encoding throws when input is out of range.', () => {
	const stringtoken = [...new Screener(`
'a string literal with a unicode \\u{a00061} escape sequence out of range';
	`.trim()).generate()][1]
	assert.throws(() => stringtoken.cook(), RangeError)
})

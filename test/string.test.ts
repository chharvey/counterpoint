import Lexer    from '../src/class/Lexer.class'
import Screener from '../src/class/Screener.class'
import {
	TokenString,
} from '../src/class/Token.class'
import {
	LexError02,
	LexError03,
} from '../src/error/LexError.class'



describe('Lexer recognizes `TokenString` conditions.', () => {
	test('Basic strings.', () => {
		const tokens = [...new Lexer(`
3 - 50 + * 2

5 + 03 + '' * 'hello' *  -2

600  /  3  *  2

600  /  (3  *  2

4 * 2 ^ 3
		`.trim()).generate()]
		expect(tokens[22]).toBeInstanceOf(TokenString)
		expect(tokens[22].source.length).toBe(2)
		expect(tokens[26]).toBeInstanceOf(TokenString)
		expect(tokens[26].source).toBe(`'hello'`)
	})

	test('Escaped characters.', () => {
		const tokenstring = [...new Lexer(`
'0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6';
		`.trim()).generate()][2]
		expect(tokenstring.source.slice( 3,  5)).toBe(`\\'`)
		expect(tokenstring.source.slice( 8, 10)).toBe(`\\\\`)
		expect(tokenstring.source.slice(13, 15)).toBe(`\\s`)
		expect(tokenstring.source.slice(18, 20)).toBe(`\\t`)
		expect(tokenstring.source.slice(23, 25)).toBe(`\\n`)
		expect(tokenstring.source.slice(28, 30)).toBe(`\\r`)
	})

	test('Escaped character sequences.', () => {
		const tokenstring = [...new Lexer(`
'0 \\u{24} 1 \\u{005f} 2 \\u{} 3';
		`.trim()).generate()][2]
		expect(tokenstring.source.slice( 3,  9)).toBe(`\\u{24}`)
		expect(tokenstring.source.slice(12, 20)).toBe(`\\u{005f}`)
		expect(tokenstring.source.slice(23, 27)).toBe(`\\u{}`)
	})

	test('Line continuation.', () => {
		const tokenstring = [...new Lexer(`
'012\\
345
678';
		`.trim()).generate()][2]
		expect(tokenstring.source.slice(4,  6)).toBe(`\\\n`)
		expect(tokenstring.source.slice(9, 10)).toBe(`\n`)
	})

	test('Strings containing comment syntax.', () => {
		;[`
'Here is a string % that contains a line comment start marker.'
		`, `
'Here is a string {% that contains %} a multiline comment.'
		`, `
'Here is a string {% that contains a comment start marker but no end.'
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			expect(() => [...lexer.generate()]).not.toThrow()
		})
	})

	test('Unfinished string throws.', () => {
		;[`
'string without end delimiter
		`, `
'string with end delimiter but contains \u0003 character'
8;
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			expect(() => [...lexer.generate()]).toThrow(LexError02)
		})
	})

	test('Invalid escape sequences.', () => {
		;[`
'a string literal with \\u{6g} an invalid escape sequence'
		`, `
'a string literal with \\u{61 an invalid escape sequence'
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			expect(() => [...lexer.generate()]).toThrow(LexError03)
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
	expect(tokens[ 5].cook()).toBe(``)
	expect(tokens[ 7].cook()).toBe(`hello`)
	expect(tokens[11].cook()).toBe(`0 \' 1 \\ 2 \u0020 3 \t 4 \n 5 \r 6`)
	expect(tokens[13].cook()).toBe(`0 $ 1 _ 2 \0 3`)
	expect(tokens[15].cook()).toBe(`012 345\n678`)
})



test('UTF-16 encoding throws when input is out of range.', () => {
	const stringtoken = [...new Screener(`
'a string literal with a unicode \\u{a00061} escape sequence out of range';
	`.trim()).generate()][1]
	expect(() => stringtoken.cook()).toThrow(RangeError)
})

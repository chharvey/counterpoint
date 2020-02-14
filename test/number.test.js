const {default: Scanner} = require('../build/class/Scanner.class.js')
const {default: Lexer} = require('../build/class/Lexer.class.js')
const {default: Screener} = require('../build/class/Screener.class.js')
const {default: Char} = require('../build/class/Char.class.js')
const {
	TokenWhitespace,
	TokenNumber,
} = require('../build/class/Token.class.js')


describe('Lexer recognizes `TokenNumber` conditions.', () => {
	test('Single-digit numbers.', () => {
		;[...new Lexer(TokenNumber.DIGITS.get(10).join(' ')).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace)).forEach((token) => {
			expect(token).toBeInstanceOf(TokenNumber)
		})
		;[...TokenNumber.BASES.entries()].map(([base, radix]) =>
			[...new Lexer(
				TokenNumber.DIGITS.get(radix).map((d) => `\\${base}${d}`).join(' ')
			).generate()].slice(1, -1)
		).flat().filter((token) => !(token instanceof TokenWhitespace)).forEach((token) => {
			expect(token).toBeInstanceOf(TokenNumber)
		})
	})

	test('Tokenize non-prefixed (decimal) integers.', () => {
		const tokens = [...new Lexer(`
+  55  -  33  2  007  700  +91  -27  +091  -0027
		`.trim()).generate()]
		expect(tokens[ 4].source).toBe(`55`)
		expect(tokens[ 8].source).toBe(`33`)
		expect(tokens[10].source).toBe(`2`)
		expect(tokens[12].source).toBe(`007`)
		expect(tokens[14].source).toBe(`700`)
		expect(tokens[16].source).toBe(`+91`)
		expect(tokens[18].source).toBe(`-27`)
		expect(tokens[20].source).toBe(`+091`)
		expect(tokens[22].source).toBe(`-0027`)
	})

	test('Tokenize prefixed integers.', () => {
		const source = `
\\b100  \\b001  +\\b1000  -\\b1000  +\\b01  -\\b01
\\q320  \\q032  +\\q1032  -\\q1032  +\\q03  -\\q03
\\o370  \\o037  +\\o1037  -\\o1037  +\\o06  -\\o06
\\d370  \\d037  +\\d9037  -\\d9037  +\\d06  -\\d06
\\xe70  \\x0e7  +\\x90e7  -\\x90e7  +\\x06  -\\x06
\\ze70  \\z0e7  +\\z90e7  -\\z90e7  +\\z06  -\\z06
		`.trim().replace(/\n/g, '  ')
		;[...new Lexer(source).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace)).forEach((token, i) => {
			expect(token).toBeInstanceOf(TokenNumber)
			expect(token.source).toBe(source.split('  ')[i])
		})
	})
})



test('Screener computes number token values.', () => {
	;[...new Screener(`
5 + 03 *  -2

600  /  (  *  23

4 * 2 ^ /

-60 * -2 / 12
	`.trim()).generate()].forEach((token) => {
		if (token instanceof TokenNumber) {
			expect(token.cook()).toBe(parseInt(token.source))
		}
	})
})

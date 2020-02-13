const {default: Scanner} = require('../build/class/Scanner.class.js')
const {default: Lexer} = require('../build/class/Lexer.class.js')
const {default: Screener} = require('../build/class/Screener.class.js')
const {default: Char} = require('../build/class/Char.class.js')
const {
	TokenWhitespace,
	TokenNumber,
} = require('../build/class/Token.class.js')



test('Lexer recognizes `TokenNumber` conditions.', () => {
	;[...new Lexer(TokenNumber.DIGITS.get(10).join(' ')).generate()].slice(1, -1)
		.filter((token) => !(token instanceof TokenWhitespace))
		.forEach((token) => {
			expect(token).toBeInstanceOf(TokenNumber)
		})
})



test('TokenNumber#serialize', () => {
	const lexer = new Lexer(`5`)
	lexer.advance(2) // bypass added `\u0002\u000a`
	const token = new TokenNumber(lexer)
	token.add(...'42'.split('').map((s) => new Char(new Scanner(s), 2)))
	expect(token.source).toBe('542')
	expect(token.serialize()).toBe('<NUMBER line="1" col="1" value="542">542</NUMBER>')
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

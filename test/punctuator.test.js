const {default: Scanner} = require('../build/class/Scanner.class.js')
const {default: Lexer} = require('../build/class/Lexer.class.js')
const {default: Char} = require('../build/class/Char.class.js')
const {
	TokenWhitespace,
	TokenPunctuator,
} = require('../build/class/Token.class.js')



test('Lexer recognizes `TokenPunctuator` conditions.', () => {
	;[...new Lexer([
		...TokenPunctuator.CHARS_1,
		...TokenPunctuator.CHARS_2,
		...TokenPunctuator.CHARS_3,
	].filter((p) => p !== '').join(' ')).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace)).forEach((value) => {
		expect(value).toBeInstanceOf(TokenPunctuator)
	})
})



test('TokenPunctuator#serialize', () => {
	const lexer = new Lexer(`+`)
	lexer.advance(2) // bypass added `\u0002\u000a`
	const token = new TokenPunctuator(lexer)
	token.add(new Char(new Scanner('='), 2))
	expect(token.source).toBe('+=')
	expect(token.serialize()).toBe('<PUNCTUATOR line="1" col="1" value="+=">+=</PUNCTUATOR>')
})

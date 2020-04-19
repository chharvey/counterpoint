import Scanner from '../src/class/Scanner.class'
import Lexer   from '../src/class/Lexer.class'
import Char    from '../src/class/Char.class'
import {
	TokenWhitespace,
	TokenPunctuator,
} from '../src/class/Token.class'



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
	lexer.advance(2n) // bypass added `\u0002\u000a`
	const token = new TokenPunctuator(lexer)
	token.add(new Char(new Scanner('='), 2))
	expect(token.source).toBe('+=')
	expect(token.serialize()).toBe('<PUNCTUATOR line="1" col="1" value="+=">+=</PUNCTUATOR>')
})

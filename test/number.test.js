const {default: Scanner} = require('../build/class/Scanner.class.js')
const {default: Lexer} = require('../build/class/Lexer.class.js')
const {default: Screener} = require('../build/class/Screener.class.js')
const {default: Char} = require('../build/class/Char.class.js')
const {
	TokenWhitespace,
	TokenNumber,
} = require('../build/class/Token.class.js')

const mock = `
5 + 03 *  -2

600  /  (  *  23

4 * 2 ^ /

-60 * -2 / 12
`.trim()



test('Lexer recognizes `TokenNumber` conditions.', () => {
	const bank = TokenNumber.DIGITS.get(10)
	const lexer = new Lexer(bank.join(' '))
	const generator = lexer.generate()
	;[...generator].slice(1, -1).forEach((value) => {
		try {
			expect(value).toBeInstanceOf(TokenNumber)
		} catch {
			expect(value).toBeInstanceOf(TokenWhitespace)
		}
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
	const screener = new Screener(mock)
	const generator = screener.generate()
	let iterator_result = generator.next()
	while (!iterator_result.done) {
		const token = iterator_result.value
		if (token instanceof TokenNumber) {
			expect(token.cook()).toBe(parseInt(token.source))
		}
		iterator_result = generator.next()
	}
})

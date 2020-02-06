const {default: Scanner} = require('../build/class/Scanner.class.js')
const {default: Lexer} = require('../build/class/Lexer.class.js')
const {
	default: Char,
	STX,
	ETX,
} = require('../build/class/Char.class.js')
const {
	default: Token,
	TokenFilebound,
	TokenWhitespace,
	TokenNumber,
	TokenPunctuator,
} = require('../build/class/Token.class.js')
const {
	LexError01,
} = require('../build/error/LexError.class.js')

const mock = `
3 - 50 + * 2

5 + 03 *  -2

600  /  3  *  2

600  /  (3  *  2

4 * 2 ^ 3
`.trim()



test('Lexer recognizes `TokenFilebound` conditions.', () => {
	const lexer = new Lexer(mock)
	const generator = lexer.generate()
	let iterator_result = generator.next()
	expect(iterator_result.value).toBeInstanceOf(TokenFilebound)
	expect(iterator_result.value.source).toBe(STX)
	while (iterator_result.value.source !== ETX) {
		iterator_result = generator.next()
	}
	expect(iterator_result.value).toBeInstanceOf(TokenFilebound)
	expect(iterator_result.value.source).toBe(ETX)
	iterator_result = generator.next()
	expect(iterator_result.done).toBe(true)
})



test('Lexer recognizes `TokenWhitespace` conditions.', () => {
	;[...new Lexer(TokenWhitespace.CHARS.join('')).generate()].slice(1, -1).forEach((value) => {
		expect(value).toBeInstanceOf(TokenWhitespace)
	})
})



test('Lexer recognizes `TokenComment` conditions.', () => {
})



test('Lexer recognizes `TokenString` conditions.', () => {
})



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



test('Lexer recognizes `TokenWord` conditions.', () => {
})



test('Lexer recognizes `TokenPunctuator` conditions.', () => {
	const bank = [
		...TokenPunctuator.CHARS_1,
		...TokenPunctuator.CHARS_2,
		...TokenPunctuator.CHARS_3,
	].filter((p) => p !== '')
	const lexer = new Lexer(bank.join(' '))
	const generator = lexer.generate()
	;[...generator].slice(1, -1).forEach((value) => {
		try {
			expect(value).toBeInstanceOf(TokenPunctuator)
		} catch {
			expect(value).toBeInstanceOf(TokenWhitespace)
		}
	})
})



test('Lexer rejects unrecognized characters.', () => {
	`. ~ , [ ] | & ! { } : # $ %`.split(' ').forEach((c) => {
		const lexer = new Lexer(`
5  +  30
+ 6 ^ - (${c} - 37 *
		`.trim())
		const generator = lexer.generate()
		let iterator_result = generator.next()
		expect(() => {
			while (!iterator_result.done) {
				iterator_result = generator.next()
			}
		}).toThrow(LexError01)
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



test('TokenPunctuator#serialize', () => {
	const lexer = new Lexer(`+`)
	lexer.advance(2) // bypass added `\u0002\u000a`
	const token = new TokenPunctuator(lexer)
	token.add(new Char(new Scanner('='), 2))
	expect(token.source).toBe('+=')
	expect(token.serialize()).toBe('<PUNCTUATOR line="1" col="1" value="+=">+=</PUNCTUATOR>')
})

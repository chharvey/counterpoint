const {default: Scanner} = require('../build/class/Scanner.class.js')
const {default: Lexer} = require('../build/class/Lexer.class.js')
const {
	default: Char,
	SOT,
	EOT,
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



test('Lexer yields `Token`, non-`TokenWhitespace`, objects.', () => {
	const lexer = new Lexer(mock)
	const generator = lexer.generate()
	let iterator_result = generator.next()
	while (!iterator_result.done) {
		const token = iterator_result.value
		expect(token).toBeInstanceOf(Token)
		expect(token).not.toBeInstanceOf(TokenWhitespace)
		iterator_result = generator.next()
	}
})



test('Lexer recognizes `TokenFilebound` conditions.', () => {
	const lexer = new Lexer(mock)
	const generator = lexer.generate()
	let iterator_result = generator.next()
	expect(iterator_result.value).toBeInstanceOf(TokenFilebound)
	expect(iterator_result.value.source).toBe(SOT)
	while (iterator_result.value.source !== EOT) {
		iterator_result = generator.next()
	}
	expect(iterator_result.value).toBeInstanceOf(TokenFilebound)
	expect(iterator_result.value.source).toBe(EOT)
	iterator_result = generator.next()
	expect(iterator_result.done).toBe(true)
})



test('Lexer recognizes `TokenWhitespace` conditions.', () => {
})



test('Lexer recognizes `TokenComment` conditions.', () => {
})



test('Lexer recognizes `TokenString` conditions.', () => {
})



test('Lexer recognizes `TokenNumber` conditions.', () => {
	const bank = TokenNumber.CHARACTERS
	const lexer = new Lexer(bank.join(' '))
	const generator = lexer.generate()
	let iterator_result = generator.next()
	expect(iterator_result.value).toBeInstanceOf(TokenFilebound)
	bank.forEach(() => {
		iterator_result = generator.next()
		expect(iterator_result.value).toBeInstanceOf(TokenNumber)
	})
	iterator_result = generator.next()
	expect(iterator_result.value).toBeInstanceOf(TokenFilebound)
})



test('Lexer recognizes `TokenWord` conditions.', () => {
})



test('Lexer recognizes `TokenPunctuator` conditions.', () => {
	const bank = [
		...TokenPunctuator.CHARACTERS_1,
		...TokenPunctuator.CHARACTERS_2,
		...TokenPunctuator.CHARACTERS_3,
	].filter((p) => p !== '')
	const lexer = new Lexer(bank.join(' '))
	const generator = lexer.generate()
	let iterator_result = generator.next()
	expect(iterator_result.value).toBeInstanceOf(TokenFilebound)
	bank.forEach(() => {
		iterator_result = generator.next()
		expect(iterator_result.value).toBeInstanceOf(TokenPunctuator)
	})
	iterator_result = generator.next()
	expect(iterator_result.value).toBeInstanceOf(TokenFilebound)
})



test('Lexer rejects unrecognized characters.', () => {
	`_ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z a b c d e f g h i j k l m n o p q r s t u v w x y z`.split(' ').forEach((c) => {
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
		}).toThrow(new LexError01(c, 2 - 1, 10 - 1))
	})
})



test('TokenNumber#serialize', () => {
	let token = new TokenNumber(new Char(new Scanner(`5`), 2))
	token.add('42')
	expect(token.source).toBe('542')
	expect(token.serialize()).toBe('<NUMBER line="1" col="1">542</NUMBER>')
})



test('TokenPunctuator#serialize', () => {
	let token = new TokenPunctuator(new Char(new Scanner(`+`), 2))
	token.add('=')
	expect(token.source).toBe('+=')
	expect(token.serialize()).toBe('<PUNCTUATOR line="1" col="1">+=</PUNCTUATOR>')
})

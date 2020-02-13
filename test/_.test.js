const {default: Scanner} = require('../build/class/Scanner.class.js')
const {default: Lexer} = require('../build/class/Lexer.class.js')
const {default: Screener} = require('../build/class/Screener.class.js')
const {default: Parser} = require('../build/class/Parser.class.js')
const {
	default: Char,
	STX,
	ETX,
} = require('../build/class/Char.class.js')
const {
	default: Token,
	TokenFilebound,
	TokenWhitespace,
} = require('../build/class/Token.class.js')
const {
	LexError01,
} = require('../build/error/LexError.class.js')

const lastItem = (iterable) => iterable[iterable.length-1]
const lastIndex = (iterable) => iterable.length-1

const scannermock = `
5  +  30 \u000d

6 ^ 2 - 37 *

( 4 * \u000d9 ^ 3
`.trim()

const mock = `
3 - 50 + * 2

5 + 03 + '' * 'hello' *  -2

600  /  3  *  2

600  /  (3  *  2

4 * 2 ^ 3
`.trim()



test('Scanner wraps source text.', () => {
	const scanner = new Scanner(scannermock)
	expect(scanner.source_text[0]).toBe(STX)
	expect(scanner.source_text[1]).toBe('\n')
	expect(scanner.source_text[2]).toBe('5')
	expect(lastItem(scanner.source_text)).toBe(ETX)
})



test('Scanner normalizes line endings.', () => {
	const scanner = new Scanner(scannermock)
	expect(scanner.source_text[11]).toBe('\n')
	expect(scanner.source_text[12]).toBe('\n')
	expect(scanner.source_text[13]).toBe('6')
	expect(scanner.source_text[33]).toBe('\n')
	expect(scanner.source_text[34]).toBe('9')
})



test('Scanner yields Character objects.', () => {
	const scanner = new Scanner(scannermock)
	const generator = scanner.generate()
	let iterator_result = generator.next()
	while (!iterator_result.done) {
		expect(iterator_result.value).toBeInstanceOf(Char)
		iterator_result = generator.next()
	}
})



test('Character source, line, column.', () => {
	const {source, line_index, col_index} = new Char(new Scanner(scannermock), 21)
	expect([source, line_index + 1, col_index + 1]).toEqual(['3', 3, 9])
})



test('Character lookahead is Char.', () => {
	const lookahead = new Char(new Scanner(scannermock), 23).lookahead()
	expect(lookahead).toBeInstanceOf(Char)
	const {source, line_index, col_index} = lookahead
	expect([source, line_index + 1, col_index + 1]).toEqual(['*', 3, 12])
})



test('Last character lookahead is null.', () => {
	const scanner = new Scanner(scannermock)
	const char = new Char(scanner, lastIndex(scanner.source_text))
	expect(char.source).toBe(ETX)
	expect(char.lookahead()).toBe(null)
})



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



test('Screener yields `Token`, non-`TokenWhitespace`, objects.', () => {
	const screener = new Screener(mock)
	const generator = screener.generate()
	let iterator_result = generator.next()
	while (!iterator_result.done) {
		const token = iterator_result.value
		expect(token).toBeInstanceOf(Token)
		expect(token).not.toBeInstanceOf(TokenWhitespace)
		iterator_result = generator.next()
	}
})



test('Screener computes filebound token values.', () => {
	const screener = new Screener(mock)
	const generator = screener.generate()
	let iterator_result = generator.next()
	expect(iterator_result.value.cook()).toBe(true)
	while (iterator_result.value.source !== ETX) {
		iterator_result = generator.next()
	}
	expect(iterator_result.value.cook()).toBe(false)
	iterator_result = generator.next()
	expect(iterator_result.done).toBe(true)
})



test('Parse empty file.', () => {
	const tree = new Parser('').parse()
	expect(tree.tagname).toBe('Goal')
	expect(tree.children.length).toBe(2)
	tree.children.forEach((child) => expect(child).toEqual(expect.any(TokenFilebound)))
})



test('Decorate empty file.', () => {
	const node = new Parser('').parse()
	expect(node.decorate().tagname).toBe('Null')
})



test('Compile empty file.', () => {
	const node = new Parser('').parse().decorate()
	expect(node.compile()).toBe(`
export default null
	`.trim())
})

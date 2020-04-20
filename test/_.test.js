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

const mock = `
5  +  30 \u000d

6 ^ 2 - 37 *

( 4 * \u000d9 ^ 3

3 - 50 + * 2

5 + 03 + '' * 'hello' *  -2

600  /  3  *  2

600  /  (3  *  2

4 * 2 ^ 3
`.trim()



describe('Scanner.', () => {
	test('Scanner wraps source text.', () => {
		const scanner = new Scanner(mock)
		expect(scanner.source_text[0]).toBe(STX)
		expect(scanner.source_text[1]).toBe('\n')
		expect(scanner.source_text[2]).toBe('5')
		expect(lastItem(scanner.source_text)).toBe(ETX)
	})

	test('Scanner normalizes line endings.', () => {
		const scanner = new Scanner(mock)
		expect(scanner.source_text[11]).toBe('\n')
		expect(scanner.source_text[12]).toBe('\n')
		expect(scanner.source_text[13]).toBe('6')
		expect(scanner.source_text[33]).toBe('\n')
		expect(scanner.source_text[34]).toBe('9')
	})

	test('Scanner yields Character objects.', () => {
		const scanner = new Scanner(mock)
		const generator = scanner.generate()
		let iterator_result = generator.next()
		while (!iterator_result.done) {
			expect(iterator_result.value).toBeInstanceOf(Char)
			iterator_result = generator.next()
		}
	})

	test('Character source, line, column.', () => {
		const {source, line_index, col_index} = new Char(new Scanner(mock), 21)
		expect([source, line_index + 1, col_index + 1]).toEqual(['3', 3, 9])
	})

	test('Character lookahead is Char.', () => {
		const lookahead = new Char(new Scanner(mock), 23).lookahead()
		expect(lookahead).toBeInstanceOf(Char)
		const {source, line_index, col_index} = lookahead
		expect([source, line_index + 1, col_index + 1]).toEqual(['*', 3, 12])
	})

	test('Last character lookahead is null.', () => {
		const scanner = new Scanner(mock)
		const char = new Char(scanner, lastIndex(scanner.source_text))
		expect(char.source).toBe(ETX)
		expect(char.lookahead()).toBe(null)
	})
})



describe('Lexer.', () => {
	test('Lexer recognizes `TokenFilebound` conditions.', () => {
		const tokens = [...new Lexer(mock).generate()]
		expect(tokens[0]).toBeInstanceOf(TokenFilebound)
		expect(tokens[0].source).toBe(STX)
		expect(lastItem(tokens)).toBeInstanceOf(TokenFilebound)
		expect(lastItem(tokens).source).toBe(ETX)
	})

	test('Lexer recognizes `TokenWhitespace` conditions.', () => {
		;[...new Lexer(TokenWhitespace.CHARS.join('')).generate()].slice(1, -1).forEach((value) => {
			expect(value).toBeInstanceOf(TokenWhitespace)
		})
	})

	test('Lexer rejects unrecognized characters.', () => {
		`. ~ , [ ] | & ! { } : # $ "`.split(' ').map((c) => new Lexer(`
	5  +  30
	+ 6 ^ - (${c} - 37 *
		`.trim())).forEach((lexer) => {
			expect(() => [...lexer.generate()]).toThrow(LexError01)
		})
	})
})



describe('Screener.', () => {
	test('Screener yields `Token`, non-`TokenWhitespace`, objects.', () => {
		;[...new Screener(mock).generate()].forEach((token) => {
			expect(token).toBeInstanceOf(Token)
			expect(token).not.toBeInstanceOf(TokenWhitespace)
		})
	})

	test('Screener computes filebound token values.', () => {
		const tokens = [...new Screener(mock).generate()]
		expect(tokens[0].cook()).toBe(true)
		expect(lastItem(tokens).cook()).toBe(false)
	})
})



describe('Empty file.', () => {
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

	test.skip('Compile empty file.', () => {
		const node = new Parser('').parse().decorate()
		expect(node.compile()).toBe(`
	export default null
		`.trim())
	})
})

const {default: Scanner} = require('../build/class/Scanner.class.js')
const {
	default: Char,
	STX,
	ETX,
} = require('../build/class/Char.class.js')

const lastItem = (iterable) => iterable[iterable.length-1]
const lastIndex = (iterable) => iterable.length-1
const mock = `
5  +  30

6 ^ 2 - 37 *

( 4 * 2 ^ 3
`.trim()



test('Scanner wraps source text.', () => {
	const scanner = new Scanner(mock)
	expect(scanner.source_text[0]).toBe(STX)
	expect(scanner.source_text[1]).toBe('\n')
	expect(lastItem(scanner.source_text)).toBe(ETX)
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
	const {source, line_index, col_index} = new Char(new Scanner(mock), 20)
	expect([source, line_index + 1, col_index + 1]).toEqual(['3', 3, 9])
})



test('Character lookahead is Char.', () => {
	const lookahead = new Char(new Scanner(mock), 22).lookahead()
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

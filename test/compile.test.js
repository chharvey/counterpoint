const {default: Parser} = require('../build/class/Parser.class.js')



test('Compile empty file.', () => {
	const node = new Parser('').parse().decorate()
	expect(node.compile()).toBe(`
export default null
	`.trim())
})



test('Compile empty statement.', () => {
	const parser = new Parser(';')
	expect(parser.parse().decorate().compile()).toBe(`
export default void 0
export default __2
	`.trim())
})



test('Compile expression unit.', () => {
	const node = new Parser('42;').parse().decorate()
	expect(node.compile()).toBe(`
export default void 0
export default __2
	`.trim())
})



test('Compile simple expression.', () => {
	const node = new Parser('2 + -3;').parse().decorate()
	expect(node.compile()).toBe(`
export default void 0
export default __2
	`.trim())
})



test('Compile compound expression.', () => {
	const node = new Parser('42 + 3 * -1;').parse().decorate()
	expect(node.compile()).toBe(`
export default void 0
export default __2
	`.trim())
})

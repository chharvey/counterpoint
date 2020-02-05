const {default: Parser} = require('../build/class/Parser.class.js')



test('Compile empty file.', () => {
	const node = new Parser('').parse().decorate()
	expect(node.compile()).toBe(`
export default null
	`.replace(/\n\t*/g, ''))
})



test('Compile file with single token.', () => {
	const node = new Parser('42').parse().decorate()
	expect(node.compile()).toBe(`
export default 42
	`.trim())
})



test('Compile file with simple expression.', () => {
	const node = new Parser('42 + 420').parse().decorate()
	expect(node.compile()).toBe(`
let __2: number = 42
let __7: number = 420
__2 = __2 + __7
export default __2
	`.trim())
})



test('Compile file with compound expression.', () => {
	const node = new Parser('42 ^ 2 - 420').parse().decorate()
	expect(node.compile()).toBe(`
let __2: number = 42
let __7: number = 2
__2 = __2 ** __7
let __b: number = 420
__2 = __2 - __b
export default __2
	`.trim())
})

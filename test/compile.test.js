const {default: Util}   = require('../build/class/Util.class.js')
const {default: Parser} = require('../build/class/Parser.class.js')



const preamble = `
type RuntimeInt = number
type Stack = StackItem[]
type StackItem = RuntimeInt|StackFunction
type StackFunction = (x: RuntimeInt, y?: RuntimeInt) => RuntimeInt
const evalStack = (stack: Stack): RuntimeInt => {
	if (!stack.length) throw new Error('empty stack')
	const it: StackItem = stack.pop()!
	return (it instanceof Function) ?
		it(...[...new Array(it.length)].map(() => evalStack(stack)).reverse() as Parameters<StackFunction>) :
		it
}
const ADD: StackFunction = (a, b) => a  + b!
const MUL: StackFunction = (a, b) => a  * b!
const DIV: StackFunction = (a, b) => a  / b!
const EXP: StackFunction = (a, b) => a ** b!
const AFF: StackFunction = (a) => +a
const NEG: StackFunction = (a) => -a
const STACK: Stack = []
`



test('Compile empty file.', () => {
	const node = new Parser('').parse().decorate()
	expect(node.compile()).toBe(Util.dedent(`
export default null
	`))
})



test('Compile file with single token.', () => {
	const node = new Parser('42').parse().decorate()
	expect(node.compile()).toBe(preamble + Util.dedent(`
STACK.push(42)

export default evalStack(STACK)
	`))
})



test('Compile file with simple expression, add.', () => {
	const node = new Parser('42 + 420').parse().decorate()
	expect(node.compile()).toBe(preamble + Util.dedent(`

STACK.push(42)


STACK.push(420)

STACK.push(ADD)

export default evalStack(STACK)

	`))
})



test('Compile file with simple expression, subtract.', () => {
	const node = new Parser('42 - 420').parse().decorate()
	expect(node.compile()).toBe(preamble + Util.dedent(`

STACK.push(42)



STACK.push(420)


STACK.push(NEG)

STACK.push(ADD)

export default evalStack(STACK)

	`))
})



test('Compile file with compound expression.', () => {
	const node = new Parser('42 ^ 2 * 420').parse().decorate()
	expect(node.compile()).toBe(preamble + Util.dedent(`


STACK.push(42)


STACK.push(2)

STACK.push(EXP)


STACK.push(420)

STACK.push(MUL)

export default evalStack(STACK)
	`))
})



test('Compile file with compound expression, grouping.', () => {
	const node = new Parser('42 ^ (2 * 420)').parse().decorate()
	expect(node.compile()).toBe(preamble + Util.dedent(`

STACK.push(42)



STACK.push(2)


STACK.push(420)

STACK.push(MUL)

STACK.push(EXP)

export default evalStack(STACK)
	`))
})

const {default: Util}   = require('../build/class/Util.class.js')
const {default: Parser} = require('../build/class/Parser.class.js')



const preamble = `
type RuntimeInt = number
type Stack = RuntimeInt[]
const ADD = (stack: Stack): void => { const arg2: RuntimeInt = stack.pop() !; const arg1: RuntimeInt = stack.pop() !; stack.push(arg1 +  arg2) }
const MUL = (stack: Stack): void => { const arg2: RuntimeInt = stack.pop() !; const arg1: RuntimeInt = stack.pop() !; stack.push(arg1 *  arg2) }
const DIV = (stack: Stack): void => { const arg2: RuntimeInt = stack.pop() !; const arg1: RuntimeInt = stack.pop() !; stack.push(arg1 /  arg2) }
const EXP = (stack: Stack): void => { const arg2: RuntimeInt = stack.pop() !; const arg1: RuntimeInt = stack.pop() !; stack.push(arg1 ** arg2) }
const NEG = (stack: Stack): void => { stack.push(-stack.pop() !) }
const STACK: Stack = []
`



test('Compile empty file.', () => {
	const node = new Parser('').parse().decorate()
	expect(node.compile()).toBe(Util.dedent(`
export default null
	`))
})



test('Compile file with single token.', () => {
	const outs = ['42', '+42', '-42'].map((src) => new Parser(src).parse().decorate().compile())
	expect(outs).toEqual([`
		STACK.push(42)

		export default STACK.pop()
	`, `
		STACK.push(42)

		export default STACK.pop()
	`, `
		STACK.push(-42)

		export default STACK.pop()
	`].map((out) => preamble + Util.dedent(out)))
})



test('Compile file with simple expression, add.', () => {
	const node = new Parser('42 + 420').parse().decorate()
	expect(node.compile()).toBe(preamble + Util.dedent(`

STACK.push(42)


STACK.push(420)

ADD(STACK)

export default STACK.pop()

	`))
})



test('Compile file with simple expression, subtract.', () => {
	const node = new Parser('42 - 420').parse().decorate()
	expect(node.compile()).toBe(preamble + Util.dedent(`

STACK.push(42)



STACK.push(420)


NEG(STACK)

ADD(STACK)

export default STACK.pop()

	`))
})



test('Compile file with compound expression.', () => {
	const node = new Parser('42 ^ 2 * 420').parse().decorate()
	expect(node.compile()).toBe(preamble + Util.dedent(`


STACK.push(42)


STACK.push(2)

EXP(STACK)


STACK.push(420)

MUL(STACK)

export default STACK.pop()
	`))
})



test('Compile file with compound expression, grouping.', () => {
	const node = new Parser('-(42) ^ +(2 * 420)').parse().decorate()
	expect(node.compile()).toBe(preamble + Util.dedent(`


STACK.push(42)


NEG(STACK)



STACK.push(2)


STACK.push(420)

MUL(STACK)

EXP(STACK)

export default STACK.pop()
	`))
})

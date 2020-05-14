const {default: Util}   = require('../build/class/Util.class.js')
const {default: Parser} = require('../build/class/Parser.class.js')



const preamble = Util.dedent(`
	type Int16 = number
	type OperandStack = Int16[]
	const ADD = (stack: OperandStack): void => { if (stack.length < 2) { throw new Error('Operand stack does not have enough operands.') }; const arg2: Int16 = stack.pop() !; const arg1: Int16 = stack.pop() !; stack.push(arg1 +  arg2) }
	const MUL = (stack: OperandStack): void => { if (stack.length < 2) { throw new Error('Operand stack does not have enough operands.') }; const arg2: Int16 = stack.pop() !; const arg1: Int16 = stack.pop() !; stack.push(arg1 *  arg2) }
	const DIV = (stack: OperandStack): void => { if (stack.length < 2) { throw new Error('Operand stack does not have enough operands.') }; const arg2: Int16 = stack.pop() !; const arg1: Int16 = stack.pop() !; stack.push(arg1 /  arg2) }
	const EXP = (stack: OperandStack): void => { if (stack.length < 2) { throw new Error('Operand stack does not have enough operands.') }; const arg2: Int16 = stack.pop() !; const arg1: Int16 = stack.pop() !; stack.push(arg1 ** arg2) }
	const NEG = (stack: OperandStack): void => { if (stack.length < 1) { throw new Error('Operand stack does not have enough operands.') }; stack.push(-stack.pop() !) }
	const STACK: OperandStack = []
`)



test('Compile empty file.', () => {
	const node = new Parser('').parse().decorate()
	expect(node.compile().print()).toBe(preamble + Util.dedent(`
		export default STACK.pop()
	`))
})



test('Compile file with single token.', () => {
	const outs = ['42', '+42', '-42'].map((src) => new Parser(src).parse().decorate().compile().print())
	expect(outs).toEqual([`
		STACK.push(42)
		export default STACK.pop()
	`, `
		STACK.push(42)
		export default STACK.pop()
	`, `
		STACK.push(-42)
		export default STACK.pop()
	`].map((out) => preamble + Util.dedent(out).trimStart()))
})



test('Compile file with simple expression, add.', () => {
	const node = new Parser('42 + 420').parse().decorate()
	expect(node.compile().print()).toBe(preamble + Util.dedent(`
		STACK.push(42)
		STACK.push(420)
		ADD(STACK)
		export default STACK.pop()
	`).trimStart())
})



test('Compile file with simple expression, subtract.', () => {
	const node = new Parser('42 - 420').parse().decorate()
	expect(node.compile().print()).toBe(preamble + Util.dedent(`
		STACK.push(42)
		STACK.push(420)
		NEG(STACK)
		ADD(STACK)
		export default STACK.pop()
	`).trimStart())
})



test('Compile file with compound expression.', () => {
	const node = new Parser('42 ^ 2 * 420').parse().decorate()
	expect(node.compile().print()).toBe(preamble + Util.dedent(`
		STACK.push(42)
		STACK.push(2)
		EXP(STACK)
		STACK.push(420)
		MUL(STACK)
		export default STACK.pop()
	`).trimStart())
})



test('Compile file with compound expression, grouping.', () => {
	const node = new Parser('-(42) ^ +(2 * 420)').parse().decorate()
	expect(node.compile().print()).toBe(preamble + Util.dedent(`
		STACK.push(42)
		NEG(STACK)
		STACK.push(2)
		STACK.push(420)
		MUL(STACK)
		EXP(STACK)
		export default STACK.pop()
	`).trimStart())
})

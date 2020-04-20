import * as assert from 'assert'

import Util   from '../src/class/Util.class'
import Parser from '../src/class/Parser.class'



export const SemanticNodeGoal_compileOutput = (s: string) => Util.dedent(`
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
	const AFF: StackFunction = (a) => +a
	const NEG: StackFunction = (a) => -a
	const ADD: StackFunction = (a, b) => a  + b!
	const MUL: StackFunction = (a, b) => a  * b!
	const DIV: StackFunction = (a, b) => a  / b!
	const EXP: StackFunction = (a, b) => a ** b!
	const STACK: Stack = []
	${Util.dedent(s)}
	export default evalStack(STACK)
`)



test.skip('Compile file with simple expression, add.', () => {
	assert.strictEqual(new Parser('42 + 420;').parse().decorate().compile(), SemanticNodeGoal_compileOutput(`

STACK.push(42)



STACK.push(420)

STACK.push(ADD)
	`))
})



test.skip('Compile file with simple expression, subtract.', () => {
	assert.strictEqual(new Parser('42 - 420;').parse().decorate().compile(), SemanticNodeGoal_compileOutput(`

STACK.push(42)




STACK.push(420)


STACK.push(NEG)

STACK.push(ADD)
	`))
})



test.skip('Compile file with compound expression.', () => {
	assert.strictEqual(new Parser('42 ^ 2 * 420;').parse().decorate().compile(), SemanticNodeGoal_compileOutput(`


STACK.push(42)



STACK.push(2)

STACK.push(EXP)



STACK.push(420)

STACK.push(MUL)
	`))
})



test.skip('Compile file with compound expression, grouping.', () => {
	assert.strictEqual(new Parser('42 ^ (2 * 420);').parse().decorate().compile(), SemanticNodeGoal_compileOutput(`

STACK.push(42)




STACK.push(2)



STACK.push(420)

STACK.push(MUL)

STACK.push(EXP)
	`))
})

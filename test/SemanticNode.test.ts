import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'

import Util   from '../src/class/Util.class'
import Parser from '../src/class/Parser.class'



describe('SemanticNode', () => {
	describe('#compile', () => {
		const boilerplate = (expected: string) => `
			(module
				${ fs.readFileSync(path.join(__dirname, '../src/exp.wat'), 'utf8') }
				(func (export "run") (result i32)
					${ expected }
				)
			)
		`
		const SemanticNodeGoal_compileOutput = (s: string) => Util.dedent(`
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

		context('SemanticNodeNull', () => {
			it('prints nop.', () => {
				assert.strictEqual(new Parser('').parse().decorate().compile().print(), boilerplate(`nop`))
			})
		})

		context('SemanticNodeStatementEmpty', () => {
			it('outputs nothing.', () => {
				assert.strictEqual(new Parser(';').parse().decorate().compile().print(), boilerplate(`nop`))
			})
		})

		context('SemanticNodeConstant', () => {
			it('pushes the constant onto the stack.', () => {
				const outs = ['42', '+42', '-42'].map((src) => new Parser(src).parse().decorate().compile().print())
				assert.deepStrictEqual(outs, [
					`i32.const 42`,
					`i32.const 42`,
					`i32.const -42`,
				].map(boilerplate))
			})
		})

		context('SemanticNodeExpression', () => {
			specify('ExpressionAdditive ::= ExpressionAdditive "+" ExpressionMultiplicative', () => {
				assert.strictEqual(new Parser('42 + 420;').parse().decorate().compile().print(), boilerplate([
					`i32.const 42`,
					`i32.const 420`,
					`i32.add`,
				].join('\n')))
			})
			specify('ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative', () => {
				assert.strictEqual(new Parser('42 - 420;').parse().decorate().compile().print(), boilerplate([
					`i32.const 42`,
					`i32.const 420`,
					`i32.const -1`,
					`i32.xor`,
					`i32.const 1`,
					`i32.add`,
					`i32.add`,
				].join('\n')))
			})
			specify('compound expression.', () => {
				assert.strictEqual(new Parser('42 ^ 2 * 420;').parse().decorate().compile().print(), boilerplate([
					`i32.const 42`,
					`i32.const 2`,
					`call $exp`,
					`i32.const 420`,
					`i32.mul`,
				].join('\n')))
			})
			specify('compound expression with grouping.', () => {
				assert.strictEqual(new Parser('-(42) ^ +(2 * 420);').parse().decorate().compile(), boilerplate([
					`i32.const 42`,
					`i32.const -1`,
					`i32.xor`,
					`i32.const 1`,
					`i32.add`,
					`i32.const 2`,
					`i32.const 420`,
					`i32.mul`,
					`call $exp`,
				].join('\n')))
			})
		})
	})
})

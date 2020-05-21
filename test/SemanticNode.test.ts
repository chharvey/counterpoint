import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'

import CodeGenerator from '../src/class/CodeGenerator.class'



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

		context('SemanticNodeNull', () => {
			it('prints nothing.', () => {
				assert.strictEqual(new CodeGenerator('').print(), boilerplate('nop'))
			})
		})

		context('SemanticNodeStatementEmpty', () => {
			it('prints nop.', () => {
				assert.strictEqual(new CodeGenerator(';').print(), boilerplate(`nop`))
			})
		})

		context('SemanticNodeConstant', () => {
			it('pushes the constant onto the stack.', () => {
				const outs = ['42;', '+42;', '-42;'].map((src) => new CodeGenerator(src).print())
				assert.deepStrictEqual(outs, [
					`i32.const 42`,
					`i32.const 42`,
					`i32.const -42`,
				].map(boilerplate))
			})
		})

		context('SemanticNodeExpression', () => {
			specify('ExpressionAdditive ::= ExpressionAdditive "+" ExpressionMultiplicative', () => {
				assert.strictEqual(new CodeGenerator('42 + 420;').print(), boilerplate([
					`i32.const 42`,
					`i32.const 420`,
					`i32.add`,
				].join('\n')))
			})
			specify('ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative', () => {
				assert.strictEqual(new CodeGenerator('42 - 420;').print(), boilerplate([
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
				assert.strictEqual(new CodeGenerator('42 ^ 2 * 420;').print(), boilerplate([
					`i32.const 42`,
					`i32.const 2`,
					`call $exp`,
					`i32.const 420`,
					`i32.mul`,
				].join('\n')))
			})
			specify('compound expression with grouping.', () => {
				assert.strictEqual(new CodeGenerator('-(42) ^ +(2 * 420);').print(), boilerplate([
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

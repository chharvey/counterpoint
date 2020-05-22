import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'

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

		context('SemanticNodeNull', () => {
			it('prints nothing.', () => {
				assert.strictEqual(new Parser('').parse().decorate().compile().print(), boilerplate(''))
			})
		})

		context('SemanticNodeStatementEmpty', () => {
			it('prints nop.', () => {
				assert.strictEqual(new Parser(';').parse().decorate().compile().print(), boilerplate(`nop`))
			})
		})

		context('SemanticNodeConstant', () => {
			it('pushes the constant onto the stack.', () => {
				const outs = ['42;', '+42;', '-42;'].map((src) => new Parser(src).parse().decorate().compile().print())
				assert.deepStrictEqual(outs, [
					`i32.const 42`,
					`i32.const 42`,
					`i32.const -42`,
				].map(boilerplate))
			})
		})

		context('SemanticNodeOperation', () => {
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
				assert.strictEqual(new Parser('-(42) ^ +(2 * 420);').parse().decorate().compile().print(), boilerplate([
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

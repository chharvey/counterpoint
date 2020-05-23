import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'

import Parser from '../src/class/Parser.class'
import CodeGenerator from '../src/class/CodeGenerator.class'
import {
	SolidLanguageType,
	SemanticNodeExpression,
	SemanticNodeConstant,
	SemanticNodeIdentifier,
	SemanticNodeTemplate,
	SemanticNodeOperation,
	SemanticNodeGoal,
} from '../src/class/SemanticNode.class'



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
			it('prints nop.', () => {
				assert.strictEqual(new CodeGenerator('').print(), boilerplate(`nop`))
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

		context('SemanticNodeOperation', () => {
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


	context('SemanticNodeExpression', () => {
		describe('#type', () => {
			it('returns `Integer` for SemanticNodeConstant with number value.', () => {
				assert.strictEqual(((new Parser(`42;`).parse().decorate() as SemanticNodeGoal)
					.children[0]
					.children[0]
					.children[0] as SemanticNodeConstant).type(), SolidLanguageType.NUMBER)
			})
			it('throws for identifiers.', () => {
				assert.throws(() => ((new Parser(`x;`).parse().decorate() as SemanticNodeGoal)
					.children[0]
					.children[0]
					.children[0] as SemanticNodeIdentifier).type(), /Not yet supported./)
			})
			it('returns `String` for SemanticNodeConstant with string value.', () => {
				const nodes: SemanticNodeExpression[] = [
					(new Parser(`'42';`).parse().decorate() as SemanticNodeGoal)
						.children[0]
						.children[0]
						.children[0] as SemanticNodeConstant,
					(new Parser(`'''42''';`).parse().decorate() as SemanticNodeGoal)
						.children[0]
						.children[0]
						.children[0] as SemanticNodeTemplate,
					(new Parser(`'''the answer is {{ 7 * 3 * 2 }} but what is the question?''';`).parse().decorate() as SemanticNodeGoal)
						.children[0]
						.children[0]
						.children[0] as SemanticNodeTemplate,
				]
				nodes.forEach((node) => {
					assert.strictEqual(node.type(), SolidLanguageType.STRING)
				})
			})
			it('returns `Integer` or any operation of numbers.', () => {
				assert.strictEqual(((new Parser(`7 * 3 * 2;`).parse().decorate() as SemanticNodeGoal)
					.children[0]
					.children[0]
					.children[0] as SemanticNodeOperation).type(), SolidLanguageType.NUMBER)
			})
			it('throws for operation of non-numbers.', () => {
				assert.throws(() => ((new Parser(`'hello' + 5;`).parse().decorate() as SemanticNodeGoal)
					.children[0]
					.children[0]
					.children[0] as SemanticNodeOperation).type(), TypeError)
			})
		})
	})
})

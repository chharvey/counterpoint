import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'

import {CONFIG_DEFAULT} from '../'
import Util from '../src/class/Util.class'
import Dev from '../src/class/Dev.class'
import Parser from '../src/class/Parser.class'
import CodeGenerator from '../src/class/CodeGenerator.class'
import {
	SolidLanguageType,
	SemanticNodeExpression,
	SemanticNodeConstant,
	SemanticNodeIdentifier,
	SemanticNodeTemplate,
	SemanticNodeOperation,
	SemanticNodeStatementList,
	SemanticNodeGoal,
} from '../src/class/SemanticNode.class'



describe('SemanticNode', () => {
	describe('#build', () => {
		const boilerplate = (expected: string) => `
			(module
				${ fs.readFileSync(path.join(__dirname, '../src/neg.wat'), 'utf8') }
				${ fs.readFileSync(path.join(__dirname, '../src/exp.wat'), 'utf8') }
				(func (export "run") (result i32)
					${ Util.dedent(expected).trim().replace(/\n\t+\(/g, ' \(').replace(/\n\t*\)/g, '\)') }
				)
			)
		`

		context('SemanticNodeGoal ::= SOT EOT', () => {
			it('prints nop.', () => {
				assert.strictEqual(new CodeGenerator('', CONFIG_DEFAULT).print(), boilerplate(`(nop)`))
			})
		})

		context('SemanticNodeStatement ::= ";"', () => {
			it('prints nop.', () => {
				assert.strictEqual(new CodeGenerator(';', CONFIG_DEFAULT).print(), boilerplate(`(nop)`))
			})
		})

		context('SemanticNodeConstant', () => {
			it('pushes the constant onto the stack.', () => {
				const outs = ['42;', '+42;', '-42;'].map((src) => new CodeGenerator(src, CONFIG_DEFAULT).print())
				assert.deepStrictEqual(outs, [
					`(i32.const 42)`,
					`(i32.const 42)`,
					`(i32.const -42)`,
				].map(boilerplate))
			})
		})

		context('SemanticNodeOperation', () => {
			specify('ExpressionAdditive ::= ExpressionAdditive "+" ExpressionMultiplicative', () => {
				assert.strictEqual(new CodeGenerator('42 + 420;', CONFIG_DEFAULT).print(), boilerplate(`
					(i32.const ${ 42 + 420 })
				`))
			})
			specify('ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative', () => {
				assert.strictEqual(new CodeGenerator('42 - 420;', CONFIG_DEFAULT).print(), boilerplate(`
					(i32.const ${ 42 + -420 })
				`))
			})
			specify('ExpressionMultiplicative ::= ExpressionMultiplicative "/" ExpressionExponential', () => {
				assert.strictEqual(new CodeGenerator('126 / 3;', CONFIG_DEFAULT).print(), boilerplate(`
					(i32.const ${ Math.trunc(126 / 3) })
				`))
				assert.strictEqual(new CodeGenerator('-126 / 3;', CONFIG_DEFAULT).print(), boilerplate(`
					(i32.const ${ Math.trunc(-126 / 3) })
				`))
				assert.strictEqual(new CodeGenerator('126 / -3;', CONFIG_DEFAULT).print(), boilerplate(`
					(i32.const ${ Math.trunc(126 / -3) })
				`))
				assert.strictEqual(new CodeGenerator('-126 / -3;', CONFIG_DEFAULT).print(), boilerplate(`
					(i32.const ${ Math.trunc(-126 / -3) })
				`))
				assert.strictEqual(new CodeGenerator('200 / 3;', CONFIG_DEFAULT).print(), boilerplate(`
					(i32.const ${ Math.trunc(200 / 3) })
				`))
				assert.strictEqual(new CodeGenerator('200 / -3;', CONFIG_DEFAULT).print(), boilerplate(`
					(i32.const ${ Math.trunc(200 / -3) })
				`))
				assert.strictEqual(new CodeGenerator('-200 / 3;', CONFIG_DEFAULT).print(), boilerplate(`
					(i32.const ${ Math.trunc(-200 / 3) })
				`))
				assert.strictEqual(new CodeGenerator('-200 / -3;', CONFIG_DEFAULT).print(), boilerplate(`
					(i32.const ${ Math.trunc(-200 / -3) })
				`))
			})
			specify('compound expression.', () => {
				assert.strictEqual(new CodeGenerator('42 ^ 2 * 420;', CONFIG_DEFAULT).print(), boilerplate(`
					(i32.const ${ (42 ** 2 * 420) % (2 ** 16) })
				`))
			})
			specify('overflow.', () => {
				assert.strictEqual(new CodeGenerator('2 ^ 15 + 2 ^ 14;', CONFIG_DEFAULT).print(), boilerplate(`
					(i32.const ${ -(2 ** 14) })
				`))
				assert.strictEqual(new CodeGenerator('-(2 ^ 14) - 2 ^ 15;', CONFIG_DEFAULT).print(), boilerplate(`
					(i32.const ${ 2 ** 14 })
				`))
			})
			specify('compound expression with grouping.', () => {
				assert.strictEqual(new CodeGenerator('-(5) ^ +(2 * 3);', CONFIG_DEFAULT).print(), boilerplate(`
					(i32.const ${(-(5)) ** +(2 * 3)})
				`))
			})
		})
	})


	context('SemanticNodeExpression', () => {
		describe('#type', () => {
			it('returns `Integer` for SemanticNodeConstant with number value.', () => {
				assert.strictEqual((((new Parser(`42;`, CONFIG_DEFAULT).parse().decorate() as SemanticNodeGoal)
					.children[0] as SemanticNodeStatementList)
					.children[0]
					.children[0] as SemanticNodeConstant).type(), SolidLanguageType.NUMBER)
			})
			Dev.supports('variables') && it('throws for identifiers.', () => {
				assert.throws(() => (((new Parser(`x;`, CONFIG_DEFAULT).parse().decorate() as SemanticNodeGoal)
					.children[0] as SemanticNodeStatementList)
					.children[0]
					.children[0] as SemanticNodeIdentifier).type(), /Not yet supported./)
			})
			it('returns `String` for SemanticNodeConstant with string value.', () => {
				;[
					...(Dev.supports('literalString') ? [
						((new Parser(`'42';`, CONFIG_DEFAULT).parse().decorate() as SemanticNodeGoal)
							.children[0] as SemanticNodeStatementList)
							.children[0]
							.children[0] as SemanticNodeConstant,
					] : []),
					...(Dev.supports('literalTemplate') ? [
						((new Parser(`'''42''';`, CONFIG_DEFAULT).parse().decorate() as SemanticNodeGoal)
							.children[0] as SemanticNodeStatementList)
							.children[0]
							.children[0] as SemanticNodeTemplate,
						((new Parser(`'''the answer is {{ 7 * 3 * 2 }} but what is the question?''';`, CONFIG_DEFAULT).parse().decorate() as SemanticNodeGoal)
							.children[0] as SemanticNodeStatementList)
							.children[0]
							.children[0] as SemanticNodeTemplate,
					] : []),
				].forEach((node) => {
					assert.strictEqual(node.type(), SolidLanguageType.STRING)
				})
			})
			it('returns `Integer` or any operation of numbers.', () => {
				assert.strictEqual((((new Parser(`7 * 3 * 2;`, CONFIG_DEFAULT).parse().decorate() as SemanticNodeGoal)
					.children[0] as SemanticNodeStatementList)
					.children[0]
					.children[0] as SemanticNodeOperation).type(), SolidLanguageType.NUMBER)
			})
			it('throws for operation of non-numbers.', () => {
				Dev.supports('literalString') && assert.throws(() => (((new Parser(`'hello' + 5;`, CONFIG_DEFAULT).parse().decorate() as SemanticNodeGoal)
					.children[0] as SemanticNodeStatementList)
					.children[0]
					.children[0] as SemanticNodeOperation).type(), TypeError)
			})
		})
	})
})

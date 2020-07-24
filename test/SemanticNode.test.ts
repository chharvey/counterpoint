import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'

import {CONFIG_DEFAULT} from '../'
import SolidNull from '../src/vm/Null.class'
import Util from '../src/class/Util.class'
import Dev from '../src/class/Dev.class'
import Parser from '../src/class/Parser.class'
import CodeGenerator from '../src/class/CodeGenerator.class'
import type {
	ParseNodeExpression,
	ParseNodeStatement,
	ParseNodeGoal__0__List,
} from '../src/class/ParseNode.class'
import {
	SolidLanguageType,
	SemanticNodeExpression,
	SemanticNodeConstant,
	SemanticNodeIdentifier,
	SemanticNodeTemplate,
	SemanticNodeOperation,
	SemanticNodeStatementExpression,
} from '../src/class/SemanticNode.class'



describe('SemanticNode', () => {
	describe('#build', () => {
		const boilerplate = (expected: string) => `
			(module
				${ fs.readFileSync(path.join(__dirname, '../src/neg.wat'), 'utf8') }
				${ fs.readFileSync(path.join(__dirname, '../src/exp.wat'), 'utf8') }
				(func (export "run") (result i32)
					${ Util.dedent(expected).trim().replace(/\n\t*\(/g, ' \(').replace(/\n\t*\)/g, '\)') }
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
				assert.deepStrictEqual([
					'null;',
					'42;',
					'+42;',
					'-42;',
				].map((src) => new CodeGenerator(src, CONFIG_DEFAULT).print()), [
					`(i32.const 0)`,
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
				assert.deepStrictEqual([
					'126 / 3;',
					'-126 / 3;',
					'126 / -3;',
					'-126 / -3;',
					'200 / 3;',
					'200 / -3;',
					'-200 / 3;',
					'-200 / -3;',
				].map((src) => new CodeGenerator(src, CONFIG_DEFAULT).print()), [
					126 / 3,
					-126 / 3,
					126 / -3,
					-126 / -3,
					200 / 3,
					200 / -3,
					-200 / 3,
					-200 / -3,
				].map((v) => boilerplate(`
					(i32.const ${ Math.trunc(v) })
				`)))
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
					(i32.const ${ (-(5)) ** +(2 * 3) })
				`))
			})
			specify('multiple statements.', () => {
				assert.strictEqual(new CodeGenerator('42; 420;', CONFIG_DEFAULT).print(), boilerplate(`
					(i32.const 42)
					(i32.const 420)
				`))
			})
		})
	})


	context('SemanticNodeExpression', () => {
		describe('#type', () => {
			it('returns `Null` for SemanticNodeConstant with null value.', () => {
				assert.strictEqual(((new Parser(`null;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeConstant).type(), SolidNull)
			})
			it('returns `Integer` for SemanticNodeConstant with number value.', () => {
				assert.strictEqual(((new Parser(`42;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeConstant).type(), SolidLanguageType.NUMBER)
			})
			Dev.supports('variables') && it('throws for identifiers.', () => {
				assert.throws(() => ((new Parser(`x;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeIdentifier).type(), /Not yet supported./)
			})
			it('returns `String` for SemanticNodeConstant with string value.', () => {
				;[
					...(Dev.supports('literalString') ? [
						(new Parser(`'42';`, CONFIG_DEFAULT).parse().decorate()
							.children[0] as SemanticNodeStatementExpression)
							.children[0] as SemanticNodeConstant,
					] : []),
					...(Dev.supports('literalTemplate') ? [
						(new Parser(`'''42''';`, CONFIG_DEFAULT).parse().decorate()
							.children[0] as SemanticNodeStatementExpression)
							.children[0] as SemanticNodeTemplate,
						(new Parser(`'''the answer is {{ 7 * 3 * 2 }} but what is the question?''';`, CONFIG_DEFAULT).parse().decorate()
							.children[0] as SemanticNodeStatementExpression)
							.children[0] as SemanticNodeTemplate,
					] : []),
				].forEach((node) => {
					assert.strictEqual(node.type(), SolidLanguageType.STRING)
				})
			})
			it('returns `Integer` or any operation of numbers.', () => {
				assert.strictEqual(((new Parser(`7 * 3 * 2;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation).type(), SolidLanguageType.NUMBER)
			})
			it('throws for operation of non-numbers.', () => {
				assert.throws(() => ((new Parser(`null + 5;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation).type(), TypeError)
				Dev.supports('literalString') && assert.throws(() => ((new Parser(`'hello' + 5;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation).type(), TypeError)
			})
		})

		describe('#assess', () => {
			it('computes the value of constant null expression.', () => {
				const values: (number | SemanticNodeExpression | SolidNull)[] = [
					'null;',
				].map((src) => (((new Parser(src, CONFIG_DEFAULT).parse()
					.children[1] as ParseNodeGoal__0__List)
					.children[0] as ParseNodeStatement)
					.children[0] as ParseNodeExpression
				).decorate().assess().value)
				values.forEach((value) => {
					assert.strictEqual(value, SolidNull.NULL)
				})
			})
			it('computes the value of a constant numeric expression.', () => {
				const values: (number | SemanticNodeExpression | SolidNull)[] = [
					'42 + 420;',
					'42 - 420;',
					'126 / 3;',
					'-126 / 3;',
					'126 / -3;',
					'-126 / -3;',
					'200 / 3;',
					'200 / -3;',
					'-200 / 3;',
					'-200 / -3;',
					'42 ^ 2 * 420;',
					'2 ^ 15 + 2 ^ 14;',
					'-(2 ^ 14) - 2 ^ 15;',
					'-(5) ^ +(2 * 3);',
				].map((src) => (((new Parser(src, CONFIG_DEFAULT).parse()
					.children[1] as ParseNodeGoal__0__List)
					.children[0] as ParseNodeStatement)
					.children[0] as ParseNodeExpression
				).decorate().assess().value)
				values.forEach((value) => {
					assert.strictEqual(typeof value, 'number')
				})
				assert.deepStrictEqual(values, [
					42 + 420,
					42 + -420,
					126 / 3,
					-126 / 3,
					126 / -3,
					-126 / -3,
					Math.trunc(200 / 3),
					Math.trunc(200 / -3),
					Math.trunc(-200 / 3),
					Math.trunc(-200 / -3),
					(42 ** 2 * 420) % (2 ** 16),
					-(2 ** 14),
					2 ** 14,
					(-(5)) ** +(2 * 3),
				])
			})
		})
	})
})

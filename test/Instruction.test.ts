import * as fs from 'fs'
import * as path from 'path'
import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../src/SolidConfig'
import Parser from '../src/class/Parser.class'
import CodeGenerator from '../src/vm/Builder.class'
import {Punctuator} from '../src/class/Token.class'
import {
	InstructionNone,
	InstructionConst,
	InstructionUnop,
	InstructionBinop,
	InstructionModule,
} from '../src/vm/Instruction.class'



describe('Instruction', () => {
	describe('#toString', () => {
		context('InstructionConst', () => {
			it('pushes the constant onto the stack.', () => {
				assert.deepStrictEqual([
					0,
					0,
					1,
					42,
					42,
					-42,
					  42 + 420,
					 126 /   3,
					-126 /   3,
					 126 /  -3,
					-126 /  -3,
					 200 /   3,
					 200 /  -3,
					-200 /   3,
					-200 /  -3,
				].map((v) => new InstructionConst(v).toString()), [
					`(i32.const 0)`,
					`(i32.const 0)`,
					`(i32.const 1)`,
					`(i32.const 42)`,
					`(i32.const 42)`,
					`(i32.const -42)`,
					`(i32.const ${   42 + 420 })`,
					`(i32.const ${  126 /   3 })`,
					`(i32.const ${ -126 /   3 })`,
					`(i32.const ${  126 /  -3 })`,
					`(i32.const ${ -126 /  -3 })`,
					`(i32.const ${  200 /   3 })`,
					`(i32.const ${  200 /  -3 })`,
					`(i32.const ${ -200 /   3 })`,
					`(i32.const ${ -200 /  -3 })`,
				])
			})
		})

		context('InstructionUnop', () => {
			it('performs a unary operation.', () => {
				assert.strictEqual(new InstructionUnop(
					Punctuator.AFF,
					new InstructionConst(42),
				).toString(), `(nop ${ new InstructionConst(42).toString() })`)
				assert.strictEqual(new InstructionUnop(
					Punctuator.NEG,
					new InstructionConst(42),
				).toString(), `(call $neg ${ new InstructionConst(42).toString() })`)
				assert.throws(() => new InstructionUnop(
					Punctuator.MUL,
					new InstructionConst(42),
				).toString(), TypeError)
			})
		})

		context('InstructionBinop', () => {
			it('performs a binary operation.', () => {
				assert.strictEqual(new InstructionBinop(
					Punctuator.MUL,
					new InstructionConst(21),
					new InstructionConst(2),
				).toString(), `(i32.mul ${ new InstructionConst(21).toString() } ${ new InstructionConst(2).toString() })`)
			})
		})

		context('InstructionModule', () => {
			it('creates a program.', () => {
				const i32_neg: string = fs.readFileSync(path.join(__dirname, '../src/neg.wat'), 'utf8')
				const i32_exp: string = fs.readFileSync(path.join(__dirname, '../src/exp.wat'), 'utf8')
				const mods: (InstructionNone | InstructionModule)[] = [
					``,
					`;`,
				].map((src) => {
					const srcs: [string, SolidConfig] = [src, CONFIG_DEFAULT]
					return new Parser(...srcs).parse().decorate().build(new CodeGenerator(...srcs))
				})
				assert.ok(mods[0] instanceof InstructionNone)
				assert.strictEqual(mods[0].toString(), ``)
				assert.ok(mods[1] instanceof InstructionModule)
				assert.deepStrictEqual(mods[1], new InstructionModule([
					i32_neg,
					i32_exp,
					new InstructionNone(),
				]))
				assert.strictEqual(mods[1].toString().trim().replace(/\n\t+/g, '\n'), `
					(module
						${ i32_neg }
						${ i32_exp }
						${ new InstructionNone() }
					)
				`.trim().replace(/\n\t+/g, '\n'))
			})
		})
	})
})

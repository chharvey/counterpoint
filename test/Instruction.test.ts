import * as fs from 'fs'
import * as path from 'path'
import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../src/SolidConfig'
import Parser from '../src/class/Parser.class'
import Builder from '../src/vm/Builder.class'
import SolidLanguageValue, {SolidNull, SolidBoolean} from '../src/vm/SolidLanguageValue.class'
import {
	Operator,
	InstructionNone,
	InstructionConst,
	InstructionUnop,
	InstructionBinop,
	InstructionCond,
	InstructionModule,
} from '../src/vm/Instruction.class'
import {
	instructionConstInt,
	instructionConstFloat,
} from './helpers'



describe('Instruction', () => {
	describe('.constructor', () => {
		context('InstructionBinop', () => {
			it('throws when operands are a mix of ints and floats.', () => {
				assert.throws(() => new InstructionBinop(
					Operator.MUL,
					instructionConstInt(5n),
					instructionConstFloat(2.5),
				), TypeError)
			})
		})
		context('InstructionCond', () => {
			it('throws when branches are a mix of ints and floats.', () => {
				assert.throws(() => new InstructionCond(
					instructionConstInt(0n),
					instructionConstInt(2n),
					instructionConstFloat(3.3),
				), TypeError)
			})
		})
	})

	describe('#toString', () => {
		context('InstructionConst', () => {
			it('pushes the constant null or boolean onto the stack.', () => {
				const values: SolidLanguageValue[] = [
					SolidNull.NULL,
					SolidBoolean.FALSE,
					SolidBoolean.TRUE,
				]
				assert.deepStrictEqual(
					values.map((x) => new InstructionConst(x).toString()),
					[
						0,
						0,
						1,
					].map((x) => `(i32.const ${ x })`),
				)
			})
			it('pushes the constant integer onto the stack.', () => {
				const values: number[] = [
					0,
					0,
					1,
					42,
					42,
					-42,
					  42 + 420,
					Math.trunc( 126 /   3),
					Math.trunc(-126 /   3),
					Math.trunc( 126 /  -3),
					Math.trunc(-126 /  -3),
					Math.trunc( 200 /   3),
					Math.trunc( 200 /  -3),
					Math.trunc(-200 /   3),
					Math.trunc(-200 /  -3),
				]
				assert.deepStrictEqual(
					values.map((x) => instructionConstInt(BigInt(x)).toString()),
					values.map((x) => `(i32.const ${ x })`),
				)
			})
			it('pushes the constant float onto the stack.', () => {
				const values: number[] = [
					55, -55, 33, -33, 2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
				]
				assert.deepStrictEqual(
					values.map((x) => instructionConstFloat(x).toString()),
					values.map((x) => `(f64.const ${ x })`),
				)
			})
		})

		context('InstructionUnop', () => {
			it('performs a unary operation.', () => {
				assert.strictEqual(new InstructionUnop(
					Operator.AFF,
					instructionConstInt(42n),
				).toString(), `(nop ${ instructionConstInt(42n) })`)
				assert.strictEqual(new InstructionUnop(
					Operator.NEG,
					instructionConstInt(42n),
				).toString(), `(call $neg ${ instructionConstInt(42n) })`)
				assert.throws(() => new InstructionUnop(
					Operator.MUL,
					instructionConstInt(42n),
				).toString(), TypeError)
			})
		})

		context('InstructionBinop', () => {
			it('performs a binary operation.', () => {
				assert.strictEqual(new InstructionBinop(
					Operator.MUL,
					instructionConstInt(21n),
					instructionConstInt(2n),
				).toString(), `(i32.mul ${ instructionConstInt(21n) } ${ instructionConstInt(2n) })`)
				assert.strictEqual(new InstructionBinop(
					Operator.ADD,
					instructionConstFloat(30.1),
					instructionConstFloat(18.1),
				).toString(), `(f64.add ${ instructionConstFloat(30.1) } ${ instructionConstFloat(18.1) })`)
			})
		})

		context('InstructionCond', () => {
			it('performs a conditional operation.', () => {
				assert.strictEqual(new InstructionCond(
					instructionConstInt(1n),
					instructionConstInt(2n),
					instructionConstInt(3n),
				).toString(), `(if (result i32) ${ instructionConstInt(1n) } (then ${ instructionConstInt(2n) }) (else ${ instructionConstInt(3n) }))`)
				assert.strictEqual(new InstructionCond(
					instructionConstInt(0n),
					instructionConstFloat(2.2),
					instructionConstFloat(3.3),
				).toString(), `(if (result f64) ${ instructionConstInt(0n) } (then ${ instructionConstFloat(2.2) }) (else ${ instructionConstFloat(3.3) }))`)
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
					return new Parser(...srcs).parse().decorate().build(new Builder(...srcs))
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

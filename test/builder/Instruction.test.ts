import * as fs from 'fs'
import * as path from 'path'
import * as assert from 'assert'

import Operator from '../../src/enum/Operator.enum'
import SolidConfig, {CONFIG_DEFAULT} from '../../src/SolidConfig'
import {
	Parser,
} from '../../src/parser'
import {
	Builder,
	InstructionNone,
	InstructionGet,
	InstructionTee,
	InstructionUnop,
	InstructionBinop,
	InstructionCond,
	InstructionModule,
} from '../../src/builder/'
import {
	instructionConstInt,
	instructionConstFloat,
} from '../helpers'



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
				assert.deepStrictEqual([
					new InstructionUnop(Operator.NOT, instructionConstInt(0n)),
					new InstructionUnop(Operator.NOT, instructionConstInt(42n)),
					new InstructionUnop(Operator.NOT, instructionConstFloat(0.0)),
					new InstructionUnop(Operator.NOT, instructionConstFloat(4.2)),
					new InstructionUnop(Operator.EMP, instructionConstInt(0n)),
					new InstructionUnop(Operator.EMP, instructionConstInt(42n)),
					new InstructionUnop(Operator.EMP, instructionConstFloat(0.0)),
					new InstructionUnop(Operator.EMP, instructionConstFloat(4.2)),
					new InstructionUnop(Operator.NEG, instructionConstInt(42n)),
				].map((inst) => inst.toString()), [
					`(call $inot ${ instructionConstInt(0n) })`,
					`(call $inot ${ instructionConstInt(42n) })`,
					`(call $fnot (f64.const 0))`,
					`(call $fnot (f64.const 4.2))`,
					`(call $iemp ${ instructionConstInt(0n) })`,
					`(call $iemp ${ instructionConstInt(42n) })`,
					`(call $femp ${ instructionConstFloat(0.0) })`,
					`(call $femp ${ instructionConstFloat(4.2) })`,
					`(call $neg ${ instructionConstInt(42n) })`,
				])
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
				assert.strictEqual(new InstructionBinop(
					Operator.AND,
					instructionConstInt(30n),
					instructionConstInt(18n),
				).toString(), ((varname) => `(local ${ varname } i32) ${ new InstructionCond(
					new InstructionUnop(Operator.NOT, new InstructionUnop(Operator.NOT, new InstructionTee(varname, instructionConstInt(30n)))),
					instructionConstInt(18n),
					new InstructionGet(varname, false),
				) }`)('$operand0'))
				assert.strictEqual(new InstructionBinop(
					Operator.OR,
					instructionConstFloat(30.1),
					instructionConstFloat(18.1),
				).toString(), ((varname) => `(local ${ varname } f64) ${ new InstructionCond(
					new InstructionUnop(Operator.NOT, new InstructionUnop(Operator.NOT, new InstructionTee(varname, instructionConstFloat(30.1)))),
					new InstructionGet(varname, true),
					instructionConstFloat(18.1),
				) }`)('$operand0'))
				assert.strictEqual(new InstructionBinop(
					Operator.LT,
					instructionConstInt(30n),
					instructionConstInt(18n),
				).toString(), `(i32.lt_s ${ instructionConstInt(30n) } ${ instructionConstInt(18n) })`)
				assert.strictEqual(new InstructionBinop(
					Operator.GE,
					instructionConstFloat(30.1),
					instructionConstFloat(18.1),
				).toString(), `(f64.ge ${ instructionConstFloat(30.1) } ${ instructionConstFloat(18.1) })`)
				assert.strictEqual(new InstructionBinop(
					Operator.IS,
					instructionConstInt(30n),
					instructionConstInt(18n),
				).toString(), `(i32.eq ${ instructionConstInt(30n) } ${ instructionConstInt(18n) })`)
				assert.strictEqual(new InstructionBinop(
					Operator.IS,
					instructionConstFloat(30.1),
					instructionConstFloat(18.1),
				).toString(), `(call $fis ${ instructionConstFloat(30.1) } ${ instructionConstFloat(18.1) })`)
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
					...Builder.IMPORTS,
					new InstructionNone(),
				]))
			})
		})
	})
})

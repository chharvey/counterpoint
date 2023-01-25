import * as assert from 'assert'
import {
	Operator,
	INST,
} from '../../src/index.js';
import {
	instructionConstInt,
	instructionConstFloat,
} from '../helpers.js';



describe('Instruction', () => {
	describe('.constructor', () => {
		context('InstructionBinop', () => {
			it('throws when operands are a mix of ints and floats.', () => {
				assert.throws(() => new INST.InstructionBinopArithmetic(
					Operator.MUL,
					instructionConstInt(5n),
					instructionConstFloat(2.5),
				), TypeError)
				assert.throws(() => new INST.InstructionBinopComparative(
					Operator.IS,
					instructionConstInt(5n),
					instructionConstFloat(2.5),
				), TypeError);
				assert.throws(() => new INST.InstructionBinopLogical(
					-1,
					Operator.AND,
					instructionConstInt(5n),
					instructionConstFloat(2.5),
				), TypeError);
			})
		})
		context('InstructionCond', () => {
			it('throws when branches are a mix of ints and floats.', () => {
				assert.throws(() => new INST.InstructionCond(
					instructionConstInt(0n),
					instructionConstInt(2n),
					instructionConstFloat(3.3),
				), TypeError)
			})
		})
	})

	describe('#toString', () => {
		specify('InstructionGlobal', () => {
			const expr: INST.InstructionConst = instructionConstInt(42n);
			assert.strictEqual(new INST.InstructionGlobalSet(0x100n, expr)  .toString(), `(global.set $glb100 ${ instructionConstInt(42n) })`);
			assert.strictEqual(new INST.InstructionGlobalGet(0x100n, false) .toString(), `(global.get $glb100)`);
		});

		specify('InstructionLocal', () => {
			const expr: INST.InstructionConst = instructionConstInt(42n);
			assert.strictEqual(new INST.InstructionLocalSet(0, expr)  .toString(), `(local.set $var0 ${ instructionConstInt(42n) })`);
			assert.strictEqual(new INST.InstructionLocalGet(0, false) .toString(), `(local.get $var0)`);
			assert.strictEqual(new INST.InstructionLocalTee(1, expr)  .toString(), `(local.tee $var1 ${ instructionConstInt(42n) })`);
		})

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
					values.map((x) => `(f64.const ${ x }${ (x % 1 === 0) ? '.0' : '' })`),
				)
			})
			it('prints Float64 negative zero correctly.', () => {
				assert.strictEqual(instructionConstFloat(-0.0).toString(), `(f64.const -0.0)`)
			})
		})

		context('InstructionUnop', () => {
			it('performs a unary operation.', () => {
				assert.deepStrictEqual([
					new INST.InstructionUnop(Operator.NOT, instructionConstInt(0n)),
					new INST.InstructionUnop(Operator.NOT, instructionConstInt(42n)),
					new INST.InstructionUnop(Operator.NOT, instructionConstFloat(0.0)),
					new INST.InstructionUnop(Operator.NOT, instructionConstFloat(4.2)),
					new INST.InstructionUnop(Operator.EMP, instructionConstInt(0n)),
					new INST.InstructionUnop(Operator.EMP, instructionConstInt(42n)),
					new INST.InstructionUnop(Operator.EMP, instructionConstFloat(0.0)),
					new INST.InstructionUnop(Operator.EMP, instructionConstFloat(4.2)),
					new INST.InstructionUnop(Operator.NEG, instructionConstInt(42n)),
				].map((inst) => inst.toString()), [
					`(call $inot ${ instructionConstInt(0n) })`,
					`(call $inot ${ instructionConstInt(42n) })`,
					`(call $fnot ${ instructionConstFloat(0.0) })`,
					`(call $fnot ${ instructionConstFloat(4.2) })`,
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
				assert.strictEqual(new INST.InstructionBinopArithmetic(
					Operator.MUL,
					instructionConstInt(21n),
					instructionConstInt(2n),
				).toString(), `(i32.mul ${ instructionConstInt(21n) } ${ instructionConstInt(2n) })`)
				assert.strictEqual(new INST.InstructionBinopArithmetic(
					Operator.ADD,
					instructionConstFloat(30.1),
					instructionConstFloat(18.1),
				).toString(), `(f64.add ${ instructionConstFloat(30.1) } ${ instructionConstFloat(18.1) })`)
				assert.strictEqual(new INST.InstructionBinopComparative(
					Operator.LT,
					instructionConstInt(30n),
					instructionConstInt(18n),
				).toString(), `(i32.lt_s ${ instructionConstInt(30n) } ${ instructionConstInt(18n) })`)
				assert.strictEqual(new INST.InstructionBinopComparative(
					Operator.GE,
					instructionConstFloat(30.1),
					instructionConstFloat(18.1),
				).toString(), `(f64.ge ${ instructionConstFloat(30.1) } ${ instructionConstFloat(18.1) })`)
				assert.strictEqual(new INST.InstructionBinopEquality(
					Operator.ID,
					instructionConstInt(30n),
					instructionConstInt(18n),
				).toString(), `(i32.eq ${ instructionConstInt(30n) } ${ instructionConstInt(18n) })`)
				assert.strictEqual(new INST.InstructionBinopEquality(
					Operator.ID,
					instructionConstFloat(30.1),
					instructionConstFloat(18.1),
				).toString(), `(call $fid ${ instructionConstFloat(30.1) } ${ instructionConstFloat(18.1) })`)
				assert.strictEqual(new INST.InstructionBinopEquality(
					Operator.ID,
					instructionConstInt(30n),
					instructionConstFloat(18.1),
				).toString(), `(call $i_f_id ${ instructionConstInt(30n) } ${ instructionConstFloat(18.1) })`)
				assert.strictEqual(new INST.InstructionBinopEquality(
					Operator.ID,
					instructionConstFloat(18.1),
					instructionConstInt(30n),
				).toString(), `(call $f_i_id ${ instructionConstFloat(18.1) } ${ instructionConstInt(30n) })`)
				assert.strictEqual(new INST.InstructionBinopEquality(
					Operator.EQ,
					instructionConstInt(30n),
					instructionConstFloat(18.1),
				).toString(), `(call $i_f_id ${ instructionConstInt(30n) } ${ instructionConstFloat(18.1) })`)
				assert.strictEqual(new INST.InstructionBinopEquality(
					Operator.EQ,
					instructionConstFloat(18.1),
					instructionConstInt(30n),
				).toString(), `(call $f_i_id ${ instructionConstFloat(18.1) } ${ instructionConstInt(30n) })`)
			});
			it('creates variables for logical operations.', () => {
				assert.strictEqual(new INST.InstructionBinopLogical(
					0,
					Operator.AND,
					instructionConstInt(30n),
					instructionConstInt(18n),
				).toString(), new INST.InstructionCond(
					new INST.InstructionUnop(Operator.NOT, new INST.InstructionUnop(Operator.NOT, new INST.InstructionLocalTee(0, instructionConstInt(30n)))),
					instructionConstInt(18n),
					new INST.InstructionLocalGet(0, false),
				).toString());
				assert.strictEqual(new INST.InstructionBinopLogical(
					3,
					Operator.OR,
					instructionConstFloat(30.1),
					instructionConstFloat(18.1),
				).toString(), new INST.InstructionCond(
					new INST.InstructionUnop(Operator.NOT, new INST.InstructionUnop(Operator.NOT, new INST.InstructionLocalTee(3, instructionConstFloat(30.1)))),
					new INST.InstructionLocalGet(3, true),
					instructionConstFloat(18.1),
				).toString());
			})
		})

		context('InstructionCond', () => {
			it('performs a conditional operation.', () => {
				assert.strictEqual(new INST.InstructionCond(
					instructionConstInt(1n),
					instructionConstInt(2n),
					instructionConstInt(3n),
				).toString(), `(if (result i32) ${ instructionConstInt(1n) } (then ${ instructionConstInt(2n) }) (else ${ instructionConstInt(3n) }))`)
				assert.strictEqual(new INST.InstructionCond(
					instructionConstInt(0n),
					instructionConstFloat(2.2),
					instructionConstFloat(3.3),
				).toString(), `(if (result f64) ${ instructionConstInt(0n) } (then ${ instructionConstFloat(2.2) }) (else ${ instructionConstFloat(3.3) }))`)
			})
		})

		specify('InstructionDeclareGlobal', () => {
			const expr: INST.InstructionConst = instructionConstInt(42n);
			assert.strictEqual(
				new INST.InstructionDeclareGlobal(0x42n, true, expr).toString(),
				`(global $glb42  (mut i32) ${ expr })`,
			);
		});

		specify('InstructionDeclareLocal', () => {
			assert.deepStrictEqual(
				[
					new INST.InstructionDeclareLocal(0, false) .toString(),
					new INST.InstructionDeclareLocal(1, true)  .toString(),
				],
				[
					'(local $var0 i32)',
					'(local $var1 f64)',
				],
			);
		});
	})
})

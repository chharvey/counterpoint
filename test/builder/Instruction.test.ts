import * as assert from 'assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	Operator,
	INST,
} from '../../src/index.js';
import {assertEqualBins} from '../assert-helpers.js';
import {
	instructionConstInt,
	instructionConstFloat,
	instructionConvert,
} from '../helpers.js';



describe('Instruction', () => {
	describe('.constructor', () => {
		context('InstructionBinop', () => {
			it('does not throw when operands are a mix of ints and floats.', () => {
				new INST.InstructionBinopArithmetic(
					Operator.MUL,
					instructionConstInt(5n),
					instructionConstFloat(2.5),
				);
				new INST.InstructionBinopComparative(
					Operator.IS,
					instructionConstInt(5n),
					instructionConstFloat(2.5),
				);
				new INST.InstructionBinopEquality(
					Operator.ID,
					instructionConstInt(5n),
					instructionConstFloat(2.5),
				);
				new INST.InstructionBinopLogical(
					-1,
					Operator.AND,
					instructionConstInt(5n),
					instructionConstFloat(2.5),
				);
			});
			it('coerces ints to floats when either floats.', () => {
				assert.deepStrictEqual(
					new INST.InstructionBinopArithmetic(Operator.MUL, instructionConstInt(5n), instructionConstFloat(2.5)),
					new INST.InstructionBinopArithmetic(Operator.MUL, instructionConvert(5n),  instructionConstFloat(2.5)),
				);
			});
			it('does not coerce ints to floats when neither floats.', () => {
				assert.notDeepStrictEqual(
					new INST.InstructionBinopArithmetic(Operator.ADD, instructionConstInt(5n), instructionConstInt(2n)),
					new INST.InstructionBinopArithmetic(Operator.ADD, instructionConvert(5n),  instructionConstInt(2n)),
				);
				assert.notDeepStrictEqual(
					new INST.InstructionBinopComparative(Operator.LT, instructionConstInt(5n), instructionConstInt(2n)),
					new INST.InstructionBinopComparative(Operator.LT, instructionConstInt(5n), instructionConvert(2n)),
				);
				assert.notDeepStrictEqual(
					new INST.InstructionBinopLogical(-1, Operator.OR, instructionConstInt(5n), instructionConstInt(2n)),
					new INST.InstructionBinopLogical(-1, Operator.OR, instructionConvert(5n),  instructionConvert(2n)),
				);
			});
			describe('InsructionBinopEquality', () => {
				it('coerces ints to floats when: either floats, AND when operation is `==`, AND when int coercion is on.', () => {
					assert.deepStrictEqual(
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(5n), instructionConstFloat(2.5)),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConvert(5n),  instructionConstFloat(2.5)),
					);
				});
				it('does not coerce ints to floats when: neither floats, OR when operation is `===`, OR when int coercion is off.', () => {
					xjs.Array.forEachAggregated([
						new INST.InstructionBinopEquality(Operator.EQ, instructionConvert(5n),  instructionConstInt(2n)),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(5n), instructionConvert(2n)),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConvert(5n),  instructionConvert(2n)),
					], (unexpected) => {
						assert.notDeepStrictEqual(
							new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(5n), instructionConstInt(2n)),
							unexpected,
						);
					});
					assert.notDeepStrictEqual(
						new INST.InstructionBinopEquality(Operator.ID, instructionConstInt(5n), instructionConstFloat(2.5)),
						new INST.InstructionBinopEquality(Operator.ID, instructionConvert(5n),  instructionConstFloat(2.5)),
					);
					assert.notDeepStrictEqual(
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(5n), instructionConstFloat(2.5), false),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConvert(5n),  instructionConstFloat(2.5), false),
					);
				});
			});
		});
		context('InstructionCond', () => {
			it('does not throw when branches are a mix of ints and floats.', () => {
				new INST.InstructionCond(
					instructionConstInt(0n),
					instructionConstInt(2n),
					instructionConstFloat(3.3),
				);
			});
		});
	});


	describe('InstructionLocal', () => {
		specify('#toString', () => {
			const expr: INST.InstructionConst = instructionConstInt(42n);
			assert.strictEqual(new INST.InstructionLocalGet(0, binaryen.i32) .toString(), '(local.get $var0)');
			assert.strictEqual(new INST.InstructionLocalTee(1, expr)         .toString(), `(local.tee $var1 ${ instructionConstInt(42n) })`);
		});
	});


	describe('InstructionConst', () => {
		describe('#{toString,buildBin}', () => {
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
				];
				assert.deepStrictEqual(
					values.map((x) => instructionConstInt(BigInt(x)).toString()),
					values.map((x) => `(i32.const ${ x })`),
				);
				const mod: binaryen.Module = new binaryen.Module();
				return assertEqualBins(
					values.map((x) => instructionConstInt(BigInt(x)).buildBin(mod)),
					values.map((x) => mod.i32.const(x)),
				);
			});
			it('pushes the constant float onto the stack.', () => {
				const values: number[] = [
					55,
					-55,
					33,
					-33,
					2.007,
					-2.007,
					91.27e4,
					-91.27e4,
					91.27e-4,
					-91.27e-4,
				];
				assert.deepStrictEqual(
					values.map((x) => instructionConstFloat(x).toString()),
					values.map((x) => `(f64.const ${ x }${ (x % 1 === 0) ? '.0' : '' })`),
				);
				const mod: binaryen.Module = new binaryen.Module();
				return assertEqualBins(
					values.map((x) => instructionConstFloat(x).buildBin(mod)),
					values.map((x) => mod.f64.const(x)),
				);
			});
			it('prints Float64 negative zero correctly.', () => {
				assert.strictEqual(instructionConstFloat(-0.0).toString(), '(f64.const -0.0)');
				const mod: binaryen.Module = new binaryen.Module();
				assert.throws(() => assertEqualBins(
					instructionConstFloat(-0.0).buildBin(mod),
					mod.f64.const(-0.0),
				));
				return assertEqualBins(
					instructionConstFloat(-0.0).buildBin(mod),
					mod.f64.ceil(mod.f64.const(-0.5)),
				);
			});
		});
	});


	describe('InstructionConvert', () => {
		describe('#{toString,buildBin}', () => {
			it('converts an i32 into an f64.', () => {
				const exprs = [
					instructionConstInt(3n),
					new INST.InstructionBinopArithmetic(
						Operator.MUL,
						instructionConstInt(21n),
						instructionConstInt(2n),
					),
				];
				assert.deepStrictEqual(
					exprs.map((expr) => new INST.InstructionConvert(expr).toString()),
					exprs.map((expr) => `(f64.convert_i32_u ${ expr })`),
				);
				const mod: binaryen.Module = new binaryen.Module();
				return assertEqualBins(
					exprs.map((expr) => new INST.InstructionConvert(expr).buildBin(mod)),
					exprs.map((expr) => mod.f64.convert_u.i32(expr.buildBin(mod))),
				);
			});
		});
	});


	describe('InstructionTupleMake', () => {
		describe('#buildBin', () => {
			it('makes a tuple of expressions.', () => {
				const exprs = [
					instructionConstInt(3n),
					instructionConstFloat(3.6),
					new INST.InstructionBinopArithmetic(
						Operator.ADD,
						instructionConstInt(2n),
						instructionConstInt(21n),
					),
				];
				const mod: binaryen.Module = new binaryen.Module();
				return assertEqualBins(
					new INST.InstructionTupleMake(exprs).buildBin(mod),
					mod.tuple.make(exprs.map((expr) => expr.buildBin(mod))),
				);
			});
		});
	});


	describe('InstructionUnop', () => {
		describe('#{toString,buildBin}', () => {
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
				]);
				const mod: binaryen.Module = new binaryen.Module();
				return assertEqualBins([
					new INST.InstructionUnop(Operator.NOT, instructionConstInt(0n)),
					new INST.InstructionUnop(Operator.NOT, instructionConstInt(42n)),
					new INST.InstructionUnop(Operator.NOT, instructionConstFloat(0.0)),
					new INST.InstructionUnop(Operator.NOT, instructionConstFloat(4.2)),
					new INST.InstructionUnop(Operator.EMP, instructionConstInt(0n)),
					new INST.InstructionUnop(Operator.EMP, instructionConstInt(42n)),
					new INST.InstructionUnop(Operator.EMP, instructionConstFloat(0.0)),
					new INST.InstructionUnop(Operator.EMP, instructionConstFloat(4.2)),
					new INST.InstructionUnop(Operator.NEG, instructionConstInt(42n)),
				].map((inst) => inst.buildBin(mod)), [
					mod.call('inot', [instructionConstInt(0n)    .buildBin(mod)], binaryen.i32),
					mod.call('inot', [instructionConstInt(42n)   .buildBin(mod)], binaryen.i32),
					mod.call('fnot', [instructionConstFloat(0.0) .buildBin(mod)], binaryen.i32),
					mod.call('fnot', [instructionConstFloat(4.2) .buildBin(mod)], binaryen.i32),
					mod.call('iemp', [instructionConstInt(0n)    .buildBin(mod)], binaryen.i32),
					mod.call('iemp', [instructionConstInt(42n)   .buildBin(mod)], binaryen.i32),
					mod.call('femp', [instructionConstFloat(0.0) .buildBin(mod)], binaryen.i32),
					mod.call('femp', [instructionConstFloat(4.2) .buildBin(mod)], binaryen.i32),
					mod.call('neg',  [instructionConstInt(42n)   .buildBin(mod)], binaryen.i32),
				]);
			});
		});
	});


	describe('InstructionBinop', () => {
		describe('#{toString,buildBin}', () => {
			context('performs a binary operation.', () => {
				specify('InstructionBinopArithmetic', () => {
					const actuals: readonly INST.InstructionBinopArithmetic[] = [
						new INST.InstructionBinopArithmetic(Operator.MUL, instructionConstInt(21n),    instructionConstInt(2n)),
						new INST.InstructionBinopArithmetic(Operator.ADD, instructionConstFloat(30.1), instructionConstFloat(18.1)),
					];
					assert.deepStrictEqual(actuals.map((actual) => actual.toString()), [
						`(i32.mul ${ instructionConstInt(21n)    } ${ instructionConstInt(2n) })`,
						`(f64.add ${ instructionConstFloat(30.1) } ${ instructionConstFloat(18.1) })`,
					]);
					const mod: binaryen.Module = new binaryen.Module();
					return assertEqualBins(actuals.map((actual) => actual.buildBin(mod)), [
						mod.i32.mul(instructionConstInt(21n)    .buildBin(mod), instructionConstInt(2n)     .buildBin(mod)),
						mod.f64.add(instructionConstFloat(30.1) .buildBin(mod), instructionConstFloat(18.1) .buildBin(mod)),
					]);
				});
				specify('InstructionBinopComparative', () => {
					const actuals: readonly INST.InstructionBinopComparative[] = [
						new INST.InstructionBinopComparative(Operator.LT, instructionConstInt(30n),    instructionConstInt(18n)),
						new INST.InstructionBinopComparative(Operator.GE, instructionConstFloat(30.1), instructionConstFloat(18.1)),
					];
					assert.deepStrictEqual(actuals.map((actual) => actual.toString()), [
						`(i32.lt_s ${ instructionConstInt(30n)    } ${ instructionConstInt(18n) })`,
						`(f64.ge ${   instructionConstFloat(30.1) } ${ instructionConstFloat(18.1) })`,
					]);
					const mod: binaryen.Module = new binaryen.Module();
					return assertEqualBins(actuals.map((actual) => actual.buildBin(mod)), [
						mod.i32.lt_s (instructionConstInt(30n)    .buildBin(mod), instructionConstInt(18n)    .buildBin(mod)),
						mod.f64.ge   (instructionConstFloat(30.1) .buildBin(mod), instructionConstFloat(18.1) .buildBin(mod)),
					]);
				});
				specify('InstructionBinopEquality', () => {
					const actuals: readonly INST.InstructionBinopEquality[] = [
						new INST.InstructionBinopEquality(Operator.ID, instructionConstInt(42n), instructionConstInt(420n)),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(42n), instructionConstInt(420n)),
						new INST.InstructionBinopEquality(Operator.ID, instructionConstInt(42n), instructionConstFloat(4.2)),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(42n), instructionConstFloat(4.2)),

						new INST.InstructionBinopEquality(Operator.ID, instructionConstFloat(4.2), instructionConstInt(42n)),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstFloat(4.2), instructionConstInt(42n)),
						new INST.InstructionBinopEquality(Operator.ID, instructionConstFloat(4.2), instructionConstFloat(42.0)),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstFloat(4.2), instructionConstFloat(42.0)),

						new INST.InstructionBinopEquality(Operator.ID, instructionConstInt(0n), instructionConstInt(0n)),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(0n), instructionConstInt(0n)),
						new INST.InstructionBinopEquality(Operator.ID, instructionConstInt(0n), instructionConstFloat(0.0)),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(0n), instructionConstFloat(0.0)),

						new INST.InstructionBinopEquality(Operator.ID, instructionConstInt(0n), instructionConstInt(0n)),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(0n), instructionConstInt(0n)),
						new INST.InstructionBinopEquality(Operator.ID, instructionConstInt(0n), instructionConstFloat(0.0)),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(0n), instructionConstFloat(0.0)),

						new INST.InstructionBinopEquality(Operator.ID, instructionConstInt(1n), instructionConstInt(1n)),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(1n), instructionConstInt(1n)),
						new INST.InstructionBinopEquality(Operator.ID, instructionConstInt(1n), instructionConstFloat(1.0)),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(1n), instructionConstFloat(1.0)),

						new INST.InstructionBinopEquality(Operator.ID, instructionConstInt(0n), instructionConstInt(0n)),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(0n), instructionConstInt(0n)),
						new INST.InstructionBinopEquality(Operator.ID, instructionConstInt(0n), instructionConstInt(1n)),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(0n), instructionConstInt(1n)),


						new INST.InstructionBinopEquality(Operator.ID, instructionConstInt(42n), instructionConstFloat(4.2), false),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(42n), instructionConstFloat(4.2), false),

						new INST.InstructionBinopEquality(Operator.ID, instructionConstFloat(4.2), instructionConstInt(42n), false),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstFloat(4.2), instructionConstInt(42n), false),

						new INST.InstructionBinopEquality(Operator.ID, instructionConstInt(0n), instructionConstFloat(0.0), false),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(0n), instructionConstFloat(0.0), false),

						new INST.InstructionBinopEquality(Operator.ID, instructionConstInt(0n), instructionConstFloat(0.0), false),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(0n), instructionConstFloat(0.0), false),

						new INST.InstructionBinopEquality(Operator.ID, instructionConstInt(1n), instructionConstFloat(1.0), false),
						new INST.InstructionBinopEquality(Operator.EQ, instructionConstInt(1n), instructionConstFloat(1.0), false),
					];
					const mod: binaryen.Module = new binaryen.Module();
					return assertEqualBins(actuals.map((actual) => actual.buildBin(mod)), [
						mod.i32.eq (           instructionConstInt(42n) .buildBin(mod), instructionConstInt(420n)  .buildBin(mod)),
						mod.i32.eq (           instructionConstInt(42n) .buildBin(mod), instructionConstInt(420n)  .buildBin(mod)),
						mod.call   ('i_f_id', [instructionConstInt(42n) .buildBin(mod), instructionConstFloat(4.2) .buildBin(mod)], binaryen.i32),
						mod.f64.eq (           instructionConvert(42n)  .buildBin(mod), instructionConstFloat(4.2) .buildBin(mod)),

						mod.call   ('f_i_id', [instructionConstFloat(4.2).buildBin(mod), instructionConstInt(42n)    .buildBin(mod)], binaryen.i32),
						mod.f64.eq (           instructionConstFloat(4.2).buildBin(mod), instructionConvert(42n)     .buildBin(mod)),
						mod.call   ('fid',    [instructionConstFloat(4.2).buildBin(mod), instructionConstFloat(42.0) .buildBin(mod)], binaryen.i32),
						mod.f64.eq (           instructionConstFloat(4.2).buildBin(mod), instructionConstFloat(42.0) .buildBin(mod)),

						mod.i32.eq (           instructionConstInt(0n) .buildBin(mod), instructionConstInt(0n)    .buildBin(mod)),
						mod.i32.eq (           instructionConstInt(0n) .buildBin(mod), instructionConstInt(0n)    .buildBin(mod)),
						mod.call   ('i_f_id', [instructionConstInt(0n) .buildBin(mod), instructionConstFloat(0.0) .buildBin(mod)], binaryen.i32),
						mod.f64.eq (           instructionConvert(0n)  .buildBin(mod), instructionConstFloat(0.0) .buildBin(mod)),

						mod.i32.eq (           instructionConstInt(0n) .buildBin(mod), instructionConstInt(0n)    .buildBin(mod)),
						mod.i32.eq (           instructionConstInt(0n) .buildBin(mod), instructionConstInt(0n)    .buildBin(mod)),
						mod.call   ('i_f_id', [instructionConstInt(0n) .buildBin(mod), instructionConstFloat(0.0) .buildBin(mod)], binaryen.i32),
						mod.f64.eq (           instructionConvert(0n)  .buildBin(mod), instructionConstFloat(0.0) .buildBin(mod)),

						mod.i32.eq (           instructionConstInt(1n) .buildBin(mod), instructionConstInt(1n)    .buildBin(mod)),
						mod.i32.eq (           instructionConstInt(1n) .buildBin(mod), instructionConstInt(1n)    .buildBin(mod)),
						mod.call   ('i_f_id', [instructionConstInt(1n) .buildBin(mod), instructionConstFloat(1.0) .buildBin(mod)], binaryen.i32),
						mod.f64.eq (           instructionConvert(1n)  .buildBin(mod), instructionConstFloat(1.0) .buildBin(mod)),

						mod.i32.eq(instructionConstInt(0n).buildBin(mod), instructionConstInt(0n).buildBin(mod)),
						mod.i32.eq(instructionConstInt(0n).buildBin(mod), instructionConstInt(0n).buildBin(mod)),
						mod.i32.eq(instructionConstInt(0n).buildBin(mod), instructionConstInt(1n).buildBin(mod)),
						mod.i32.eq(instructionConstInt(0n).buildBin(mod), instructionConstInt(1n).buildBin(mod)),


						mod.call('i_f_id', [instructionConstInt(42n).buildBin(mod), instructionConstFloat(4.2).buildBin(mod)], binaryen.i32),
						mod.call('i_f_id', [instructionConstInt(42n).buildBin(mod), instructionConstFloat(4.2).buildBin(mod)], binaryen.i32),

						mod.call('f_i_id', [instructionConstFloat(4.2).buildBin(mod), instructionConstInt(42n).buildBin(mod)], binaryen.i32),
						mod.call('f_i_id', [instructionConstFloat(4.2).buildBin(mod), instructionConstInt(42n).buildBin(mod)], binaryen.i32),

						mod.call('i_f_id', [instructionConstInt(0n).buildBin(mod), instructionConstFloat(0.0).buildBin(mod)], binaryen.i32),
						mod.call('i_f_id', [instructionConstInt(0n).buildBin(mod), instructionConstFloat(0.0).buildBin(mod)], binaryen.i32),

						mod.call('i_f_id', [instructionConstInt(0n).buildBin(mod), instructionConstFloat(0.0).buildBin(mod)], binaryen.i32),
						mod.call('i_f_id', [instructionConstInt(0n).buildBin(mod), instructionConstFloat(0.0).buildBin(mod)], binaryen.i32),

						mod.call('i_f_id', [instructionConstInt(1n).buildBin(mod), instructionConstFloat(1.0).buildBin(mod)], binaryen.i32),
						mod.call('i_f_id', [instructionConstInt(1n).buildBin(mod), instructionConstFloat(1.0).buildBin(mod)], binaryen.i32),
					]);
				});
			});
			it('creates variables for InstructionBinopLogical.', () => {
				const actuals: readonly INST.InstructionBinopLogical[] = [
					new INST.InstructionBinopLogical(0, Operator.AND, instructionConstInt(30n),    instructionConstInt(18n)),
					new INST.InstructionBinopLogical(3, Operator.OR,  instructionConstFloat(30.1), instructionConstFloat(18.1)),
				];
				const expecteds: readonly INST.InstructionCond[] = [
					new INST.InstructionCond(
						new INST.InstructionUnop(Operator.NOT, new INST.InstructionUnop(Operator.NOT, new INST.InstructionLocalTee(0, instructionConstInt(30n)))),
						instructionConstInt(18n),
						new INST.InstructionLocalGet(0, binaryen.i32),
					),
					new INST.InstructionCond(
						new INST.InstructionUnop(Operator.NOT, new INST.InstructionUnop(Operator.NOT, new INST.InstructionLocalTee(3, instructionConstFloat(30.1)))),
						new INST.InstructionLocalGet(3, binaryen.f64),
						instructionConstFloat(18.1),
					),
				];
				assert.deepStrictEqual(
					actuals   .map((actual) =>   actual.toString()),
					expecteds .map((expected) => expected.toString()),
				);
				const mod: binaryen.Module = new binaryen.Module();
				return assertEqualBins(
					actuals   .map((actual) =>   actual.buildBin(mod)),
					expecteds .map((expected) => expected.buildBin(mod)),
				);
			});
		});
	});


	describe('InstructionCond', () => {
		describe('#{toString, buildBin}', () => {
			it('performs a conditional operation.', () => {
				const actuals: readonly INST.InstructionCond[] = [
					new INST.InstructionCond(
						instructionConstInt(1n),
						instructionConstInt(2n),
						instructionConstInt(3n),
					),
					new INST.InstructionCond(
						instructionConstInt(0n),
						instructionConstFloat(2.2),
						instructionConstFloat(3.3),
					),
				];
				assert.deepStrictEqual(actuals.map((actual) => actual.toString()), [
					`(if (result i32) ${ instructionConstInt(1n) } (then ${ instructionConstInt(2n)    }) (else ${ instructionConstInt(3n) }))`,
					`(if (result f64) ${ instructionConstInt(0n) } (then ${ instructionConstFloat(2.2) }) (else ${ instructionConstFloat(3.3) }))`,
				]);
				const mod: binaryen.Module = new binaryen.Module();
				return assertEqualBins(actuals.map((actual) => actual.buildBin(mod)), [
					mod.if(instructionConstInt(1n).buildBin(mod), instructionConstInt(2n)    .buildBin(mod), instructionConstInt(3n)    .buildBin(mod)),
					mod.if(instructionConstInt(0n).buildBin(mod), instructionConstFloat(2.2) .buildBin(mod), instructionConstFloat(3.3) .buildBin(mod)),
				]);
			});
		});
	});
});

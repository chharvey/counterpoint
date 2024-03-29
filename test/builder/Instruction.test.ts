import * as xjs from 'extrajs';
import * as assert from 'assert'
import {
	PARSER_SOLID as PARSER,
} from '../../src/parser/index.js';
import {
	DECORATOR_SOLID as DECORATOR,
	Operator,
} from '../../src/validator/index.js';
import {
	Int16,
	Float64,
} from '../../src/typer/index.js';
import {
	Builder,
	INST,
} from '../../src/builder/index.js';
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
			assert.strictEqual(new INST.InstructionGlobalSet('$x', expr)  .toString(), `(global.set $x ${ instructionConstInt(42n) })`);
			assert.strictEqual(new INST.InstructionGlobalGet('$x', false) .toString(), `(global.get $x)`);
		});

		specify('InstructionLocal', () => {
			const expr: INST.InstructionConst = instructionConstInt(42n);
			assert.strictEqual(new INST.InstructionLocalSet('$x', expr)  .toString(), `(local.set $x ${ instructionConstInt(42n) })`);
			assert.strictEqual(new INST.InstructionLocalGet('$x', false) .toString(), `(local.get $x)`);
			assert.strictEqual(new INST.InstructionLocalTee('$x', expr)  .toString(), `(local.tee $x ${ instructionConstInt(42n) })`);
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
				assert.strictEqual(new INST.InstructionBinopLogical(
					0n,
					Operator.AND,
					instructionConstInt(30n),
					instructionConstInt(18n),
				).toString(), ((varname) => `${ new INST.InstructionDeclareLocal(varname, false) } ${ new INST.InstructionCond(
					new INST.InstructionUnop(Operator.NOT, new INST.InstructionUnop(Operator.NOT, new INST.InstructionLocalTee(varname, instructionConstInt(30n)))),
					instructionConstInt(18n),
					new INST.InstructionLocalGet(varname, false),
				) }`)('$o0'))
				assert.strictEqual(new INST.InstructionBinopLogical(
					3n,
					Operator.OR,
					instructionConstFloat(30.1),
					instructionConstFloat(18.1),
				).toString(), ((varname) => `${ new INST.InstructionDeclareLocal(varname, true) } ${ new INST.InstructionCond(
					new INST.InstructionUnop(Operator.NOT, new INST.InstructionUnop(Operator.NOT, new INST.InstructionLocalTee(varname, instructionConstFloat(30.1)))),
					new INST.InstructionLocalGet(varname, true),
					instructionConstFloat(18.1),
				) }`)('$o3'))
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
				new INST.InstructionDeclareGlobal('$x', true, expr).toString(),
				`(global $x (mut i32) ${ expr })`,
			);
		});

		describe('InstructionStatement', () => {
			it('returns a wasm function.', () => {
				const expr: INST.InstructionBinopArithmetic = new INST.InstructionBinopArithmetic(
					Operator.MUL,
					instructionConstInt(21n),
					instructionConstInt(2n),
				)
				assert.strictEqual(
					new INST.InstructionStatement(0n, expr).toString(),
					xjs.String.dedent`
						(func (export "f0") (result i32)
							${ expr }
						)
					`,
				)
			})
		})

		context('InstructionModule', () => {
			it('creates a program.', () => {
				const mods: (INST.InstructionNone | INST.InstructionModule)[] = [
					``,
					`;`,
				].map((src) => DECORATOR
					.decorate(PARSER.parse(src))
					.build(new Builder(src))
				);
				assert.ok(mods[0] instanceof INST.InstructionNone);
				assert.strictEqual(mods[0].toString(), ``)
				assert.ok(mods[1] instanceof INST.InstructionModule);
				assert.deepStrictEqual(mods[1], new INST.InstructionModule([
					...Builder.IMPORTS,
					new INST.InstructionNone(),
				]))
			})
		})
	})

	describe('InstructionConst', () => {
	describe('.fromCPValue', () => {
		specify('@value instanceof Int16', () => {
			const data: bigint[] = [
				42n + -420n,
				...[
					 126 /  3,
					-126 /  3,
					 126 / -3,
					-126 / -3,
					 200 /  3,
					 200 / -3,
					-200 /  3,
					-200 / -3,
				].map((x) => BigInt(Math.trunc(x))),
				(42n ** 2n * 420n) % (2n ** 16n),
				(-5n) ** (2n * 3n),
			]
			assert.deepStrictEqual(
				data.map((x) => INST.InstructionConst.fromCPValue(new Int16(x))),
				data.map((x) => instructionConstInt(x)),
			)
		})
		specify('@value instanceof Float64', () => {
			const data: number[] = [
				55, -55, 33, -33, 2.007, -2.007,
				91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
				-0, -0, 6.8, 6.8, 0, -0,
				3.0 - 2.7,
			]
			assert.deepStrictEqual(
				data.map((x) => INST.InstructionConst.fromCPValue(new Float64(x))),
				data.map((x) => instructionConstFloat(x)),
			)
		})
		describe('@to_float === true', () => {
			specify('@value instanceof Int16', () => {
				const build: INST.InstructionConst = INST.InstructionConst.fromCPValue(new Int16(42n), true);
				assert.deepStrictEqual   (build, instructionConstFloat(42));
				assert.notDeepStrictEqual(build, instructionConstInt(42n));
			})
		})
	});
	});
})

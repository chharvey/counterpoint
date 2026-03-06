import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	AST,
	VALUE,
	Optimizer,
	IR,
	Builder,
} from '../../../src/index.ts';
import {assertEqualBins} from '../../assert-helpers.ts';
import {genConst} from '../../helpers.ts';



describe('IrNode', () => {
	describe('#codegen', () => {
		function setupScript(src: string, opts: object): {goal: AST.ASTNodeGoal, opt: Optimizer} {
			const opt = new Optimizer();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src.slice(1, -1));
			goal.varCheck();
			goal.typeCheck();
			'lower' in opts && opts.lower && goal.lower(opt);
			return {goal, opt};
		}

		it('is not yet supported.', () => {
			const {opt} = setupScript(`{
				"hello";
				"""hello {{ 42 }}""";
				(42, 43, 44);
				[42, 43, 44];
				{42, 43, 44};
				(a= 42, b= 43, c= 44);
				[a= 42, b= 43, c= 44];
				{"a" -> 42, "b" -> 43, "c" -> 44};
				(42, 43, 44).0;
				(a= 42, b= 43, c= 44).a;
				[42, 43, 44].[0];
				[a= 42, b= 43, c= 44].[@a];
				{42, 43, 44}.[42];
				{"a" -> 42, "b" -> 43, "c" -> 44}.["a"];
				[42, 43, 44].[0]                        = 43;
				[a= 42, b= 43, c= 44].[@a]              = 43;
				{42, 43, 44}.[42]                       = false;
				{"a" -> 42, "b" -> 43, "c" -> 44}.["a"] = 43;
			}`, {lower: true, build: false});
			const cg = new Builder();
			xjs.Array.forEachAggregated([
				...opt.instructions,
				new IR.Label('label1'),
				new IR.Goto(new IR.Label('label2')),
				new IR.GotoIfFalse(new IR.Const(VALUE.NULL), new IR.Label('label2')),
			], (instr) => assert.throws(() => instr.codegen(cg), /not yet supported/, instr.toString()));
		});

		it('Trap returns (unreachable).', () => {
			const cg = new Builder();
			return assertEqualBins(new IR.Trap().codegen(cg), cg.module.unreachable());
		});

		it('Const returns (v128.const).', () => {
			const {goal, opt} = setupScript(`{
				null;
				false;
				@hello;
				42;
				4.2;
			}`, {lower: true, build: false});
			const cg  = new Builder();
			const mod = cg.module;
			return assertEqualBins(
				goal.children.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
				[
					genConst(mod),
					genConst(mod, false),
					genConst(mod, Symbol(0x100)),
					genConst(mod, 42n),
					genConst(mod, 4.2),
				],
			);
		});

		it('Get returns (local.get).', () => {
			const {goal, opt} = setupScript(`{
				val mut a: null  = null;
				val mut b: bool  = false;
				val mut c: sym   = @hello;
				val mut d: int   = 42;
				val mut e: float = 4.2;

				a;
				b;
				c;
				d;
				e;
			}`, {lower: true, build: false});
			const cg  = new Builder();
			const mod = cg.module;
			opt.instructions.slice(0, 5).map((instr) => (instr).codegen(cg));
			return assertEqualBins(
				goal.children.slice(5).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
				[
					mod.local.get(0, binaryen.f32),
					mod.local.get(1, binaryen.f32),
					mod.local.get(2, binaryen.f32),
					mod.local.get(3, binaryen.f32),
					mod.local.get(4, binaryen.f32),
				],
			);
		});

		it('Unop returns custom WASM functions `vnot`, `vemp`, `vneg`.', () => {
			const CALL = {
				vnot: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vnot', [arg], binaryen.v128),
				vemp: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vemp', [arg], binaryen.v128),
				vneg: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vneg', [arg], binaryen.v128),
			} as const;

			const {goal, opt} = setupScript(`{
				!null;
				!false;
				!@hello;
				!42;
				!4.2;

				?null;
				?false;
				?@hello;
				?42;
				?4.2;

				-(42);
				-(4.2);
			}`, {lower: true, build: false});
			const cg  = new Builder();
			const mod = cg.module;
			return assertEqualBins(
				goal.children.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
				[
					CALL.vnot(mod, genConst(mod)),
					CALL.vnot(mod, genConst(mod, false)),
					CALL.vnot(mod, genConst(mod, Symbol(0x100))),
					CALL.vnot(mod, genConst(mod, 42n)),
					CALL.vnot(mod, genConst(mod, 4.2)),

					CALL.vemp(mod, genConst(mod)),
					CALL.vemp(mod, genConst(mod, false)),
					CALL.vemp(mod, genConst(mod, Symbol(0x100))),
					CALL.vemp(mod, genConst(mod, 42n)),
					CALL.vemp(mod, genConst(mod, 4.2)),

					CALL.vneg(mod, genConst(mod, 42n)),
					CALL.vneg(mod, genConst(mod, 4.2)),
				],
			);
		});

		it('Binop returns custom WASM functions `viadd`, `vfmul`, etc.', () => {
			const CALL = {
				vadd: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vadd', [arg0, arg1], binaryen.v128),
				vmul: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vmul', [arg0, arg1], binaryen.v128),
				vdiv: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vdiv', [arg0, arg1], binaryen.v128),
				vexp: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vexp', [arg0, arg1], binaryen.v128),
				vlt:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vlt',  [arg0, arg1], binaryen.v128),
				vgt:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vgt',  [arg0, arg1], binaryen.v128),
				vle:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vle',  [arg0, arg1], binaryen.v128),
				vge:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vge',  [arg0, arg1], binaryen.v128),
				vid:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vid',  [arg0, arg1], binaryen.v128),
				veq:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('veq',  [arg0, arg1], binaryen.v128),
			} as const;

			const {goal, opt} = setupScript(`{
				2 + 3;
				% 2 - 3; % TODO: v0.5
				2 * 3;
				2 / 3;
				2 ^ 3;

				%%
				TODO: v0.5
				+2 + +3;
				+2 - +3;
				+2 * +3;
				+2 / +3;
				+2 ^ +3;
				%%

				2.0 + 3.0;
				% 2.0 - 3.0; % TODO: v0.5
				2.0 * 3.0;
				2.0 / 3.0;
				2.0 ^ 3.0;

				2 < 3.0;
				2 > 3.0;
				2 <= 3.0;
				2 >= 3.0;

				2.0 === 3;
				2.0 ==  3;
			}`, {lower: true, build: false});
			const cg  = new Builder();
			const mod = cg.module;
			return assertEqualBins(
				goal.children.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
				[
					CALL.vadd(mod, genConst(mod, 2n), genConst(mod, 3n)),
					CALL.vmul(mod, genConst(mod, 2n), genConst(mod, 3n)),
					CALL.vdiv(mod, genConst(mod, 2n), genConst(mod, 3n)),
					CALL.vexp(mod, genConst(mod, 2n), genConst(mod, 3n)),

					CALL.vadd(mod, genConst(mod, 2.0), genConst(mod, 3.0)),
					CALL.vmul(mod, genConst(mod, 2.0), genConst(mod, 3.0)),
					CALL.vdiv(mod, genConst(mod, 2.0), genConst(mod, 3.0)),
					CALL.vexp(mod, genConst(mod, 2.0), genConst(mod, 3.0)),

					CALL.vlt(mod, genConst(mod, 2n), genConst(mod, 3.0)),
					CALL.vgt(mod, genConst(mod, 2n), genConst(mod, 3.0)),
					CALL.vle(mod, genConst(mod, 2n), genConst(mod, 3.0)),
					CALL.vge(mod, genConst(mod, 2n), genConst(mod, 3.0)),

					CALL.vid(mod, genConst(mod, 2.0), genConst(mod, 3n)),
					CALL.veq(mod, genConst(mod, 2.0), genConst(mod, 3n)),
				],
			);
		});

		it('Drop returns (drop).', () => {
			const {opt} = setupScript(`{
				null;
				false;
				@hello;
				42;
				4.2;
			}`, {lower: true, build: false});
			const cg  = new Builder();
			const mod = cg.module;
			return assertEqualBins(
				opt.instructions.map((instr) => (instr).codegen(cg)),
				[
					mod.drop(genConst(mod)),
					mod.drop(genConst(mod, false)),
					mod.drop(genConst(mod, Symbol(0x100))),
					mod.drop(genConst(mod, 42n)),
					mod.drop(genConst(mod, 4.2)),
				],
			);
		});

		it('Decl returns (local.set).', () => {
			const {opt} = setupScript(`{
				val a: null  = null;
				val b: bool  = false;
				val c: sym   = @hello;
				val d: int   = 42;
				val e: float = 4.2;
			}`, {lower: true, build: false});
			const cg  = new Builder();
			const mod = cg.module;
			return assertEqualBins(
				opt.instructions.map((instr) => (instr).codegen(cg)),
				[
					mod.local.set(0, genConst(mod)),
					mod.local.set(1, genConst(mod, false)),
					mod.local.set(2, genConst(mod, Symbol(0x102))),
					mod.local.set(3, genConst(mod, 42n)),
					mod.local.set(4, genConst(mod, 4.2)),
				],
			);
		});

		it('Set returns (local.set).', () => {
			const {opt} = setupScript(`{
				val mut a: null  = null;
				val mut b: bool  = false;
				val mut c: sym   = @hello;
				val mut d: int   = 42;
				val mut e: float = 4.2;

				a = null;
				b = true;
				c = @world;
				d = 43;
				e = 4.3;
			}`, {lower: true, build: false});
			const cg  = new Builder();
			const mod = cg.module;
			return assertEqualBins(
				opt.instructions.slice(5).map((instr) => (instr).codegen(cg)),
				[
					mod.local.set(0, genConst(mod)),
					mod.local.set(1, genConst(mod, true)),
					mod.local.set(2, genConst(mod, Symbol(0x106))),
					mod.local.set(3, genConst(mod, 43n)),
					mod.local.set(4, genConst(mod, 4.3)),
				],
			);
		});
	});
});

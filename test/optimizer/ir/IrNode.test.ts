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
		it('is not yet supported.', () => {
			const opt = new Optimizer();
			const cg  = new Builder();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
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
				42 + 43;
				[42, 43, 44].[0]                        = 43;
				[a= 42, b= 43, c= 44].[@a]              = 43;
				{42, 43, 44}.[42]                       = false;
				{"a" -> 42, "b" -> 43, "c" -> 44}.["a"] = 43;
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.lower(opt);
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
			const opt = new Optimizer();
			const cg  = new Builder();
			const mod = cg.module;
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				null;
				false;
				@hello;
				42;
				4.2;
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.lower(opt);
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
			const opt = new Optimizer();
			const cg  = new Builder();
			const mod = cg.module;
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
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
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.lower(opt);
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

			const opt = new Optimizer();
			const cg  = new Builder();
			const mod = cg.module;
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
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
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.lower(opt);
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

		it('Drop returns (drop).', () => {
			const opt = new Optimizer();
			const cg  = new Builder();
			const mod = cg.module;
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				null;
				false;
				@hello;
				42;
				4.2;
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.lower(opt);
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
			const opt = new Optimizer();
			const cg  = new Builder();
			const mod = cg.module;
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				val a: null  = null;
				val b: bool  = false;
				val c: sym   = @hello;
				val d: int   = 42;
				val e: float = 4.2;
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.lower(opt);
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
			const opt = new Optimizer();
			const cg  = new Builder();
			const mod = cg.module;
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
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
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.lower(opt);
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

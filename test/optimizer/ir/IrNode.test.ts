import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	AST,
	VALUE,
	TYPE,
	Optimizer,
	IR,
	Property_new,
	BinValue,
	Builder,
} from '../../../src/index.ts';
import {assertEqualBins} from '../../assert-helpers.ts';
import {genConst} from '../../helpers.ts';



describe('IrNode', () => {
	describe('#codegen', () => {
		/** Return either `(ref $Value)` or `(ref null $Value)`. */
		function reftype_value(cg: Builder, nullish: boolean = false): binaryen.Type {
			return cg.getReftype(`(ref ${ nullish ? 'null ' : '' }$Value)`)!;
		}

		function setupScript(src: string, opts: object): {
			goal: AST.ASTNodeGoal,
			opt:  Optimizer,
			cg:   Builder,
		} {
			const opt = new Optimizer();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src.slice(1, -1));
			const cg:   Builder         = new Builder();
			goal.varCheck();
			goal.typeCheck();
			'lower'   in opts && opts.lower   && goal.lower(opt);
			'codegen' in opts && opts.codegen && opt.instructions.map((instr) => instr.codegen(cg));
			return {goal, opt, cg};
		}

		it('is not yet supported.', () => {
			const {opt, cg} = setupScript(`{
				"hello";
				"""hello {{ 42 }}""";
				{42, 43, 44};
				{"a" -> 42, "b" -> 43, "c" -> 44};
				{42, 43, 44}.[42];
				{"a" -> 42, "b" -> 43, "c" -> 44}.["a"];
				{42, 43, 44}.[42]                       = false;
				{"a" -> 42, "b" -> 43, "c" -> 44}.["a"] = 43;
			}`, {lower: true, codegen: false, build: false});
			xjs.Array.forEachAggregated([
				...opt.instructions,
				new IR.Label('label1'),
				new IR.Goto(new IR.Label('label2')),
				new IR.GotoIfFalse(new IR.Const(VALUE.NULL), new IR.Label('label2')),
			], (instr) => assert.throws(() => instr.codegen(cg), /not yet supported/, instr.toString()));

			// more cases
			xjs.Array.forEachAggregated<IR.Instruction>([
				setupScript('{ (42, 43, 44).0; }',                  {lower: true, codegen: false, build: false}).opt.instructions[1], // (TUPLE.GET)
				setupScript('{ (a= 42, b= 43, c= 44).a; }',         {lower: true, codegen: false, build: false}).opt.instructions[1], // (RECORD.GET)
				setupScript('{ [42, 43, 44].[0]; }',                {lower: true, codegen: false, build: false}).opt.instructions[1], // (LIST.GET)
				setupScript('{ [42, 43, 44].[0] = 43; }',           {lower: true, codegen: false, build: false}).opt.instructions[1], // (LIST.SET)
				setupScript('{ [a= 42, b= 43, c= 44].[@a]; }',      {lower: true, codegen: false, build: false}).opt.instructions[1], // (DICT.GET)
				setupScript('{ [a= 42, b= 43, c= 44].[@a] = 43; }', {lower: true, codegen: false, build: false}).opt.instructions[1], // (DICT.SET)
			], (instr) => assert.throws(() => instr.codegen(new Builder()), /not yet supported/, instr.toString()));
		});

		it('Trap returns (unreachable).', () => {
			const cg = new Builder();
			return assertEqualBins(new IR.Trap().codegen(cg), cg.module.unreachable());
		});

		it('Const returns (v128.const).', () => {
			const {goal, opt, cg} = setupScript(`{
				null;
				false;
				@hello;
				42;
				4.2;
			}`, {lower: true, codegen: false, build: false});
			return assertEqualBins(
				goal.children.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
				[
					genConst(cg),
					genConst(cg, false),
					genConst(cg, Symbol(0x100)),
					genConst(cg, 42n),
					genConst(cg, 4.2),
				],
			);
		});

		it('Get returns (local.get).', () => {
			const {goal, opt, cg} = setupScript(`{
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
			}`, {lower: true, codegen: false, build: false});
			const mod = cg.module;
			opt.instructions.slice(0, 5).map((instr) => instr.codegen(cg));
			return assertEqualBins(
				goal.children.slice(5).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
				[
					mod.local.get(0, reftype_value(cg)),
					mod.local.get(1, reftype_value(cg)),
					mod.local.get(2, reftype_value(cg)),
					mod.local.get(3, reftype_value(cg)),
					mod.local.get(4, reftype_value(cg)),
				],
			);
		});

		describe('CollectionLinearNew', () => {
			it('empty TUPLE.NEW returns (array.new_fixed).', () => {
				const {goal, opt, cg} = setupScript(`{
					();
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				return assertEqualBins(
					(goal.children[0] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, mod.array.new_fixed(cg.getHeaptype('$Tuple')!, [])).value,
				);
			});
			it('TUPLE.NEW returns (array.new_fixed).', () => {
				const {goal, opt, cg} = setupScript(`{
					val mut x: int = 42;
					(x, 4.2, (null,));
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				return assertEqualBins(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, mod.array.new_fixed(cg.getHeaptype('$Tuple')!, [
						mod.local.get(0, reftype_value(cg)),
						genConst(cg, 4.2),
						mod.local.get(1, reftype_value(cg)),
					])).value,
				);
			});
			it('LIST.NEW returns (struct.new) with count and internal array.', () => {
				const {goal, opt, cg} = setupScript(`{
					val mut x: int = 42;
					[x, 4.2, (null,), x/2, @e];
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				const WASM_NULL: binaryen.ExpressionRef = mod.ref.null(reftype_value(cg, true));
				return assertEqualBins(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, mod.struct.new([
						mod.i32.const(5),
						mod.array.new_fixed(cg.getHeaptype('$ListInternal')!, [
							mod.local.get(0, reftype_value(cg, true)),
							genConst(cg, 4.2),
							mod.local.get(1, reftype_value(cg, true)),
							mod.local.get(2, reftype_value(cg, true)),
							genConst(cg, Symbol(0x101)),
							WASM_NULL,
							WASM_NULL,
							WASM_NULL,
						]),
					], cg.getHeaptype('$List')!)).value,
				);
			});
		});

		describe('RecordNew', () => {
			it('empty RECORD.NEW returns (array.new_fixed).', () => {
				// there exists no syntax for empty records, so constructing it manually
				const cg = new Builder();
				return assertEqualBins(
					new IR.RecordNew(new Map(), new TYPE.Record()).codegen(cg),
					new BinValue(cg, cg.module.array.new_fixed(cg.getHeaptype('$Tuple')!, [])).value,
				);
			});
			it('RECORD.NEW returns (array.new_fixed).', () => {
				const {goal, opt, cg} = setupScript(`{
					val mut x: int = 42;
					(a= x, b= 4.2, c= (null,), d= x/2, e= @e);
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				return assertEqualBins(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, mod.array.new_fixed(cg.getHeaptype('$Record')!, [
						Property_new(cg, 260n, mod.local.get(2, reftype_value(cg))), // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
						Property_new(cg, 261n, genConst(cg, Symbol(0x105))),
						Property_new(cg, 257n, mod.local.get(0, reftype_value(cg))),
						Property_new(cg, 258n, genConst(cg, 4.2)),
						Property_new(cg, 259n, mod.local.get(1, reftype_value(cg))),
					])).value,
				);
			});
			it('hashing collisions are resolved in source order.', () => {
				const {goal, opt, cg} = setupScript(`{
					% sym  | id  | mod 3
					% ---- | --- | ----
					@b;    % 256 % 1
					@c;    % 257 % 2
					@a;    % 258 % 0
					@bb;   % 259 % 1
					@cc;   % 260 % 2
					@aa;   % 261 % 0
					@bbb;  % 262 % 1
					@ccc;  % 263 % 2
					@aaa;  % 264 % 0
					(a= 42, aa= false, b= 4.2);
					%%
						(???,         ???,         ???)
						(258,         ???,         ???)
						(258 & 261->, ???,         ???)
						(258,         261,         ???)
						(258,         261 & 256->, ???)
						(258,         261,         256) (a, aa, b)
					%%
					(aa= true, c= null, a= 42);
					%%
						(???,         ???,       ???)
						(261,         ???,       ???)
						(261,         ???,       257)
						(261 & 258->, ???,       257)
						(261,         258,       257) (aa, a, c)
					%%
					(b= 42, bb= 4.2, bbb= null);
					%%
						(???,         256,         ???)
						(???,         256 & 259->, ???)
						(???,         256,         259)
						(???,         256 & 262->, 259)
						(???,         256,         259 & 262->)
						(262,         256,         259) (bbb, b, bb)
					%%
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				return assertEqualBins(
					goal.children.slice(9).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
					[
						new BinValue(cg, mod.array.new_fixed(cg.getHeaptype('$Record')!, [
							Property_new(cg, 258n, genConst(cg, 42n)),
							Property_new(cg, 261n, genConst(cg, false)),
							Property_new(cg, 256n, genConst(cg, 4.2)),
						])).value,
						new BinValue(cg, mod.array.new_fixed(cg.getHeaptype('$Record')!, [
							Property_new(cg, 261n, genConst(cg, true)),
							Property_new(cg, 258n, genConst(cg, 42n)),
							Property_new(cg, 257n, genConst(cg)),
						])).value,
						new BinValue(cg, mod.array.new_fixed(cg.getHeaptype('$Record')!, [
							Property_new(cg, 262n, genConst(cg)),
							Property_new(cg, 256n, genConst(cg, 42n)),
							Property_new(cg, 259n, genConst(cg, 4.2)),
						])).value,
					],
				);
			});
		});

		it('DictNew returns (struct.new) with count and internal array.', () => {
			const {goal, opt, cg} = setupScript(`{
				val mut x: int = 42;
				[a= x, b= 4.2, c= (null,), d= x/2, e= @e];
			}`, {lower: true, codegen: true, build: false});
			const mod = cg.module;
			const WASM_NULL: binaryen.ExpressionRef = mod.ref.null(cg.getReftype('(ref null $Property)')!);
			return assertEqualBins(
				(goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
				new BinValue(cg, mod.struct.new([
					mod.i32.const(5),
					mod.array.new_fixed(cg.getHeaptype('$DictInternal')!, [
						WASM_NULL,
						Property_new(cg, 257n, mod.local.get(0, reftype_value(cg))),
						Property_new(cg, 258n, genConst(cg, 4.2)),
						Property_new(cg, 259n, mod.local.get(1, reftype_value(cg))),
						Property_new(cg, 260n, mod.local.get(2, reftype_value(cg))),
						Property_new(cg, 261n, genConst(cg, Symbol(0x105))),
						WASM_NULL,
						WASM_NULL,
					]),
				], cg.getHeaptype('$Dict')!)).value,
			);
		});

		it('Unop returns custom WASM functions `vnot`, `vemp`, `vneg`.', () => {
			const CALL = {
				vnot: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vnot', [arg], binaryen.v128),
				vemp: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vemp', [arg], binaryen.v128),
				vneg: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vneg', [arg], binaryen.v128),
			} as const;

			const {goal, opt, cg} = setupScript(`{
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
			}`, {lower: true, codegen: false, build: false});
			const mod = cg.module;
			return assertEqualBins(
				goal.children.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
				[
					CALL.vnot(mod, genConst(cg)),
					CALL.vnot(mod, genConst(cg, false)),
					CALL.vnot(mod, genConst(cg, Symbol(0x100))),
					CALL.vnot(mod, genConst(cg, 42n)),
					CALL.vnot(mod, genConst(cg, 4.2)),

					CALL.vemp(mod, genConst(cg)),
					CALL.vemp(mod, genConst(cg, false)),
					CALL.vemp(mod, genConst(cg, Symbol(0x100))),
					CALL.vemp(mod, genConst(cg, 42n)),
					CALL.vemp(mod, genConst(cg, 4.2)),

					CALL.vneg(mod, genConst(cg, 42n)),
					CALL.vneg(mod, genConst(cg, 4.2)),
				].map((code) => new BinValue(cg, code).value),
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

			const {goal, opt, cg} = setupScript(`{
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
			}`, {lower: true, codegen: false, build: false});
			const mod = cg.module;
			return assertEqualBins(
				goal.children.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
				[
					CALL.vadd(mod, genConst(cg, 2n), genConst(cg, 3n)),
					CALL.vmul(mod, genConst(cg, 2n), genConst(cg, 3n)),
					CALL.vdiv(mod, genConst(cg, 2n), genConst(cg, 3n)),
					CALL.vexp(mod, genConst(cg, 2n), genConst(cg, 3n)),

					CALL.vadd(mod, genConst(cg, 2.0), genConst(cg, 3.0)),
					CALL.vmul(mod, genConst(cg, 2.0), genConst(cg, 3.0)),
					CALL.vdiv(mod, genConst(cg, 2.0), genConst(cg, 3.0)),
					CALL.vexp(mod, genConst(cg, 2.0), genConst(cg, 3.0)),

					CALL.vlt(mod, genConst(cg, 2n), genConst(cg, 3.0)),
					CALL.vgt(mod, genConst(cg, 2n), genConst(cg, 3.0)),
					CALL.vle(mod, genConst(cg, 2n), genConst(cg, 3.0)),
					CALL.vge(mod, genConst(cg, 2n), genConst(cg, 3.0)),

					CALL.vid(mod, genConst(cg, 2.0), genConst(cg, 3n)),
					CALL.veq(mod, genConst(cg, 2.0), genConst(cg, 3n)),
				].map((code) => new BinValue(cg, code).value),
			);
		});

		it('Drop returns (drop).', () => {
			const {opt, cg} = setupScript(`{
				null;
				false;
				@hello;
				42;
				4.2;
			}`, {lower: true, codegen: false, build: false});
			const mod = cg.module;
			return assertEqualBins(
				opt.instructions.map((instr) => instr.codegen(cg)),
				[
					mod.drop(genConst(cg)),
					mod.drop(genConst(cg, false)),
					mod.drop(genConst(cg, Symbol(0x100))),
					mod.drop(genConst(cg, 42n)),
					mod.drop(genConst(cg, 4.2)),
				],
			);
		});

		it('Decl returns (local.set).', () => {
			const {opt, cg} = setupScript(`{
				val a: null  = null;
				val b: bool  = false;
				val c: sym   = @hello;
				val d: int   = 42;
				val e: float = 4.2;
			}`, {lower: true, codegen: false, build: false});
			const mod = cg.module;
			return assertEqualBins(
				opt.instructions.map((instr) => instr.codegen(cg)),
				[
					mod.local.set(0, genConst(cg)),
					mod.local.set(1, genConst(cg, false)),
					mod.local.set(2, genConst(cg, Symbol(0x102))),
					mod.local.set(3, genConst(cg, 42n)),
					mod.local.set(4, genConst(cg, 4.2)),
				],
			);
		});

		it('Set returns (local.set).', () => {
			const {opt, cg} = setupScript(`{
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
			}`, {lower: true, codegen: false, build: false});
			const mod = cg.module;
			return assertEqualBins(
				opt.instructions.slice(5).map((instr) => instr.codegen(cg)),
				[
					mod.local.set(0, genConst(cg)),
					mod.local.set(1, genConst(cg, true)),
					mod.local.set(2, genConst(cg, Symbol(0x106))),
					mod.local.set(3, genConst(cg, 43n)),
					mod.local.set(4, genConst(cg, 4.3)),
				],
			);
		});
	});
});

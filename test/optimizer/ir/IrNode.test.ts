import * as assert from 'node:assert';
import * as test from 'node:test';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	type AST,
	VALUE,
	TYPE,
	IR,
	Property_new,
	Builder,
} from '../../../src/index.ts';
import {assertEqualBins} from '../../assert-helpers.ts';
import {
	setupScript,
	genConst,
} from '../../helpers.ts';



test.suite('IrNode', () => {
	test.suite('#codegen', () => {
		test.test('is not yet supported.', () => {
			const {opt, cg} = setupScript(`{
				"hello";
				"""hello {{ 42 }}""";
				{42, 43, 44};
				{"a" -> 42, "b" -> 43, "c" -> 44};
				{42, 43, 44}.[42];
				{"a" -> 42, "b" -> 43, "c" -> 44}.["a"];
				set {42, 43, 44}.[42]                       = false;
				set {"a" -> 42, "b" -> 43, "c" -> 44}.["a"] = 43;
			}`, {lower: true, codegen: false, build: false});
			xjs.Array.forEachAggregated([
				...opt.instructions,
				new IR.Label('label1'),
				new IR.Goto(new IR.Label('label2')),
				new IR.GotoIfFalse(new IR.Const(VALUE.NULL), new IR.Label('label2')),
			], (instr) => assert.throws(() => instr.codegen(cg), /not yet supported/, instr.toString()));

			// more cases
			xjs.Array.forEachAggregated<IR.Instruction>([
				setupScript('{ (42, 43, 44).0; }',                      {lower: true, codegen: false, build: false}).opt.instructions[1], // (TUPLE.GET)
				setupScript('{ (a= 42, b= 43, c= 44).a; }',             {lower: true, codegen: false, build: false}).opt.instructions[1], // (RECORD.GET)
				setupScript('{ [42, 43, 44].[0]; }',                    {lower: true, codegen: false, build: false}).opt.instructions[1], // (LIST.GET)
				setupScript('{ set [42, 43, 44].[0] = 43; }',           {lower: true, codegen: false, build: false}).opt.instructions[1], // (LIST.SET)
				setupScript('{ [a= 42, b= 43, c= 44].[@a]; }',          {lower: true, codegen: false, build: false}).opt.instructions[1], // (DICT.GET)
				setupScript('{ set [a= 42, b= 43, c= 44].[@a] = 43; }', {lower: true, codegen: false, build: false}).opt.instructions[1], // (DICT.SET)
			], (instr) => assert.throws(() => instr.codegen(new Builder()), /not yet supported/, instr.toString()));
		});

		test.test('Trap returns (unreachable).', () => {
			const cg = new Builder();
			return assertEqualBins(new IR.Trap().codegen(cg), cg.module.unreachable());
		});

		test.test('Const returns (v128.const).', () => {
			const {stmts, opt, cg} = setupScript(`{
				null;
				false;
				@hello;
				42;
				4.2;
			}`, {lower: true, codegen: false, build: false});
			return assertEqualBins(
				stmts.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
				[
					genConst(cg),
					genConst(cg, false),
					genConst(cg, Symbol(0x100)),
					genConst(cg, 42n),
					genConst(cg, 4.2),
				],
			);
		});

		test.test('Get returns (local.get).', () => {
			const {stmts, opt, cg} = setupScript(`{
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
				stmts.slice(5).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
				[
					mod.local.get(0, cg.getReftype('(ref $Value)')!),
					mod.local.get(1, cg.getReftype('(ref $Value)')!),
					mod.local.get(2, cg.getReftype('(ref $Value)')!),
					mod.local.get(3, cg.getReftype('(ref $Value)')!),
					mod.local.get(4, cg.getReftype('(ref $Value)')!),
				],
			);
		});

		test.suite('CollectionLinearNew', () => {
			test.test('empty TUPLE.NEW returns (array.new_fixed).', () => {
				const {stmts, opt, cg} = setupScript(`{
					();
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				return assertEqualBins(
					(stmts[0] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					mod.array.new_fixed(cg.getHeaptype('$Tuple')!, []),
				);
			});
			test.test('TUPLE.NEW returns (array.new_fixed).', () => {
				const {stmts, opt, cg} = setupScript(`{
					val mut x: int = 42;
					(x, 4.2, (null,));
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				return assertEqualBins(
					(stmts[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					mod.array.new_fixed(cg.getHeaptype('$Tuple')!, [
						mod.local.get(0, cg.getReftype('(ref $Value)')!),
						genConst(cg, 4.2),
						mod.local.get(1, cg.getReftype('(ref $Value)')!),
					]),
				);
			});
			test.test('LIST.NEW returns (struct.new) with count and internal array.', () => {
				const {stmts, opt, cg} = setupScript(`{
					val mut x: int = 42;
					[x, 4.2, (null,), x/2, @e];
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				const WASM_NULL: binaryen.ExpressionRef = mod.ref.null(cg.getReftype('(ref null $Value)')!);
				return assertEqualBins(
					(stmts[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					mod.struct.new([
						mod.i32.const(5),
						mod.array.new_fixed(cg.getHeaptype('$ListInternal')!, [
							mod.local.get(0, cg.getReftype('(ref null $Value)')!),
							genConst(cg, 4.2),
							mod.local.get(1, cg.getReftype('(ref null $Value)')!),
							mod.local.get(2, cg.getReftype('(ref null $Value)')!),
							genConst(cg, Symbol(0x101)),
							WASM_NULL,
							WASM_NULL,
							WASM_NULL,
						]),
					], cg.getHeaptype('$List')!),
				);
			});
		});

		test.suite('RecordNew', () => {
			test.test('empty RECORD.NEW returns (array.new_fixed).', () => {
				// there exists no syntax for empty records, so constructing it manually
				const cg = new Builder();
				return assertEqualBins(
					new IR.RecordNew(new Map(), new TYPE.Record()).codegen(cg),
					cg.module.array.new_fixed(cg.getHeaptype('$Tuple')!, []),
				);
			});
			test.test('RECORD.NEW returns (array.new_fixed).', () => {
				const {stmts, opt, cg} = setupScript(`{
					val mut x: int = 42;
					(a= x, b= 4.2, c= (null,), d= x/2, e= @e);
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				return assertEqualBins(
					(stmts[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					mod.array.new_fixed(cg.getHeaptype('$Record')!, [
						Property_new(cg, 260n, mod.local.get(2, cg.getReftype('(ref $Value)')!)), // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
						Property_new(cg, 261n, genConst(cg, Symbol(0x105))),
						Property_new(cg, 257n, mod.local.get(0, cg.getReftype('(ref $Value)')!)),
						Property_new(cg, 258n, genConst(cg, 4.2)),
						Property_new(cg, 259n, mod.local.get(1, cg.getReftype('(ref $Value)')!)),
					]),
				);
			});
			test.test('hashing collisions are resolved in source order.', () => {
				const {stmts, opt, cg} = setupScript(`{
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
					stmts.slice(9).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
					[
						mod.array.new_fixed(cg.getHeaptype('$Record')!, [
							Property_new(cg, 258n, genConst(cg, 42n)),
							Property_new(cg, 261n, genConst(cg, false)),
							Property_new(cg, 256n, genConst(cg, 4.2)),
						]),
						mod.array.new_fixed(cg.getHeaptype('$Record')!, [
							Property_new(cg, 261n, genConst(cg, true)),
							Property_new(cg, 258n, genConst(cg, 42n)),
							Property_new(cg, 257n, genConst(cg)),
						]),
						mod.array.new_fixed(cg.getHeaptype('$Record')!, [
							Property_new(cg, 262n, genConst(cg)),
							Property_new(cg, 256n, genConst(cg, 42n)),
							Property_new(cg, 259n, genConst(cg, 4.2)),
						]),
					],
				);
			});
		});

		test.test('DictNew returns (struct.new) with count and internal array.', () => {
			const {stmts, opt, cg} = setupScript(`{
				val mut x: int = 42;
				[a= x, b= 4.2, c= (null,), d= x/2, e= @e];
			}`, {lower: true, codegen: true, build: false});
			const mod = cg.module;
			const WASM_NULL: binaryen.ExpressionRef = mod.ref.null(cg.getReftype('(ref null $Property)')!);
			return assertEqualBins(
				(stmts[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
				mod.struct.new([
					mod.i32.const(5),
					mod.array.new_fixed(cg.getHeaptype('$DictInternal')!, [
						WASM_NULL,
						Property_new(cg, 257n, mod.local.get(0, cg.getReftype('(ref $Value)')!)),
						Property_new(cg, 258n, genConst(cg, 4.2)),
						Property_new(cg, 259n, mod.local.get(1, cg.getReftype('(ref $Value)')!)),
						Property_new(cg, 260n, mod.local.get(2, cg.getReftype('(ref $Value)')!)),
						Property_new(cg, 261n, genConst(cg, Symbol(0x105))),
						WASM_NULL,
						WASM_NULL,
					]),
				], cg.getHeaptype('$Dict')!),
			);
		});

		test.test('Unop returns custom WASM functions `vnot`, `vemp`, `vneg`.', () => {
			const CALL = {
				vtoi: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vtoi', [arg], binaryen.v128),
				vton: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vton', [arg], binaryen.v128),
				vtof: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vtof', [arg], binaryen.v128),
				vnot: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vnot', [arg], binaryen.v128),
				vemp: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vemp', [arg], binaryen.v128),
				vneg: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vneg', [arg], binaryen.v128),
			} as const;

			const {stmts, opt, cg} = setupScript(`{
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

				int   +42;
				int   4.2;
				nat   42;
				nat   4.2;
				float +42;
				float 42;
			}`, {lower: true, codegen: false, build: false});
			const mod = cg.module;
			return assertEqualBins(
				stmts.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
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

					CALL.vtoi(mod, genConst(cg, 42n, 'nat')),
					CALL.vtoi(mod, genConst(cg, 4.2)),
					CALL.vton(mod, genConst(cg, 42n)),
					CALL.vton(mod, genConst(cg, 4.2)),
					CALL.vtof(mod, genConst(cg, 42n, 'nat')),
					CALL.vtof(mod, genConst(cg, 42n)),
				],
			);
		});

		test.test('Binop returns custom WASM functions `viadd`, `vfmul`, etc.', () => {
			const CALL = {
				viadd:   (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('viadd',   [arg0, arg1], binaryen.v128),
				vfadd:   (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vfadd',   [arg0, arg1], binaryen.v128),
				visub_s: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('visub_s', [arg0, arg1], binaryen.v128),
				visub_u: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('visub_u', [arg0, arg1], binaryen.v128),
				vfsub:   (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vfsub',   [arg0, arg1], binaryen.v128),
				vimul:   (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vimul',   [arg0, arg1], binaryen.v128),
				vfmul:   (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vfmul',   [arg0, arg1], binaryen.v128),
				vidiv_s: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vidiv_s', [arg0, arg1], binaryen.v128),
				vidiv_u: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vidiv_u', [arg0, arg1], binaryen.v128),
				vfdiv:   (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vfdiv',   [arg0, arg1], binaryen.v128),
				viexp:   (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('viexp',   [arg0, arg1], binaryen.v128),
				vlt:     (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vlt',     [arg0, arg1], binaryen.v128),
				vgt:     (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vgt',     [arg0, arg1], binaryen.v128),
				vle:     (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vle',     [arg0, arg1], binaryen.v128),
				vge:     (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vge',     [arg0, arg1], binaryen.v128),
				vid:     (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vid',     [arg0, arg1], binaryen.v128),
				veq:     (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('veq',     [arg0, arg1], binaryen.v128),
			} as const;

			const {stmts, opt, cg} = setupScript(`{
				2 + 3;
				2 - 3;
				2 * 3;
				2 / 3;
				2 ^ 3;

				+2 + +3;
				+2 - +3;
				+2 * +3;
				+2 / +3;
				+2 ^ +3;

				2.0 + 3.0;
				2.0 - 3.0;
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
				stmts.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
				[
					CALL.viadd  (mod, genConst(cg, 2n), genConst(cg, 3n)),
					CALL.visub_s(mod, genConst(cg, 2n), genConst(cg, 3n)),
					CALL.vimul  (mod, genConst(cg, 2n), genConst(cg, 3n)),
					CALL.vidiv_s(mod, genConst(cg, 2n), genConst(cg, 3n)),
					CALL.viexp  (mod, genConst(cg, 2n), genConst(cg, 3n)),

					CALL.viadd  (mod, genConst(cg, 2n, 'nat'), genConst(cg, 3n, 'nat')),
					CALL.visub_u(mod, genConst(cg, 2n, 'nat'), genConst(cg, 3n, 'nat')),
					CALL.vimul  (mod, genConst(cg, 2n, 'nat'), genConst(cg, 3n, 'nat')),
					CALL.vidiv_u(mod, genConst(cg, 2n, 'nat'), genConst(cg, 3n, 'nat')),
					CALL.viexp  (mod, genConst(cg, 2n, 'nat'), genConst(cg, 3n, 'nat')),

					CALL.vfadd(mod, genConst(cg, 2.0), genConst(cg, 3.0)),
					CALL.vfsub(mod, genConst(cg, 2.0), genConst(cg, 3.0)),
					CALL.vfmul(mod, genConst(cg, 2.0), genConst(cg, 3.0)),
					CALL.vfdiv(mod, genConst(cg, 2.0), genConst(cg, 3.0)),
					mod.unreachable(),

					CALL.vlt(mod, genConst(cg, 2n), genConst(cg, 3.0)),
					CALL.vgt(mod, genConst(cg, 2n), genConst(cg, 3.0)),
					CALL.vle(mod, genConst(cg, 2n), genConst(cg, 3.0)),
					CALL.vge(mod, genConst(cg, 2n), genConst(cg, 3.0)),

					CALL.vid(mod, genConst(cg, 2.0), genConst(cg, 3n)),
					CALL.veq(mod, genConst(cg, 2.0), genConst(cg, 3n)),
				],
			);
		});

		test.test('Drop returns (drop).', () => {
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

		test.test('Decl returns (local.set).', () => {
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

		test.test('Set returns (local.set).', () => {
			const {opt, cg} = setupScript(`{
				val mut a: null  = null;
				val mut b: bool  = false;
				val mut c: sym   = @hello;
				val mut d: int   = 42;
				val mut e: float = 4.2;

				set a = null;
				set b = true;
				set c = @world;
				set d = 43;
				set e = 4.3;
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

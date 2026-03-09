import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	AST,
	VALUE,
	Optimizer,
	IR,
	Builder,
	BinVect,
} from '../../../src/index.ts';
import type {TypeBuilder} from '../../../src/builder/-types.d.ts';
import {assertEqualBins} from '../../assert-helpers.ts';
import {genConst} from '../../helpers.ts';



describe('IrNode', () => {
	describe('#codegen', () => {
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
				[a= 42, b= 43, c= 44];
				{"a" -> 42, "b" -> 43, "c" -> 44};
				[a= 42, b= 43, c= 44].[@a];
				{42, 43, 44}.[42];
				{"a" -> 42, "b" -> 43, "c" -> 44}.["a"];
				[a= 42, b= 43, c= 44].[@a]              = 43;
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
				setupScript('{ (42, 43, 44).0; }',          {lower: true, codegen: false, build: false}).opt.instructions[1], // (TUPLE.GET)
				setupScript('{ (a= 42, b= 43, c= 44).a; }', {lower: true, codegen: false, build: false}).opt.instructions[1], // (RECORD.GET)
				setupScript('{ [42, 43, 44].[0]; }',        {lower: true, codegen: false, build: false}).opt.instructions[1], // (LIST.GET)
				setupScript('{ [42, 43, 44].[0] = 43; }',   {lower: true, codegen: false, build: false}).opt.instructions[1], // (LIST.SET)
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
					mod.local.get(0, binaryen.v128),
					mod.local.get(1, binaryen.v128),
					mod.local.get(2, binaryen.v128),
					mod.local.get(3, binaryen.v128),
					mod.local.get(4, binaryen.v128),
				],
			);
		});

		describe('CollectionLinearNew', () => {
			let TEST_HEAPTYPE: binaryen.Type; // eslint-disable-line @typescript-eslint/init-declarations
			before(() => {
				// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
				// eslint-disable-next-line
				const tb: TypeBuilder = new binaryen.TypeBuilder(1);
				tb.setStructType(0, []);
				TEST_HEAPTYPE = tb.buildAndDispose()[0];
			});
			it('empty TUPLE.NEW returns (struct.new_default).', () => {
				const {goal, opt, cg} = setupScript(`{
					();
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				return assertEqualBins(
					(goal.children[0] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					mod.struct.new_default(TEST_HEAPTYPE),
				);
			});
			it('TUPLE.NEW returns (struct.new).', () => {
				const {goal, opt, cg} = setupScript(`{
					val mut x: int = 42;
					(x, 4.2, (null,));
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				return assertEqualBins(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					mod.struct.new([
						mod.local.get(0, binaryen.v128),
						genConst(mod, 4.2),
						mod.local.get(1, binaryen.anyref),
					], TEST_HEAPTYPE),
				);
			});
			it('LIST.NEW returns (struct.new) with count and internal array.', () => {
				const {goal, opt, cg} = setupScript(`{
					val mut x: int = 42;
					[x, 4.2, (null,), x/2, @e];
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
				// eslint-disable-next-line
				const app_tb: TypeBuilder = new binaryen.TypeBuilder(3); // TODO: a type-builder like this is used in application code. make a utility!
				app_tb.setStructType(0, [binaryen.i32, binaryen.v128, binaryen.eqref].map((type, i) => ({
					type,
					// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
					// eslint-disable-next-line
					packedType: i === 0 ? binaryen.i8 : binaryen.notPacked,
					mutable:    false,
				})));
				app_tb.setArrayType(
					1,
					app_tb.getTempRefType(app_tb.getTempHeapType(0), true),
					// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
					// eslint-disable-next-line
					binaryen.notPacked,
					true,
				);
				app_tb.setStructType(2, [binaryen.v128, app_tb.getTempRefType(app_tb.getTempHeapType(1), false)].map((type) => ({
					type,
					// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
					// eslint-disable-next-line
					packedType: binaryen.notPacked,
					mutable:    true,
				})));
				const [entry_type, internalarray_type, list_type] = app_tb.buildAndDispose();
				function Entry_primitive(code: binaryen.ExpressionRef): binaryen.ExpressionRef { // TODO: make these utilities!
					return mod.struct.new([
						mod.i32.const(0),
						code,
						mod.ref.null(binaryen.eqref),
					], entry_type);
				}
				function Entry_composite(code: binaryen.ExpressionRef): binaryen.ExpressionRef {
					return mod.struct.new([
						mod.i32.const(1),
						mod.v128.const(new Uint8Array(16)),
						code,
					], entry_type);
				}
				return assertEqualBins(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					mod.block(null, [
						mod.local.set(3, mod.array.new_default(internalarray_type, mod.i32.const(8))),
						...[
							Entry_primitive(mod.local.get(0, binaryen.v128)),
							Entry_primitive(genConst(mod, 4.2)),
							Entry_composite(mod.local.get(1, binaryen.anyref)), // composite
							Entry_primitive(mod.local.get(2, binaryen.v128)),
							Entry_primitive(genConst(mod, Symbol(0x101))),
						].map((code, i) => mod.array.set(mod.local.get(3, internalarray_type), mod.i32.const(i), code)),
						mod.struct.new([
							new BinVect(mod, mod.i32.const(5)).vect,
							mod.local.get(3, internalarray_type),
						], list_type),
					], list_type),
				);
			});
		});

		describe('RecordNew', () => {
			let TEST_HEAPTYPE: binaryen.Type; // eslint-disable-line @typescript-eslint/init-declarations
			before(() => {
				// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
				// eslint-disable-next-line
				const tb: TypeBuilder = new binaryen.TypeBuilder(1);
				tb.setStructType(0, []);
				TEST_HEAPTYPE = tb.buildAndDispose()[0];
			});
			it('empty record returns (struct.new_default).', () => {
				const {goal, opt, cg} = setupScript(`{
					();
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				return assertEqualBins(
					(goal.children[0] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					mod.struct.new_default(TEST_HEAPTYPE),
				);
			});
			it('record returns (struct.new).', () => {
				const {goal, opt, cg} = setupScript(`{
					val mut x: int = 42;
					(a= x, b= 4.2, c= (null,), d= x/2, e= @e);
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
				// eslint-disable-next-line
				const entry_tb: TypeBuilder = new binaryen.TypeBuilder(2);
				[binaryen.v128, binaryen.structref].forEach((valuetype, i) => entry_tb.setStructType(i, [binaryen.i64, valuetype].map((type) => ({
					type,
					// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
					// eslint-disable-next-line
					packedType: binaryen.notPacked,
					mutable:    false,
				}))));
				const registry: readonly binaryen.Type[] = entry_tb.buildAndDispose();
				return assertEqualBins(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					mod.struct.new([
						mod.struct.new([mod.i64.const(260, 0), mod.local.get(2, binaryen.v128)],   registry[0]), // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
						mod.struct.new([mod.i64.const(261, 0), genConst(mod, Symbol(0x105))],      registry[0]),
						mod.struct.new([mod.i64.const(257, 0), mod.local.get(0, binaryen.v128)],   registry[0]),
						mod.struct.new([mod.i64.const(258, 0), genConst(mod, 4.2)],                registry[0]),
						mod.struct.new([mod.i64.const(259, 0), mod.local.get(1, binaryen.anyref)], registry[1]),
					], TEST_HEAPTYPE),
				);
			});
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
					mod.drop(genConst(mod)),
					mod.drop(genConst(mod, false)),
					mod.drop(genConst(mod, Symbol(0x100))),
					mod.drop(genConst(mod, 42n)),
					mod.drop(genConst(mod, 4.2)),
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
					mod.local.set(0, genConst(mod)),
					mod.local.set(1, genConst(mod, false)),
					mod.local.set(2, genConst(mod, Symbol(0x102))),
					mod.local.set(3, genConst(mod, 42n)),
					mod.local.set(4, genConst(mod, 4.2)),
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

import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	AST,
	VALUE,
	TYPE,
	Optimizer,
	IR,
	BinValue,
	Builder,
	BinVect,
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
				setupScript('{ [42, 43, 44].[0] = 43; }',           {lower: true, codegen: false, build: false}).opt.instructions[1], // (LIST.SET)
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
			it('empty TUPLE.NEW', () => {
				const {goal, opt, cg} = setupScript(`{
					();
				}`, {lower: true, codegen: false, build: false});
				return assertEqualBins(
					(goal.children[0] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, cg.codegenTuple()).value,
				);
			});
			it('nonempty TUPLE.NEW', () => {
				const {goal, opt, cg} = setupScript(`{
					val mut x: int = 42;
					(x, 4.2, (null,));
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				return assertEqualBins(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, cg.codegenTuple([
						mod.local.get(0, reftype_value(cg)),
						genConst(cg, 4.2),
						mod.local.get(1, reftype_value(cg)),
					])).value,
				);
			});
			it('LIST.NEW', () => {
				const {goal, opt, cg} = setupScript(`{
					val mut x: int = 42;
					[x, 4.2, (null,), x/2, @e];
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				return assertEqualBins(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, cg.codegenList([
						mod.local.get(0, reftype_value(cg, true)),
						genConst(cg, 4.2),
						mod.local.get(1, reftype_value(cg, true)),
						mod.local.get(2, reftype_value(cg, true)),
						genConst(cg, Symbol(0x101)),
					])).value,
				);
			});
		});

		describe('RecordNew', () => {
			it('empty RECORD.NEW', () => {
				// there exists no syntax for empty records, so constructing it manually
				const cg = new Builder();
				return assertEqualBins(
					new IR.RecordNew(new Map(), new TYPE.Record()).codegen(cg),
					new BinValue(cg, cg.codegenRecord()).value,
				);
			});
			it('nonempty RECORD.NEW', () => {
				const {goal, opt, cg} = setupScript(`{
					val mut x: int = 42;
					(a= x, b= 4.2, c= (null,), d= x/2, e= @e);
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				return assertEqualBins(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, cg.codegenRecord(new Map([
						[257n, new BinValue(cg, mod.local.get(0, reftype_value(cg))).toProperty(257n)],
						[258n, new BinValue(cg, genConst(cg, 4.2))                  .toProperty(258n)],
						[259n, new BinValue(cg, mod.local.get(1, reftype_value(cg))).toProperty(259n)],
						[260n, new BinValue(cg, mod.local.get(2, reftype_value(cg))).toProperty(260n)], // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
						[261n, new BinValue(cg, genConst(cg, Symbol(0x105)))        .toProperty(261n)],
					]))).value,
				);
			});
			it('inserts keys in source order.', () => {
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
					(a= 42, aa= false, b= 4.2);  % (258, 261, 256)
					(aa= true, c= null, a= 42);  % (261, 257, 258)
					(b= 42, bb= 4.2, bbb= null); % (256, 259, 262)
				}`, {lower: true, codegen: true, build: false});
				return assertEqualBins(
					goal.children.slice(9).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
					[new Map([
						// (a= 42, aa= false, b= 4.2);  % (258, 261, 256)
						[258n, new BinValue(cg, genConst(cg, 42n))  .toProperty(258n)],
						[261n, new BinValue(cg, genConst(cg, false)).toProperty(261n)],
						[256n, new BinValue(cg, genConst(cg, 4.2))  .toProperty(256n)],
					]), new Map([
						// (aa= true, c= null, a= 42);  % (261, 257, 258)
						[261n, new BinValue(cg, genConst(cg, true)).toProperty(261n)],
						[257n, new BinValue(cg, genConst(cg))      .toProperty(257n)],
						[258n, new BinValue(cg, genConst(cg, 42n)) .toProperty(258n)],
					]), new Map([
						// (b= 42, bb= 4.2, bbb= null); % (256, 259, 262)
						[256n, new BinValue(cg, genConst(cg, 42n)).toProperty(256n)],
						[259n, new BinValue(cg, genConst(cg, 4.2)).toProperty(259n)],
						[262n, new BinValue(cg, genConst(cg))     .toProperty(262n)],
					])].map((props) => new BinValue(cg, cg.codegenRecord(props)).value),
				);
			});
		});

		describe('DictNew', () => {
			it('DICT.NEW', () => {
				const {goal, opt, cg} = setupScript(`{
					val mut x: int = 42;
					[a= x, b= 4.2, c= (null,), d= x/2, e= @e];
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				return assertEqualBins(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, cg.codegenDict(new Map([
						[257n, new BinValue(cg, mod.local.get(0, reftype_value(cg))).toProperty(257n)],
						[258n, new BinValue(cg, genConst(cg, 4.2))                  .toProperty(258n)],
						[259n, new BinValue(cg, mod.local.get(1, reftype_value(cg))).toProperty(259n)],
						[260n, new BinValue(cg, mod.local.get(2, reftype_value(cg))).toProperty(260n)],
						[261n, new BinValue(cg, genConst(cg, Symbol(0x105)))        .toProperty(261n)],
					]))).value,
				);
			});
			it('inserts keys in source order.', () => {
				const {goal, opt, cg} = setupScript(`{
					% sym  | id  | mod 8
					% ---- | --- | ----
					@b;    % 256 % 0
					@c;    % 257 % 1
					@a;    % 258 % 2
					@bb;   % 259 % 3
					@cc;   % 260 % 4
					@aa;   % 261 % 5
					@bbb;  % 262 % 6
					@ccc;  % 263 % 7
					@aaa;  % 264 % 0
					[a= 42, aa= false, b= 4.2]; % (258, 261, 256)
					[aa= true, c= null, a= 42]; % (261, 257, 258)
					[b= 42, c= 4.2, aaa= null]; % (256, 257, 264)
				}`, {lower: true, codegen: true, build: false});
				return assertEqualBins(
					goal.children.slice(9).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
					[new Map([
						// [a= 42, aa= false, b= 4.2]; % (258, 261, 256)
						[258n, new BinValue(cg, genConst(cg, 42n))  .toProperty(258n)],
						[261n, new BinValue(cg, genConst(cg, false)).toProperty(261n)],
						[256n, new BinValue(cg, genConst(cg, 4.2))  .toProperty(256n)],
					]), new Map([
						// [aa= true, c= null, a= 42]; % (261, 257, 258)
						[261n, new BinValue(cg, genConst(cg, true)).toProperty(261n)],
						[257n, new BinValue(cg, genConst(cg))      .toProperty(257n)],
						[258n, new BinValue(cg, genConst(cg, 42n)) .toProperty(258n)],
					]), new Map([
						// [b= 42, c= 4.2, aaa= null]; % (256, 257, 264)
						[256n, new BinValue(cg, genConst(cg, 42n)).toProperty(256n)],
						[257n, new BinValue(cg, genConst(cg, 4.2)).toProperty(257n)],
						[264n, new BinValue(cg, genConst(cg))     .toProperty(264n)],
					])].map((props) => new BinValue(cg, cg.codegenDict(props)).value),
				);
			});
		});

		it('TupleGet returns (array.get).', () => {
			const {opt, cg} = setupScript(`{
				val mut x:   int                = 42;
				val mut tup: (int, int, ?: int) = (42, 43);

				(x, 43, 44).2;
				tup.0;
				tup.1;
			}`, {lower: true, codegen: false, build: false});
			const mod = cg.module;
			const rt_tuple: binaryen.Type = cg.getReftype('(ref $Tuple)')!;
			opt.instructions.slice(0, 3).map((instr) => instr.codegen(cg));
			return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
				mod.drop(mod.array.get(
					mod.ref.cast(new BinValue(cg, mod.local.get(2, reftype_value(cg))).compositeValue, rt_tuple),
					mod.i32.const(2),
					rt_tuple,
				)),
				mod.drop(mod.array.get(
					mod.ref.cast(new BinValue(cg, mod.local.get(1, reftype_value(cg))).compositeValue, rt_tuple),
					mod.i32.const(0),
					rt_tuple,
				)),
				mod.drop(mod.array.get(
					mod.ref.cast(new BinValue(cg, mod.local.get(1, reftype_value(cg))).compositeValue, rt_tuple),
					mod.i32.const(1),
					rt_tuple,
				)),
			]);
		});

		it('RecordGet returns (call $retrieve-entry-record).', () => {
			const {opt, cg} = setupScript(`{
				val mut x:   int                       = 42;
				val mut rec: (a: int, b: int, c?: int) = (a= 42, b= 43);

				(a= x, b= 43, c= 44).c;
				rec.a;
				rec.b;
			}`, {lower: true, codegen: false, build: false});
			const mod = cg.module;
			const rt_record: binaryen.Type = cg.getReftype('(ref $Record)')!;
			opt.instructions.slice(0, 3).map((instr) => instr.codegen(cg));
			return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
				mod.drop(mod.call('retrieve-entry-record', [
					mod.ref.cast(new BinValue(cg, mod.local.get(2, reftype_value(cg))).compositeValue, rt_record),
					mod.i32.const(0x103),
				], reftype_value(cg))),
				mod.drop(mod.call('retrieve-entry-record', [
					mod.ref.cast(new BinValue(cg, mod.local.get(1, reftype_value(cg))).compositeValue, rt_record),
					mod.i32.const(0x101),
				], reftype_value(cg))),
				mod.drop(mod.call('retrieve-entry-record', [
					mod.ref.cast(new BinValue(cg, mod.local.get(1, reftype_value(cg))).compositeValue, rt_record),
					mod.i32.const(0x102),
				], reftype_value(cg))),
			]);
		});

		describe('CollectionDynamicGet', () => {
			it('LIST.GET', () => {
				const {opt, cg} = setupScript(`{
					val mut x:    int   = 42;
					val mut list: [int] = [42, 43];

					[x, 43, 44].[1 + 1];
					list.[0];
					list.[3];
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				const rt_list:          binaryen.Type = cg.getReftype('(ref $List)')!;
				const rt_list_internal: binaryen.Type = cg.getReftype('(ref $ListInternal)')!;
				opt.instructions.slice(0, 4).map((instr) => instr.codegen(cg));
				return assertEqualBins(opt.instructions.slice(4).map((instr) => instr.codegen(cg)), [
					mod.drop(mod.block(null, [
						mod.local.set(4, mod.array.get(
							mod.struct.get(
								1,
								mod.ref.cast(new BinValue(cg, mod.local.get(2, reftype_value(cg))).compositeValue, rt_list),
								rt_list,
							),
							new BinVect(mod, new BinValue(cg, mod.local.get(3, reftype_value(cg))).primitiveValue).intValue,
							rt_list_internal,
						)),
						cg.module.if(
							cg.module.ref.is_null(mod.local.get(4, reftype_value(cg))),
							genConst(cg),
							cg.module.ref.as_non_null(mod.local.get(4, reftype_value(cg))),
						),
					], reftype_value(cg))),
					mod.drop(mod.block(null, [
						mod.local.set(5, mod.array.get(
							mod.struct.get(
								1,
								mod.ref.cast(new BinValue(cg, mod.local.get(1, reftype_value(cg))).compositeValue, rt_list),
								rt_list,
							),
							new BinVect(mod, new BinValue(cg, genConst(cg, 0n)).primitiveValue).intValue,
							rt_list_internal,
						)),
						cg.module.if(
							cg.module.ref.is_null(mod.local.get(5, reftype_value(cg, true))),
							genConst(cg),
							cg.module.ref.as_non_null(mod.local.get(5, reftype_value(cg, true))),
						),
					], reftype_value(cg))),
					mod.drop(mod.block(null, [
						mod.local.set(6, mod.array.get(
							mod.struct.get(
								1,
								mod.ref.cast(new BinValue(cg, mod.local.get(1, reftype_value(cg))).compositeValue, rt_list),
								rt_list,
							),
							new BinVect(mod, new BinValue(cg, genConst(cg, 3n)).primitiveValue).intValue,
							rt_list_internal,
						)),
						cg.module.if(
							cg.module.ref.is_null(mod.local.get(6, reftype_value(cg, true))),
							genConst(cg),
							cg.module.ref.as_non_null(mod.local.get(6, reftype_value(cg, true))),
						),
					], reftype_value(cg))),
				]);
			});
			it('DICT.GET', () => {
				const {opt, cg} = setupScript(`{
					val mut x:    int    = 42;
					val mut dict: [:int] = [a= 42, c= 43];

					[a= x, b= 43, c= 44].[@b];
					dict.[@a];
					dict.[@c];
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				const rt_dict: binaryen.Type = cg.getReftype('(ref $Dict)')!;
				opt.instructions.slice(0, 3).map((instr) => instr.codegen(cg));
				return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
					mod.drop(mod.block(null, [
						mod.local.set(3, mod.call('retrieve-entry-dict', [
							mod.ref.cast(new BinValue(cg, mod.local.get(2, reftype_value(cg))).compositeValue, rt_dict),
							new BinVect(mod, new BinValue(cg, genConst(cg, Symbol(0x104))).primitiveValue).intValue,
						], reftype_value(cg, true))),
						cg.module.if(
							cg.module.ref.is_null(mod.local.get(3, reftype_value(cg))),
							genConst(cg),
							cg.module.ref.as_non_null(mod.local.get(3, reftype_value(cg))),
						),
					], reftype_value(cg))),
					mod.drop(mod.block(null, [
						mod.local.set(4, mod.call('retrieve-entry-dict', [
							mod.ref.cast(new BinValue(cg, mod.local.get(1, reftype_value(cg))).compositeValue, rt_dict),
							new BinVect(mod, new BinValue(cg, genConst(cg, Symbol(0x101))).primitiveValue).intValue,
						], reftype_value(cg, true))),
						cg.module.if(
							cg.module.ref.is_null(mod.local.get(4, reftype_value(cg, true))),
							genConst(cg),
							cg.module.ref.as_non_null(mod.local.get(4, reftype_value(cg, true))),
						),
					], reftype_value(cg))),
					mod.drop(mod.block(null, [
						mod.local.set(5, mod.call('retrieve-entry-dict', [
							mod.ref.cast(new BinValue(cg, mod.local.get(1, reftype_value(cg))).compositeValue, rt_dict),
							new BinVect(mod, new BinValue(cg, genConst(cg, Symbol(0x102))).primitiveValue).intValue,
						], reftype_value(cg))),
						cg.module.if(
							cg.module.ref.is_null(mod.local.get(5, reftype_value(cg, true))),
							genConst(cg),
							cg.module.ref.as_non_null(mod.local.get(5, reftype_value(cg, true))),
						),
					], reftype_value(cg))),
				]);
			});
		});

		it('Unop returns custom WASM functions `vnot`, `vemp`, `vneg`.', () => {
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
			const CALL = {
				vnot: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vnot_', [arg], reftype_value(cg)),
				vemp: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vemp_', [arg], reftype_value(cg)),
				vneg: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vneg_', [arg], reftype_value(cg)),
			} as const;
			return assertEqualBins(
				goal.children.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
				[
					CALL.vnot(genConst(cg)),
					CALL.vnot(genConst(cg, false)),
					CALL.vnot(genConst(cg, Symbol(0x100))),
					CALL.vnot(genConst(cg, 42n)),
					CALL.vnot(genConst(cg, 4.2)),

					CALL.vemp(genConst(cg)),
					CALL.vemp(genConst(cg, false)),
					CALL.vemp(genConst(cg, Symbol(0x100))),
					CALL.vemp(genConst(cg, 42n)),
					CALL.vemp(genConst(cg, 4.2)),

					CALL.vneg(genConst(cg, 42n)),
					CALL.vneg(genConst(cg, 4.2)),
				],
			);
		});

		it('Binop returns custom WASM functions `viadd`, `vfmul`, etc.', () => {
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
			const CALL = {
				vadd: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vadd_', [arg0, arg1], reftype_value(cg)),
				vmul: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vmul_', [arg0, arg1], reftype_value(cg)),
				vdiv: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vdiv_', [arg0, arg1], reftype_value(cg)),
				vexp: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vexp_', [arg0, arg1], reftype_value(cg)),
				vlt:  (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vlt_',  [arg0, arg1], reftype_value(cg)),
				vgt:  (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vgt_',  [arg0, arg1], reftype_value(cg)),
				vle:  (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vle_',  [arg0, arg1], reftype_value(cg)),
				vge:  (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vge_',  [arg0, arg1], reftype_value(cg)),
				vid:  (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vid_',  [arg0, arg1], reftype_value(cg)),
				veq:  (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('veq_',  [arg0, arg1], reftype_value(cg)),
			} as const;
			return assertEqualBins(
				goal.children.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
				[
					CALL.vadd(genConst(cg, 2n), genConst(cg, 3n)),
					CALL.vmul(genConst(cg, 2n), genConst(cg, 3n)),
					CALL.vdiv(genConst(cg, 2n), genConst(cg, 3n)),
					CALL.vexp(genConst(cg, 2n), genConst(cg, 3n)),

					CALL.vadd(genConst(cg, 2.0), genConst(cg, 3.0)),
					CALL.vmul(genConst(cg, 2.0), genConst(cg, 3.0)),
					CALL.vdiv(genConst(cg, 2.0), genConst(cg, 3.0)),
					CALL.vexp(genConst(cg, 2.0), genConst(cg, 3.0)),

					CALL.vlt(genConst(cg, 2n), genConst(cg, 3.0)),
					CALL.vgt(genConst(cg, 2n), genConst(cg, 3.0)),
					CALL.vle(genConst(cg, 2n), genConst(cg, 3.0)),
					CALL.vge(genConst(cg, 2n), genConst(cg, 3.0)),

					CALL.vid(genConst(cg, 2.0), genConst(cg, 3n)),
					CALL.veq(genConst(cg, 2.0), genConst(cg, 3n)),
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
					mod.drop(genConst(cg)),
					mod.drop(genConst(cg, false)),
					mod.drop(genConst(cg, Symbol(0x100))),
					mod.drop(genConst(cg, 42n)),
					mod.drop(genConst(cg, 4.2)),
				],
			);
		});

		it('Decl & Set both return (local.set).', () => {
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
				opt.instructions.map((instr) => instr.codegen(cg)), // TODO: `opt.codegen()`
				[
					mod.local.set(0, genConst(cg)),
					mod.local.set(1, genConst(cg, false)),
					mod.local.set(2, genConst(cg, Symbol(0x102))),
					mod.local.set(3, genConst(cg, 42n)),
					mod.local.set(4, genConst(cg, 4.2)),

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

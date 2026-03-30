import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	AST,
	VALUE,
	TYPE,
	Optimizer,
	IR,
	STRUCT_FIELD,
	BinValue,
	Builder,
	BinVect,
} from '../../../src/index.ts';
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
			cg.setupModule();
			'lower'   in opts && opts.lower   && goal.lower(opt);
			'codegen' in opts && opts.codegen && opt.instructions.map((instr) => instr.codegen(cg));
			return {goal, opt, cg};
		}

		it('is not yet supported.', () => {
			const {opt, cg} = setupScript(`{
				"hello";
				"""hello {{ 42 }}""";
			}`, {lower: true, codegen: false, build: false});
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
			const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
			opt.instructions.slice(0, 5).map((instr) => instr.codegen(cg));
			return assertEqualBins(
				goal.children.slice(5).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
				[
					mod.local.get(0, rt_value),
					mod.local.get(1, rt_value),
					mod.local.get(2, rt_value),
					mod.local.get(3, rt_value),
					mod.local.get(4, rt_value),
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
				const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
				return assertEqualBins(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, cg.codegenTuple([
						mod.local.get(0, rt_value),
						genConst(cg, 4.2),
						mod.local.get(1, rt_value),
					])).value,
				);
			});
			it('empty LIST.NEW', () => {
				const {goal, opt, cg} = setupScript(`{
					[];
				}`, {lower: true, codegen: true, build: false});
				return assertEqualBins(
					(goal.children[0] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, cg.codegenList()).value,
				);
			});
			it('nonempty LIST.NEW', () => {
				const {goal, opt, cg} = setupScript(`{
					val mut x: int = 42;
					[x, 4.2, (null,), x/2, @e];
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				const rt_n_value: binaryen.Type = cg.getReftype('(ref null $Value)');
				return assertEqualBins(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, cg.codegenList([
						mod.local.get(0, rt_n_value),
						genConst(cg, 4.2),
						mod.local.get(1, rt_n_value),
						mod.local.get(2, rt_n_value),
						genConst(cg, Symbol(0x101)),
					])).value,
				);
			});
			it('empty SET.NEW', () => {
				const {goal, opt, cg} = setupScript(`{
					{};
				}`, {lower: true, codegen: true, build: false});
				return assert.strictEqual(
					binaryen.emitText((goal.children[0] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
					binaryen.emitText(new IR.MapNew(new Map(), new TYPE.Map(TYPE.INT, TYPE.FLOAT)).codegen(cg)).replaceAll('$1', '$0'),
				);
			});
			it('nonempty SET.NEW', () => {
				const {goal, opt, cg} = setupScript(`{
					val mut x: int = 42;
					{x, 4.2, (null,), x/2, @e};
					{x -> null, 4.2 -> null, (null,) -> null, x/2 -> null, @e -> null};
				}`, {lower: true, codegen: true, build: false});
				return assert.strictEqual(
					binaryen.emitText((goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
					binaryen.emitText((goal.children[2] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)).replaceAll('$4', '$1').replaceAll('$5', '$2').replaceAll('$6', '$3'),
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
				const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
				return assertEqualBins(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, cg.codegenRecord(new Map([
						[257n, new BinValue(cg, mod.local.get(0, rt_value)) .toProperty(257n)],
						[258n, new BinValue(cg, genConst(cg, 4.2))          .toProperty(258n)],
						[259n, new BinValue(cg, mod.local.get(1, rt_value)) .toProperty(259n)],
						[260n, new BinValue(cg, mod.local.get(2, rt_value)) .toProperty(260n)], // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
						[261n, new BinValue(cg, genConst(cg, Symbol(0x105))).toProperty(261n)],
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
			it('empty DICT.NEW', () => {
				// there exists no syntax for empty Dicts, so constructing it manually
				const cg = new Builder();
				cg.setupModule();
				return assertEqualBins(
					new IR.DictNew(new Map(), new TYPE.Dict(TYPE.INT)).codegen(cg),
					new BinValue(cg, cg.codegenDict()).value,
				);
			});
			it('nonempty DICT.NEW', () => {
				const {goal, opt, cg} = setupScript(`{
					val mut x: int = 42;
					[a= x, b= 4.2, c= (null,), d= x/2, e= @e];
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
				return assertEqualBins(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, cg.codegenDict(new Map([
						[257n, new BinValue(cg, mod.local.get(0, rt_value)) .toProperty(257n)],
						[258n, new BinValue(cg, genConst(cg, 4.2))          .toProperty(258n)],
						[259n, new BinValue(cg, mod.local.get(1, rt_value)) .toProperty(259n)],
						[260n, new BinValue(cg, mod.local.get(2, rt_value)) .toProperty(260n)],
						[261n, new BinValue(cg, genConst(cg, Symbol(0x105))).toProperty(261n)],
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

		describe('MapNew', () => {
			it('empty MAP.NEW', () => {
				// there exists no syntax for empty Maps, so constructing it manually
				const cg = new Builder();
				cg.setupModule();
				return assert.strictEqual(
					binaryen.emitText(new IR.MapNew(new Map(), new TYPE.Map(TYPE.INT, TYPE.FLOAT)).codegen(cg)),
					binaryen.emitText(new BinValue(cg, cg.codegenMap()).value).replaceAll('$1', '$0'),
				);
			});
			it('nonempty MAP.NEW', () => {
				const {goal, opt, cg} = setupScript(`{
					val mut x: int = 42;
					{1.1 -> x, 2.2 -> 4.2, 3.3 -> (null,), 4.4 -> x/2, 5.5 -> @e};
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
				return assert.strictEqual(
					binaryen.emitText((goal.children[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
					binaryen.emitText(new BinValue(cg, cg.codegenMap(new Map([
						[genConst(cg, 1.1), new BinValue(cg, mod.local.get(0, rt_value)).value],
						[genConst(cg, 2.2), genConst(cg, 4.2)],
						[genConst(cg, 3.3), new BinValue(cg, mod.local.get(1, rt_value)).value],
						[genConst(cg, 4.4), new BinValue(cg, mod.local.get(2, rt_value)).value], // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
						[genConst(cg, 5.5), genConst(cg, Symbol(0x101))],
					]))).value).replaceAll('$4', '$3'),
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
			const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
			opt.instructions.slice(0, 3).map((instr) => instr.codegen(cg));
			return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
				mod.drop(mod.array.get(
					new BinValue(cg, mod.local.get(2, rt_value)).cast('(ref $Tuple)'),
					mod.i32.const(2),
					rt_value,
				)),
				mod.drop(mod.array.get(
					new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $Tuple)'),
					mod.i32.const(0),
					rt_value,
				)),
				mod.drop(mod.array.get(
					new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $Tuple)'),
					mod.i32.const(1),
					rt_value,
				)),
			]);
		});

		it('RecordGet returns (call $Record.get).', () => {
			const {opt, cg} = setupScript(`{
				val mut x:   int                       = 42;
				val mut rec: (a: int, b: int, c?: int) = (a= 42, b= 43);

				(a= x, b= 43, c= 44).c;
				rec.a;
				rec.b;
			}`, {lower: true, codegen: false, build: false});
			const mod = cg.module;
			const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
			opt.instructions.slice(0, 3).map((instr) => instr.codegen(cg));
			return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
				mod.drop(mod.call('Record.get', [
					new BinValue(cg, mod.local.get(2, rt_value)).cast('(ref $Record)'),
					mod.i64.const(0x103, 0), // TODO: `bigint_to_i64` unsigned
				], rt_value)),
				mod.drop(mod.call('Record.get', [
					new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $Record)'),
					mod.i64.const(0x101, 0), // TODO: `bigint_to_i64` unsigned
				], rt_value)),
				mod.drop(mod.call('Record.get', [
					new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $Record)'),
					mod.i64.const(0x102, 0), // TODO: `bigint_to_i64` unsigned
				], rt_value)),
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
					list.[-1];
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				const rt_value:   binaryen.Type = cg.getReftype('(ref $Value)');
				const rt_n_value: binaryen.Type = cg.getReftype('(ref null $Value)');
				opt.instructions.slice(0, 4).map((instr) => instr.codegen(cg));
				mod.i32.wrap = (x) => x; // TODO: HACK: remove in v0.5
				return assertEqualBins(opt.instructions.slice(4).map((instr) => instr.codegen(cg)), [
					mod.drop(mod.block(null, [
						mod.local.set(4, mod.array.get(
							cg.getListInternal(new BinValue(cg, mod.local.get(2, rt_value)).cast('(ref $List)')),
							mod.i32.wrap(new BinValue(cg, mod.local.get(3, rt_value)).interpret('intValue')),
							rt_n_value,
						)),
						mod.if(
							mod.ref.is_null(mod.local.get(4, rt_value)),
							genConst(cg),
							mod.ref.as_non_null(mod.local.get(4, rt_value)),
						),
					], rt_value)),
					mod.drop(mod.block(null, [
						mod.local.set(5, mod.array.get(
							cg.getListInternal(new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $List)')),
							mod.i32.wrap(new BinValue(cg, genConst(cg, 0n)).interpret('intValue')),
							rt_n_value,
						)),
						mod.if(
							mod.ref.is_null(mod.local.get(5, rt_n_value)),
							genConst(cg),
							mod.ref.as_non_null(mod.local.get(5, rt_n_value)),
						),
					], rt_value)),
					mod.drop(mod.block(null, [
						mod.local.set(6, mod.array.get(
							cg.getListInternal(new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $List)')),
							mod.i32.wrap(new BinValue(cg, genConst(cg, 3n)).interpret('intValue')),
							rt_n_value,
						)),
						mod.if(
							mod.ref.is_null(mod.local.get(6, rt_n_value)),
							genConst(cg),
							mod.ref.as_non_null(mod.local.get(6, rt_n_value)),
						),
					], rt_value)),
					// FIXME: negative indexes `-i` should access at `array.length - i`
					mod.drop(mod.block(null, [
						mod.local.set(7, mod.array.get(
							cg.getListInternal(new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $List)')),
							mod.i32.wrap(new BinValue(cg, genConst(cg, -1n)).interpret('intValue')),
							rt_n_value,
						)),
						mod.if(
							mod.ref.is_null(mod.local.get(7, rt_n_value)),
							genConst(cg),
							mod.ref.as_non_null(mod.local.get(7, rt_n_value)),
						),
					], rt_value)),
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
				const rt_value:      binaryen.Type = cg.getReftype('(ref $Value)');
				const rt_n_property: binaryen.Type = cg.getReftype('(ref null $Property)');
				opt.instructions.slice(0, 3).map((instr) => instr.codegen(cg));
				return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
					mod.drop(mod.block(null, [
						mod.local.set(3, mod.tuple.extract(mod.call('Dict.find', [
							new BinValue(cg, mod.local.get(2, rt_value)).cast('(ref $Dict)'),
							mod.i64.extend_u(new BinValue(cg, genConst(cg, Symbol(0x104))).interpret('intValue')), // TODO: v0.5: intValue will already be i64; remove `mod.i64.extend_u()` call
						], binaryen.createType([binaryen.i32, rt_n_property])), 1)),
						mod.if(
							mod.i32.or(
								mod.ref.is_null(mod.local.get(3, rt_n_property)),
								mod.call('Property.is-tombstone', [mod.local.get(3, rt_n_property)], binaryen.i32),
							),
							genConst(cg),
							mod.struct.get(STRUCT_FIELD.PROPERTY_VAL, mod.local.get(3, rt_n_property), rt_value),
						),
					], rt_value)),
					mod.drop(mod.block(null, [
						mod.local.set(4, mod.tuple.extract(mod.call('Dict.find', [
							new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $Dict)'),
							mod.i64.extend_u(new BinValue(cg, genConst(cg, Symbol(0x101))).interpret('intValue')), // TODO: v0.5: intValue will already be i64; remove `mod.i64.extend_u()` call
						], binaryen.createType([binaryen.i32, rt_n_property])), 1)),
						mod.if(
							mod.i32.or(
								mod.ref.is_null(mod.local.get(4, rt_n_property)),
								mod.call('Property.is-tombstone', [mod.local.get(4, rt_n_property)], binaryen.i32),
							),
							genConst(cg),
							mod.struct.get(STRUCT_FIELD.PROPERTY_VAL, mod.local.get(4, rt_n_property), rt_value),
						),
					], rt_value)),
					mod.drop(mod.block(null, [
						mod.local.set(5, mod.tuple.extract(mod.call('Dict.find', [
							new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $Dict)'),
							mod.i64.extend_u(new BinValue(cg, genConst(cg, Symbol(0x102))).interpret('intValue')), // TODO: v0.5: intValue will already be i64; remove `mod.i64.extend_u()` call
						], binaryen.createType([binaryen.i32, rt_n_property])), 1)),
						mod.if(
							mod.i32.or(
								mod.ref.is_null(mod.local.get(5, rt_n_property)),
								mod.call('Property.is-tombstone', [mod.local.get(5, rt_n_property)], binaryen.i32),
							),
							genConst(cg),
							mod.struct.get(STRUCT_FIELD.PROPERTY_VAL, mod.local.get(5, rt_n_property), rt_value),
						),
					], rt_value)),
				]);
			});
			it('SET.GET', () => {
				const {opt, cg} = setupScript(`{
					val 'set': {float} = {4.2, 2.4};
					'set'.[4.2];
					'set'.[3.3];
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				const rt_value:     binaryen.Type          = cg.getReftype('(ref $Value)');
				const rt_n_case:    binaryen.Type          = cg.getReftype('(ref null $Case)');
				const base:         binaryen.ExpressionRef = mod.local.get(1, rt_value); // index 0 = map setup (implementation of Set)
				const maybe_case_0: binaryen.ExpressionRef = mod.local.get(2, rt_n_case);
				const maybe_case_1: binaryen.ExpressionRef = mod.local.get(3, rt_n_case);
				opt.instructions[0].codegen(cg);
				return assertEqualBins(opt.instructions.slice(1).map((instr) => instr.codegen(cg)), [
					mod.drop(mod.block(null, [
						mod.local.set(2, mod.tuple.extract(mod.call('Map.find', [
							new BinValue(cg, base).cast('(ref $Map)'),
							genConst(cg, 4.2),
						], binaryen.createType([binaryen.i32, rt_n_case])), 1)),
						mod.if(
							mod.i32.or(
								mod.ref.is_null(maybe_case_0),
								mod.call('Case.is-tombstone', [maybe_case_0], binaryen.i32),
							),
							genConst(cg, false),
							genConst(cg, true),
						),
					], rt_value)),
					mod.drop(mod.block(null, [
						mod.local.set(3, mod.tuple.extract(mod.call('Map.find', [
							new BinValue(cg, base).cast('(ref $Map)'),
							genConst(cg, 3.3),
						], binaryen.createType([binaryen.i32, rt_n_case])), 1)),
						mod.if(
							mod.i32.or(
								mod.ref.is_null(maybe_case_1),
								mod.call('Case.is-tombstone', [maybe_case_1], binaryen.i32),
							),
							genConst(cg, false),
							genConst(cg, true),
						),
					], rt_value)),
				]);
			});
			it('MAP.GET', () => {
				const {opt, cg} = setupScript(`{
					val map: {float -> int} = {4.2 -> 42, 2.4 -> 24};
					map.[4.2];
					map.[3.3];
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				const rt_value:     binaryen.Type          = cg.getReftype('(ref $Value)');
				const rt_n_case:    binaryen.Type          = cg.getReftype('(ref null $Case)');
				const base:         binaryen.ExpressionRef = mod.local.get(1, rt_value); // index 0 = map setup
				const maybe_case_0: binaryen.ExpressionRef = mod.local.get(2, rt_n_case);
				const maybe_case_1: binaryen.ExpressionRef = mod.local.get(3, rt_n_case);
				opt.instructions[0].codegen(cg);
				return assertEqualBins(opt.instructions.slice(1).map((instr) => instr.codegen(cg)), [
					mod.drop(mod.block(null, [
						mod.local.set(2, mod.tuple.extract(mod.call('Map.find', [
							new BinValue(cg, base).cast('(ref $Map)'),
							genConst(cg, 4.2),
						], binaryen.createType([binaryen.i32, rt_n_case])), 1)),
						mod.if(
							mod.i32.or(
								mod.ref.is_null(maybe_case_0),
								mod.call('Case.is-tombstone', [maybe_case_0], binaryen.i32),
							),
							genConst(cg),
							mod.struct.get(STRUCT_FIELD.CASE_CON, maybe_case_0, rt_value),
						),
					], rt_value)),
					mod.drop(mod.block(null, [
						mod.local.set(3, mod.tuple.extract(mod.call('Map.find', [
							new BinValue(cg, base).cast('(ref $Map)'),
							genConst(cg, 3.3),
						], binaryen.createType([binaryen.i32, rt_n_case])), 1)),
						mod.if(
							mod.i32.or(
								mod.ref.is_null(maybe_case_1),
								mod.call('Case.is-tombstone', [maybe_case_1], binaryen.i32),
							),
							genConst(cg),
							mod.struct.get(STRUCT_FIELD.CASE_CON, maybe_case_1, rt_value),
						),
					], rt_value)),
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
			const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
			const CALL = {
				vnot: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vnot_', [arg], rt_value),
				vemp: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vemp_', [arg], rt_value),
				vneg: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vneg_', [arg], rt_value),
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
			const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
			const CALL = {
				vadd: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vadd_', [arg0, arg1], rt_value),
				vmul: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vmul_', [arg0, arg1], rt_value),
				vdiv: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vdiv_', [arg0, arg1], rt_value),
				vexp: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vexp_', [arg0, arg1], rt_value),
				vlt:  (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vlt_',  [arg0, arg1], rt_value),
				vgt:  (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vgt_',  [arg0, arg1], rt_value),
				vle:  (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vle_',  [arg0, arg1], rt_value),
				vge:  (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vge_',  [arg0, arg1], rt_value),
				vid:  (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vid_',  [arg0, arg1], rt_value),
				veq:  (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('veq_',  [arg0, arg1], rt_value),
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

		describe('CollectionDynamicSet', () => {
			it('LIST.SET', () => {
				const {opt, cg} = setupScript(`{
					val mut x:    int       = 42;
					val mut list: mut [int] = [42, 43];

					[x, 43, 44].[1 + 1] = 45;
					list.[0] = 46;
					list.[2] = 47;
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
				opt.instructions.slice(0, 4).map((instr) => instr.codegen(cg));
				mod.i32.wrap = (x) => x; // TODO: HACK: remove in v0.5
				return assertEqualBins(opt.instructions.slice(4).map((instr) => instr.codegen(cg)), [
					mod.call('List.set', [
						new BinValue(cg, mod.local.get(2, rt_value)).cast('(ref $List)'),
						mod.i32.wrap(new BinValue(cg, mod.local.get(3, rt_value)).interpret('intValue')),
						genConst(cg, 45n),
					], binaryen.none),
					mod.call('List.set', [
						new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $List)'),
						mod.i32.wrap(new BinValue(cg, genConst(cg, 0n)).interpret('intValue')),
						genConst(cg, 46n),
					], binaryen.none),
					mod.call('List.set', [
						new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $List)'),
						mod.i32.wrap(new BinValue(cg, genConst(cg, 2n)).interpret('intValue')),
						genConst(cg, 47n),
					], binaryen.none),
				]);
			});
			it('DICT.SET', () => {
				const {opt, cg} = setupScript(`{
					val mut x:    int        = 42;
					val mut dict: mut [:int] = [a= 42, c= 43];

					[a= x, b= 43, c= 44].[@b] = 45;
					dict.[@a] = 46;
					dict.[@c] = 47;
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
				opt.instructions.slice(0, 3).map((instr) => instr.codegen(cg));
				return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
					mod.call('Dict.set', [
						new BinValue(cg, mod.local.get(2, rt_value)).cast('(ref $Dict)'),
						mod.i64.extend_u(new BinValue(cg, genConst(cg, Symbol(0x104))).interpret('intValue')), // TODO: v0.5: intValue will already be i64; remove `mod.i64.extend_u()` call
						genConst(cg, 45n),
					], binaryen.none),
					mod.call('Dict.set', [
						new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $Dict)'),
						mod.i64.extend_u(new BinValue(cg, genConst(cg, Symbol(0x101))).interpret('intValue')), // TODO: v0.5: intValue will already be i64; remove `mod.i64.extend_u()` call
						genConst(cg, 46n),
					], binaryen.none),
					mod.call('Dict.set', [
						new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $Dict)'),
						mod.i64.extend_u(new BinValue(cg, genConst(cg, Symbol(0x102))).interpret('intValue')), // TODO: v0.5: intValue will already be i64; remove `mod.i64.extend_u()` call
						genConst(cg, 47n),
					], binaryen.none),
				]);
			});
			it('SET.SET', () => {
				const {opt, cg} = setupScript(`{
					val 'set': mut {float} = {4.2, 2.4};
					'set'.[4.2] = false;
					'set'.[3.3] = true;
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				const rt_value:       binaryen.Type          = cg.getReftype('(ref $Value)');
				const rt_map:         binaryen.Type          = cg.getReftype('(ref $Map)');
				const base:           binaryen.ExpressionRef = mod.local.get(1, rt_value); // index 0 = map setup
				const base_get_0:     binaryen.ExpressionRef = mod.local.get(2, rt_map);
				const accessor_get_0: binaryen.ExpressionRef = mod.local.get(3, rt_value);
				const base_get_1:     binaryen.ExpressionRef = mod.local.get(4, rt_map);
				const accessor_get_1: binaryen.ExpressionRef = mod.local.get(5, rt_value);
				opt.instructions[0].codegen(cg);
				return assertEqualBins(opt.instructions.slice(1).map((instr) => instr.codegen(cg)), [
					mod.block(null, [
						mod.local.set(2, new BinValue(cg, base).cast('(ref $Map)')),
						mod.local.set(3, genConst(cg, 4.2)),
						mod.if(
							new BinVect(mod, new BinValue(cg, genConst(cg, false)).primitiveValue).isSpecial(true),
							mod.call('Map.set',    [base_get_0, accessor_get_0, genConst(cg)], binaryen.none),
							mod.call('Map.delete', [base_get_0, accessor_get_0],               binaryen.none),
						),
					]),
					mod.block(null, [
						mod.local.set(4, new BinValue(cg, base).cast('(ref $Map)')),
						mod.local.set(5, genConst(cg, 3.3)),
						mod.if(
							new BinVect(mod, new BinValue(cg, genConst(cg, true)).primitiveValue).isSpecial(true),
							mod.call('Map.set',    [base_get_1, accessor_get_1, genConst(cg)], binaryen.none),
							mod.call('Map.delete', [base_get_1, accessor_get_1],               binaryen.none),
						),
					]),
				]);
			});
			it('MAP.SET', () => {
				const {opt, cg} = setupScript(`{
					val map: mut {float -> int} = {4.2 -> 42, 2.4 -> 24};
					map.[4.2] = 21;
					map.[3.3] = 21;
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				const base: binaryen.ExpressionRef = mod.local.get(1, cg.getReftype('(ref $Value)')); // index 0 = map setup
				opt.instructions[0].codegen(cg);
				return assertEqualBins(opt.instructions.slice(1).map((instr) => instr.codegen(cg)), [
					mod.call('Map.set', [new BinValue(cg, base).cast('(ref $Map)'), genConst(cg, 4.2), genConst(cg, 21n)], binaryen.none),
					mod.call('Map.set', [new BinValue(cg, base).cast('(ref $Map)'), genConst(cg, 3.3), genConst(cg, 21n)], binaryen.none),
				]);
			});
		});

		describe('CollectionDynamicCopy', () => {
			describe('LIST.COPY', () => {
				it('tuple argument.', () => {
					const {opt, cg} = setupScript(`{
						List.<int>((2, 3, 5));
					}`, {lower: true, codegen: false, build: false});
					const mod = cg.module;
					const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
					opt.instructions.slice(0, 2).map((instr) => instr.codegen(cg));
					const destlist_get: binaryen.ExpressionRef = mod.local.get(2, cg.getReftype('(ref $List)'));
					const srcref_get:   binaryen.ExpressionRef = mod.local.get(3, cg.getReftype('(ref $Tuple)'));
					return assertEqualBins(
						opt.instructions[2].codegen(cg),
						mod.block(null, [
							mod.local.set(2, new BinValue(cg, mod.local.get(0, rt_value)).cast('(ref $List)')),
							mod.local.set(3, new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $Tuple)')),
							mod.call('List.adjust-capacity', [
								destlist_get,
								mod.call('capacity-needed', [mod.array.len(srcref_get)], binaryen.i32),
							], binaryen.none),
							mod.array.copy(
								cg.getListInternal(destlist_get),
								mod.i32.const(0),
								srcref_get,
								mod.i32.const(0),
								mod.array.len(srcref_get),
							),
						]),
					);
				});
				it('List argument.', () => {
					const {opt, cg} = setupScript(`{
						List.<int>([2, 3, 5]);
					}`, {lower: true, codegen: false, build: false});
					const mod = cg.module;
					const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
					opt.instructions.slice(0, 2).map((instr) => instr.codegen(cg));
					const destlist_get: binaryen.ExpressionRef = mod.local.get(2, cg.getReftype('(ref $List)'));
					const srcref_get:   binaryen.ExpressionRef = mod.local.get(3, cg.getReftype('(ref $ListInternal)'));
					return assertEqualBins(
						opt.instructions[2].codegen(cg),
						mod.block(null, [
							mod.local.set(2, new BinValue(cg, mod.local.get(0, rt_value)).cast('(ref $List)')),
							mod.local.set(3, cg.getListInternal(new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $List)'))),
							mod.call('List.adjust-capacity', [
								destlist_get,
								mod.array.len(srcref_get),
							], binaryen.none),
							mod.array.copy(
								cg.getListInternal(destlist_get),
								mod.i32.const(0),
								srcref_get,
								mod.i32.const(0),
								mod.array.len(srcref_get),
							),
						]),
					);
				});
				it('Set argument.', () => {
					const {opt, cg} = setupScript(`{
						List.<int>({2, 3, 5});
					}`, {lower: true, codegen: false, build: false});
					return assert.throws(() => opt.instructions.map((instr) => instr.codegen(cg)), /not yet supported/);
				});
			});
			describe('DICT.COPY', () => {
				it('tuple argument.', () => {
					const {opt, cg} = setupScript(`{
						Dict.<int>(( (@a, 2), (@b, 3), (@c, 5) ));
					}`, {lower: true, codegen: false, build: false});
					const mod = cg.module;
					const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
					const rt_tuple: binaryen.Type = cg.getReftype('(ref $Tuple)');
					opt.instructions.slice(0, 5).map((instr) => instr.codegen(cg));
					const pairs_get: binaryen.ExpressionRef = mod.local.get(6, rt_tuple);
					const i_get:     binaryen.ExpressionRef = mod.local.get(7, binaryen.i32);
					const pair_get:  binaryen.ExpressionRef = mod.local.get(9, rt_tuple);
					return assertEqualBins(
						opt.instructions[5].codegen(cg),
						mod.block(null, [
							mod.local.set(5, new BinValue(cg, mod.local.get(0, rt_value)).cast('(ref $Dict)')),
							mod.local.set(6, new BinValue(cg, mod.local.get(4, rt_value)).cast('(ref $Tuple)')),
							mod.block('exit-0', [
								mod.local.set(7, mod.i32.const(0)),
								mod.loop('repeat-0', mod.block(null, [
									mod.br_if('exit-0', mod.i32.ge_u(mod.local.get(7, binaryen.i32), mod.array.len(pairs_get))),
									mod.local.set(8, mod.array.get(pairs_get, i_get, rt_value)),
									mod.local.set(9, new BinValue(cg, mod.local.get(8, rt_value)).cast('(ref $Tuple)')),
									mod.call('Dict.set', [
										mod.local.get(5, cg.getReftype('(ref $Dict)')),
										mod.i64.extend_u(new BinValue(cg, mod.array.get(pair_get, mod.i32.const(0), rt_value)).interpret('intValue')), // TODO: v0.5: intValue will already be i64; remove `cg.module.i64.extend_u()` call
										mod.array.get(pair_get, mod.i32.const(1), rt_value),
									], binaryen.none),
									mod.local.set(7, mod.i32.add(i_get, mod.i32.const(1))),
									mod.br('repeat-0'),
								])),
							]),
						]),
					);
				});
				it('record argument.', () => {
					const {opt, cg} = setupScript(`{
						Dict.<int>((a= 2, b= 3, c= 5));
					}`, {lower: true, codegen: false, build: false});
					const mod = cg.module;
					const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
					opt.instructions.slice(0, 2).map((instr) => instr.codegen(cg));
					const destdict_get: binaryen.ExpressionRef = mod.local.get(2, cg.getReftype('(ref $Dict)'));
					const srcref_get:   binaryen.ExpressionRef = mod.local.get(3, cg.getReftype('(ref $Record)'));
					return assertEqualBins(
						opt.instructions[2].codegen(cg),
						mod.block(null, [
							mod.local.set(2, new BinValue(cg, mod.local.get(0, rt_value)).cast('(ref $Dict)')),
							mod.local.set(3, new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $Record)')),
							mod.call('Dict.adjust-capacity', [
								destdict_get,
								mod.call('capacity-needed', [mod.array.len(srcref_get)], binaryen.i32),
							], binaryen.none),
							mod.array.copy(
								cg.getDictInternal(destdict_get),
								mod.i32.const(0),
								srcref_get,
								mod.i32.const(0),
								mod.array.len(srcref_get),
							),
						]),
					);
				});
				it('List argument.', () => {
					const {opt, cg} = setupScript(`{
						Dict.<int>([ (@a, 2), (@b, 3), (@c, 5) ]);
					}`, {lower: true, codegen: false, build: false});
					const mod = cg.module;
					const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
					opt.instructions.slice(0, 5).map((instr) => instr.codegen(cg));
					const pairs_get: binaryen.ExpressionRef = mod.local.get(6, cg.getReftype('(ref $ListInternal)'));
					const i_get:     binaryen.ExpressionRef = mod.local.get(7, binaryen.i32);
					const item_get:  binaryen.ExpressionRef = mod.local.get(8, cg.getReftype('(ref null $Value)'));
					const pair_get:  binaryen.ExpressionRef = mod.local.get(9, cg.getReftype('(ref $Tuple)'));
					return assertEqualBins(
						opt.instructions[5].codegen(cg),
						mod.block(null, [
							mod.local.set(5, new BinValue(cg, mod.local.get(0, rt_value)).cast('(ref $Dict)')),
							mod.local.set(6, cg.getListInternal(new BinValue(cg, mod.local.get(4, rt_value)).cast('(ref $List)'))),
							mod.block('exit-0', [
								mod.local.set(7, mod.i32.const(0)),
								mod.loop('repeat-0', mod.block(null, [
									mod.br_if('exit-0', mod.i32.ge_u(mod.local.get(7, binaryen.i32), mod.array.len(pairs_get))),
									mod.local.set(8, mod.array.get(pairs_get, i_get, rt_value)),
									mod.if(
										mod.i32.eqz(mod.ref.is_null(item_get)),
										mod.block(null, [
											mod.local.set(9, new BinValue(cg, item_get).cast('(ref $Tuple)')),
											mod.call('Dict.set', [
												mod.local.get(5, cg.getReftype('(ref $Dict)')),
												mod.i64.extend_u(new BinValue(cg, mod.array.get(pair_get, mod.i32.const(0), rt_value)).interpret('intValue')), // TODO: v0.5: intValue will already be i64; remove `cg.module.i64.extend_u()` call
												mod.array.get(pair_get, mod.i32.const(1), rt_value),
											], binaryen.none),
										]),
									),
									mod.local.set(7, mod.i32.add(i_get, mod.i32.const(1))),
									mod.br('repeat-0'),
								])),
							]),
						]),
					);
				});
				it('Dict argument.', () => {
					const {opt, cg} = setupScript(`{
						Dict.<int>([a= 2, b= 3, c= 5]);
					}`, {lower: true, codegen: false, build: false});
					const mod = cg.module;
					const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
					opt.instructions.slice(0, 2).map((instr) => instr.codegen(cg));
					const destdict_get: binaryen.ExpressionRef = mod.local.get(2, cg.getReftype('(ref $Dict)'));
					const srcref_get:   binaryen.ExpressionRef = mod.local.get(3, cg.getReftype('(ref $DictInternal)'));
					return assertEqualBins(
						opt.instructions[2].codegen(cg),
						mod.block(null, [
							mod.local.set(2, new BinValue(cg, mod.local.get(0, rt_value)).cast('(ref $Dict)')),
							mod.local.set(3, cg.getDictInternal(new BinValue(cg, mod.local.get(1, rt_value)).cast('(ref $Dict)'))),
							mod.call('Dict.adjust-capacity', [
								destdict_get,
								mod.array.len(srcref_get),
							], binaryen.none),
							mod.array.copy(
								cg.getDictInternal(destdict_get),
								mod.i32.const(0),
								srcref_get,
								mod.i32.const(0),
								mod.array.len(srcref_get),
							),
						]),
					);
				});
				it('Set argument.', () => {
					const {opt, cg} = setupScript(`{
						Dict.<int>({ (@a, 2), (@b, 3), (@c, 5) });
					}`, {lower: true, codegen: false, build: false});
					return assert.throws(() => opt.instructions.map((instr) => instr.codegen(cg)), /not yet supported/);
				});
				it('Map argument.', () => {
					const {opt, cg} = setupScript(`{
						Dict.<int>({@a -> 2, @b -> 3, @c -> 5});
					}`, {lower: true, codegen: false, build: false});
					return assert.throws(() => opt.instructions.map((instr) => instr.codegen(cg)), /not yet supported/);
				});
			});
		});
	});
});

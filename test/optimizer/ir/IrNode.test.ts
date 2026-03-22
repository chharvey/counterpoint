import * as assert from 'node:assert';
import * as test from 'node:test';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	type AST,
	VALUE,
	TYPE,
	IR,
	STRUCT_FIELD,
	BinValue,
	Builder,
	BinVect,
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
			const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
			opt.instructions.slice(0, 5).map((instr) => instr.codegen(cg));
			return assertEqualBins(
				stmts.slice(5).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
				[
					mod.local.get(0, rt_value),
					mod.local.get(1, rt_value),
					mod.local.get(2, rt_value),
					mod.local.get(3, rt_value),
					mod.local.get(4, rt_value),
				],
			);
		});

		test.suite('CollectionLinearNew', () => {
			test.test('empty TUPLE.NEW', () => {
				const {stmts, opt, cg} = setupScript(`{
					();
				}`, {lower: true, codegen: false, build: false});
				return assertEqualBins(
					(stmts[0] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, cg.codegenTuple()).value,
				);
			});
			test.test('nonempty TUPLE.NEW', () => {
				const {stmts, opt, cg} = setupScript(`{
					val mut x: int = 42;
					(x, 4.2, (null,));
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
				return assertEqualBins(
					(stmts[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, cg.codegenTuple([
						mod.local.get(0, rt_value),
						genConst(cg, 4.2),
						mod.local.get(1, rt_value),
					])).value,
				);
			});
			test.test('LIST.NEW', () => {
				const {stmts, opt, cg} = setupScript(`{
					val mut x: int = 42;
					[x, 4.2, (null,), x/2, @e];
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				const rt_n_value: binaryen.Type = cg.getReftype('(ref null $Value)');
				return assertEqualBins(
					(stmts[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, cg.codegenList([
						mod.local.get(0, rt_n_value),
						genConst(cg, 4.2),
						mod.local.get(1, rt_n_value),
						mod.local.get(2, rt_n_value),
						genConst(cg, Symbol(0x101)),
					])).value,
				);
			});
		});

		test.suite('RecordNew', () => {
			test.test('empty RECORD.NEW', () => {
				// there exists no syntax for empty records, so constructing it manually
				const cg = new Builder();
				return assertEqualBins(
					new IR.RecordNew(new Map(), new TYPE.Record()).codegen(cg),
					new BinValue(cg, cg.codegenRecord()).value,
				);
			});
			test.test('nonempty RECORD.NEW', () => {
				const {stmts, opt, cg} = setupScript(`{
					val mut x: int = 42;
					(a= x, b= 4.2, c= (null,), d= x/2, e= @e);
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
				return assertEqualBins(
					(stmts[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, cg.codegenRecord(new Map([
						[257n, new BinValue(cg, mod.local.get(0, rt_value)) .toProperty(257n)],
						[258n, new BinValue(cg, genConst(cg, 4.2))          .toProperty(258n)],
						[259n, new BinValue(cg, mod.local.get(1, rt_value)) .toProperty(259n)],
						[260n, new BinValue(cg, mod.local.get(2, rt_value)) .toProperty(260n)], // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
						[261n, new BinValue(cg, genConst(cg, Symbol(0x105))).toProperty(261n)],
					]))).value,
				);
			});
			test.test('inserts keys in source order.', () => {
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
					(a= 42, aa= false, b= 4.2);  % (258, 261, 256)
					(aa= true, c= null, a= 42);  % (261, 257, 258)
					(b= 42, bb= 4.2, bbb= null); % (256, 259, 262)
				}`, {lower: true, codegen: true, build: false});
				return assertEqualBins(
					stmts.slice(9).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
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

		test.suite('DictNew', () => {
			test.test('DICT.NEW', () => {
				const {stmts, opt, cg} = setupScript(`{
					val mut x: int = 42;
					[a= x, b= 4.2, c= (null,), d= x/2, e= @e];
				}`, {lower: true, codegen: true, build: false});
				const mod = cg.module;
				const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
				return assertEqualBins(
					(stmts[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
					new BinValue(cg, cg.codegenDict(new Map([
						[257n, new BinValue(cg, mod.local.get(0, rt_value)) .toProperty(257n)],
						[258n, new BinValue(cg, genConst(cg, 4.2))          .toProperty(258n)],
						[259n, new BinValue(cg, mod.local.get(1, rt_value)) .toProperty(259n)],
						[260n, new BinValue(cg, mod.local.get(2, rt_value)) .toProperty(260n)],
						[261n, new BinValue(cg, genConst(cg, Symbol(0x105))).toProperty(261n)],
					]))).value,
				);
			});
			test.test('inserts keys in source order.', () => {
				const {stmts, opt, cg} = setupScript(`{
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
					stmts.slice(9).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
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

		test.test('TupleGet returns (array.get).', () => {
			const {opt, cg} = setupScript(`{
				val mut x:   int                = 42;
				val mut tup: (int, int, ?: int) = (42, 43);

				(x, 43, 44).2;
				tup.0;
				tup.1;
			}`, {lower: true, codegen: false, build: false});
			const mod = cg.module;
			const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
			const rt_tuple: binaryen.Type = cg.getReftype('(ref $Tuple)');
			opt.instructions.slice(0, 3).map((instr) => instr.codegen(cg));
			return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
				mod.drop(mod.array.get(
					mod.ref.cast(new BinValue(cg, mod.local.get(2, rt_value)).compositeValue, rt_tuple),
					mod.i32.const(2),
					rt_value,
				)),
				mod.drop(mod.array.get(
					mod.ref.cast(new BinValue(cg, mod.local.get(1, rt_value)).compositeValue, rt_tuple),
					mod.i32.const(0),
					rt_value,
				)),
				mod.drop(mod.array.get(
					mod.ref.cast(new BinValue(cg, mod.local.get(1, rt_value)).compositeValue, rt_tuple),
					mod.i32.const(1),
					rt_value,
				)),
			]);
		});

		test.test('RecordGet returns (call $Record.get).', () => {
			const {opt, cg} = setupScript(`{
				val mut x:   int                       = 42;
				val mut rec: (a: int, b: int, c?: int) = (a= 42, b= 43);

				(a= x, b= 43, c= 44).c;
				rec.a;
				rec.b;
			}`, {lower: true, codegen: false, build: false});
			const mod = cg.module;
			const rt_value:  binaryen.Type = cg.getReftype('(ref $Value)');
			const rt_record: binaryen.Type = cg.getReftype('(ref $Record)');
			opt.instructions.slice(0, 3).map((instr) => instr.codegen(cg));
			return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
				mod.drop(mod.call('Record.get', [
					mod.ref.cast(new BinValue(cg, mod.local.get(2, rt_value)).compositeValue, rt_record),
					mod.i32.const(0x103),
				], rt_value)),
				mod.drop(mod.call('Record.get', [
					mod.ref.cast(new BinValue(cg, mod.local.get(1, rt_value)).compositeValue, rt_record),
					mod.i32.const(0x101),
				], rt_value)),
				mod.drop(mod.call('Record.get', [
					mod.ref.cast(new BinValue(cg, mod.local.get(1, rt_value)).compositeValue, rt_record),
					mod.i32.const(0x102),
				], rt_value)),
			]);
		});

		test.suite('CollectionDynamicGet', () => {
			test.test('LIST.GET', () => {
				const {opt, cg} = setupScript(`{
					val mut x:    int   = 42;
					val mut list: [int] = [42, 43];

					[x, 43, 44].[1 + 1];
					list.[0];
					list.[3];
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				const rt_value:         binaryen.Type = cg.getReftype('(ref $Value)');
				const rt_n_value:       binaryen.Type = cg.getReftype('(ref null $Value)');
				const rt_list:          binaryen.Type = cg.getReftype('(ref $List)');
				const rt_list_internal: binaryen.Type = cg.getReftype('(ref $ListInternal)');
				opt.instructions.slice(0, 4).map((instr) => instr.codegen(cg));
				return assertEqualBins(opt.instructions.slice(4).map((instr) => instr.codegen(cg)), [
					mod.drop(mod.block(null, [
						mod.local.set(4, mod.array.get(
							mod.struct.get(
								STRUCT_FIELD.LIST_INTERNAL,
								mod.ref.cast(new BinValue(cg, mod.local.get(2, rt_value)).compositeValue, rt_list),
								rt_list_internal,
							),
							mod.i32.wrap(new BinVect(mod, new BinValue(cg, mod.local.get(3, rt_value)).primitiveValue).intValue),
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
							mod.struct.get(
								STRUCT_FIELD.LIST_INTERNAL,
								mod.ref.cast(new BinValue(cg, mod.local.get(1, rt_value)).compositeValue, rt_list),
								rt_list_internal,
							),
							mod.i32.wrap(new BinVect(mod, new BinValue(cg, genConst(cg, 0n)).primitiveValue).intValue),
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
							mod.struct.get(
								STRUCT_FIELD.LIST_INTERNAL,
								mod.ref.cast(new BinValue(cg, mod.local.get(1, rt_value)).compositeValue, rt_list),
								rt_list_internal,
							),
							mod.i32.wrap(new BinVect(mod, new BinValue(cg, genConst(cg, 3n)).primitiveValue).intValue),
							rt_n_value,
						)),
						mod.if(
							mod.ref.is_null(mod.local.get(6, rt_n_value)),
							genConst(cg),
							mod.ref.as_non_null(mod.local.get(6, rt_n_value)),
						),
					], rt_value)),
				]);
			});
			test.test('DICT.GET', () => {
				const {opt, cg} = setupScript(`{
					val mut x:    int    = 42;
					val mut dict: [:int] = [a= 42, c= 43];

					[a= x, b= 43, c= 44].[@b];
					dict.[@a];
					dict.[@c];
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				const rt_value:      binaryen.Type = cg.getReftype('(ref $Value)');
				const rt_dict:       binaryen.Type = cg.getReftype('(ref $Dict)');
				const rt_n_property: binaryen.Type = cg.getReftype('(ref null $Property)');
				opt.instructions.slice(0, 3).map((instr) => instr.codegen(cg));
				return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
					mod.drop(mod.block(null, [
						mod.local.set(3, mod.tuple.extract(mod.call('Dict.find', [
							mod.ref.cast(new BinValue(cg, mod.local.get(2, rt_value)).compositeValue, rt_dict),
							mod.i32.wrap(new BinVect(mod, new BinValue(cg, genConst(cg, Symbol(0x104))).primitiveValue).intValue),
						], binaryen.createType([binaryen.i32, rt_n_property])), 1)),
						mod.if(
							mod.i32.or(
								mod.ref.is_null(mod.local.get(3, rt_n_property)),
								mod.call('Property.is-tombstone', [mod.local.get(3, rt_n_property)], binaryen.i32),
							),
							genConst(cg),
							mod.struct.get(STRUCT_FIELD.PROPERTY_VALUE, mod.local.get(3, rt_n_property), rt_value),
						),
					], rt_value)),
					mod.drop(mod.block(null, [
						mod.local.set(4, mod.tuple.extract(mod.call('Dict.find', [
							mod.ref.cast(new BinValue(cg, mod.local.get(1, rt_value)).compositeValue, rt_dict),
							mod.i32.wrap(new BinVect(mod, new BinValue(cg, genConst(cg, Symbol(0x101))).primitiveValue).intValue),
						], binaryen.createType([binaryen.i32, rt_n_property])), 1)),
						mod.if(
							mod.i32.or(
								mod.ref.is_null(mod.local.get(4, rt_n_property)),
								mod.call('Property.is-tombstone', [mod.local.get(4, rt_n_property)], binaryen.i32),
							),
							genConst(cg),
							mod.struct.get(STRUCT_FIELD.PROPERTY_VALUE, mod.local.get(4, rt_n_property), rt_value),
						),
					], rt_value)),
					mod.drop(mod.block(null, [
						mod.local.set(5, mod.tuple.extract(mod.call('Dict.find', [
							mod.ref.cast(new BinValue(cg, mod.local.get(1, rt_value)).compositeValue, rt_dict),
							mod.i32.wrap(new BinVect(mod, new BinValue(cg, genConst(cg, Symbol(0x102))).primitiveValue).intValue),
						], binaryen.createType([binaryen.i32, rt_n_property])), 1)),
						mod.if(
							mod.i32.or(
								mod.ref.is_null(mod.local.get(5, rt_n_property)),
								mod.call('Property.is-tombstone', [mod.local.get(5, rt_n_property)], binaryen.i32),
							),
							genConst(cg),
							mod.struct.get(STRUCT_FIELD.PROPERTY_VALUE, mod.local.get(5, rt_n_property), rt_value),
						),
					], rt_value)),
				]);
			});
		});

		test.suite('CollectionDynamicSet', () => {
			test.test('LIST.SET', () => {
				const {opt, cg} = setupScript(`{
					val mut x:    int       = 42;
					val mut list: mut [int] = [42, 43];

					set [x, 43, 44].[1 + 1] = 45;
					set list.[0] = 46;
					set list.[2] = 47;
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
				const rt_list:  binaryen.Type = cg.getReftype('(ref $List)');
				opt.instructions.slice(0, 4).map((instr) => instr.codegen(cg));
				return assertEqualBins(opt.instructions.slice(4).map((instr) => instr.codegen(cg)), [
					mod.call('List.set', [
						mod.ref.cast(new BinValue(cg, mod.local.get(2, rt_value)).compositeValue, rt_list),
						mod.i32.wrap(new BinVect(mod, new BinValue(cg, mod.local.get(3, rt_value)).primitiveValue).intValue),
						genConst(cg, 45n),
					], binaryen.none),
					mod.call('List.set', [
						mod.ref.cast(new BinValue(cg, mod.local.get(1, rt_value)).compositeValue, rt_list),
						mod.i32.wrap(new BinVect(mod, new BinValue(cg, genConst(cg, 0n)).primitiveValue).intValue),
						genConst(cg, 46n),
					], binaryen.none),
					mod.call('List.set', [
						mod.ref.cast(new BinValue(cg, mod.local.get(1, rt_value)).compositeValue, rt_list),
						mod.i32.wrap(new BinVect(mod, new BinValue(cg, genConst(cg, 2n)).primitiveValue).intValue),
						genConst(cg, 47n),
					], binaryen.none),
				]);
			});
			test.test('DICT.SET', () => {
				const {opt, cg} = setupScript(`{
					val mut x:    int        = 42;
					val mut dict: mut [:int] = [a= 42, c= 43];

					set [a= x, b= 43, c= 44].[@b] = 45;
					set dict.[@a] = 46;
					set dict.[@c] = 47;
				}`, {lower: true, codegen: false, build: false});
				const mod = cg.module;
				const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
				const rt_dict:  binaryen.Type = cg.getReftype('(ref $Dict)');
				opt.instructions.slice(0, 3).map((instr) => instr.codegen(cg));
				return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
					mod.call('Dict.set', [
						mod.ref.cast(new BinValue(cg, mod.local.get(2, rt_value)).compositeValue, rt_dict),
						mod.i32.wrap(new BinVect(mod, new BinValue(cg, genConst(cg, Symbol(0x104))).primitiveValue).intValue),
						genConst(cg, 45n),
					], binaryen.none),
					mod.call('Dict.set', [
						mod.ref.cast(new BinValue(cg, mod.local.get(1, rt_value)).compositeValue, rt_dict),
						mod.i32.wrap(new BinVect(mod, new BinValue(cg, genConst(cg, Symbol(0x101))).primitiveValue).intValue),
						genConst(cg, 46n),
					], binaryen.none),
					mod.call('Dict.set', [
						mod.ref.cast(new BinValue(cg, mod.local.get(1, rt_value)).compositeValue, rt_dict),
						mod.i32.wrap(new BinVect(mod, new BinValue(cg, genConst(cg, Symbol(0x102))).primitiveValue).intValue),
						genConst(cg, 47n),
					], binaryen.none),
				]);
			});
		});

		test.test('Unop returns custom WASM functions `vnot`, `vemp`, `vneg`.', () => {
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
			const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
			const CALL = {
				vnot: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vnot_', [arg], rt_value),
				vemp: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vemp_', [arg], rt_value),
				vneg: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vneg_', [arg], rt_value),
				vtoi: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vtoi_', [arg], rt_value),
				vton: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vton_', [arg], rt_value),
				vtof: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vtof_', [arg], rt_value),
			} as const;
			return assertEqualBins(
				stmts.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
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

					CALL.vtoi(genConst(cg, 42n, 'nat')),
					CALL.vtoi(genConst(cg, 4.2)),
					CALL.vton(genConst(cg, 42n)),
					CALL.vton(genConst(cg, 4.2)),
					CALL.vtof(genConst(cg, 42n, 'nat')),
					CALL.vtof(genConst(cg, 42n)),
				],
			);
		});

		test.test('Binop returns custom WASM functions `viadd`, `vfmul`, etc.', () => {
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
			const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
			const CALL = {
				viadd:   (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('viadd_',   [arg0, arg1], rt_value),
				vfadd:   (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vfadd_',   [arg0, arg1], rt_value),
				visub_s: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('visub_s_', [arg0, arg1], rt_value),
				visub_u: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('visub_u_', [arg0, arg1], rt_value),
				vfsub:   (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vfsub_',   [arg0, arg1], rt_value),
				vimul:   (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vimul_',   [arg0, arg1], rt_value),
				vfmul:   (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vfmul_',   [arg0, arg1], rt_value),
				vidiv_s: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vidiv_s_', [arg0, arg1], rt_value),
				vidiv_u: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vidiv_u_', [arg0, arg1], rt_value),
				vfdiv:   (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vfdiv_',   [arg0, arg1], rt_value),
				viexp:   (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('viexp_',   [arg0, arg1], rt_value),
				vlt:     (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vlt_',     [arg0, arg1], rt_value),
				vgt:     (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vgt_',     [arg0, arg1], rt_value),
				vle:     (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vle_',     [arg0, arg1], rt_value),
				vge:     (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vge_',     [arg0, arg1], rt_value),
				vid:     (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vid_',     [arg0, arg1], rt_value),
				veq:     (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('veq_',     [arg0, arg1], rt_value),
			} as const;
			return assertEqualBins(
				stmts.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
				[
					CALL.viadd  (genConst(cg, 2n), genConst(cg, 3n)),
					CALL.visub_s(genConst(cg, 2n), genConst(cg, 3n)),
					CALL.vimul  (genConst(cg, 2n), genConst(cg, 3n)),
					CALL.vidiv_s(genConst(cg, 2n), genConst(cg, 3n)),
					CALL.viexp  (genConst(cg, 2n), genConst(cg, 3n)),

					CALL.viadd  (genConst(cg, 2n, 'nat'), genConst(cg, 3n, 'nat')),
					CALL.visub_u(genConst(cg, 2n, 'nat'), genConst(cg, 3n, 'nat')),
					CALL.vimul  (genConst(cg, 2n, 'nat'), genConst(cg, 3n, 'nat')),
					CALL.vidiv_u(genConst(cg, 2n, 'nat'), genConst(cg, 3n, 'nat')),
					CALL.viexp  (genConst(cg, 2n, 'nat'), genConst(cg, 3n, 'nat')),

					CALL.vfadd(genConst(cg, 2.0), genConst(cg, 3.0)),
					CALL.vfsub(genConst(cg, 2.0), genConst(cg, 3.0)),
					CALL.vfmul(genConst(cg, 2.0), genConst(cg, 3.0)),
					CALL.vfdiv(genConst(cg, 2.0), genConst(cg, 3.0)),
					mod.unreachable(),

					CALL.vlt(genConst(cg, 2n), genConst(cg, 3.0)),
					CALL.vgt(genConst(cg, 2n), genConst(cg, 3.0)),
					CALL.vle(genConst(cg, 2n), genConst(cg, 3.0)),
					CALL.vge(genConst(cg, 2n), genConst(cg, 3.0)),

					CALL.vid(genConst(cg, 2.0), genConst(cg, 3n)),
					CALL.veq(genConst(cg, 2.0), genConst(cg, 3n)),
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

		test.test('Decl & Set both return (local.set).', () => {
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

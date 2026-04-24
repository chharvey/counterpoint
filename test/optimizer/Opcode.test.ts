import * as assert from 'node:assert';
import * as test from 'node:test';
import binaryen from 'binaryen';
import {
	type AST,
	TYPE,
	Optimizer,
	IR,
	BinValue,
	bigint_to_i64,
	Builder,
	BinVect,
} from '../../src/index.ts';
import {assertEqualBins} from '../assert-helpers.ts';
import {
	setupScript,
	genConst,
} from '../helpers.ts';



test.suite('Opcode', () => {
	test.suite('IrValue', () => {
		test.suite('#codegen', () => {
			test.test('Trap returns (unreachable).', () => {
				const cg = new Builder();
				return assertEqualBins(new IR.Trap().codegen(cg), cg.module.unreachable());
			});

			test.test('Const returns (struct.new $Value).', () => {
				const {stmts, opt, cg} = setupScript(`{
					null;
					false;
					@hello;
					42;
					4.2;
					"hello";
				}`, {codegen: false});
				return assertEqualBins(
					stmts.map((stmt) => (stmt as AST.StatementExpression).expr!.lower(opt).codegen(cg)),
					[
						genConst(cg),
						genConst(cg, false),
						genConst(cg, Symbol(0x100)),
						genConst(cg, 42n),
						genConst(cg, 4.2),
						genConst(cg, 'hello'),
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
				}`);
				const mod = cg.module;
				return assertEqualBins(
					stmts.slice(5).map((stmt) => (stmt as AST.StatementExpression).expr!.lower(opt).codegen(cg)),
					[
						mod.local.get(0, cg.reftype.Value),
						mod.local.get(1, cg.reftype.Value),
						mod.local.get(2, cg.reftype.Value),
						mod.local.get(3, cg.reftype.Value),
						mod.local.get(4, cg.reftype.Value),
					],
				);
			});

			test.test('Template returns (block) containing static repetition of (array.copy).', () => {
				const {opt, cg} = setupScript(`{
					val user: (name: str) = (name= "Alan");
					"""Hello, {{ user.name }}, you have {{ 2 * 3 }} new messages.""";
				}`);
				const mod = cg.module;

				const strings = [
					genConst(cg, 'Hello, '),
					mod.local.get(1, cg.reftype.Value),
					genConst(cg, ', you have '),
					mod.local.get(2, cg.reftype.Value),
					genConst(cg, ' new messages.'),
				].map((code) => mod.call('stringify', [code], cg.reftype.String));

				const OFFSET_IDX = 9;

				const string_0_get: binaryen.ExpressionRef = mod.local.get(3, cg.reftype.String);
				const string_1_get: binaryen.ExpressionRef = mod.local.get(4, cg.reftype.String);
				const string_2_get: binaryen.ExpressionRef = mod.local.get(5, cg.reftype.String);
				const string_3_get: binaryen.ExpressionRef = mod.local.get(6, cg.reftype.String);
				const string_4_get: binaryen.ExpressionRef = mod.local.get(7, cg.reftype.String);

				const string_0_len: binaryen.ExpressionRef = mod.array.len(string_0_get);
				const string_1_len: binaryen.ExpressionRef = mod.array.len(string_1_get);
				const string_2_len: binaryen.ExpressionRef = mod.array.len(string_2_get);
				const string_3_len: binaryen.ExpressionRef = mod.array.len(string_3_get);
				const string_4_len: binaryen.ExpressionRef = mod.array.len(string_4_get);

				const result_get: binaryen.ExpressionRef = mod.local.get(8, cg.reftype.String);
				const offset_get: binaryen.ExpressionRef = mod.local.get(OFFSET_IDX, binaryen.i32);
				return assertEqualBins(
					opt.instructions[3].codegen(cg),
					mod.drop(new BinValue(cg, mod.block(null, [
						mod.local.set(3, strings[0]),
						mod.local.set(4, strings[1]),
						mod.local.set(5, strings[2]),
						mod.local.set(6, strings[3]),
						mod.local.set(7, strings[4]),
						mod.local.set(8, mod.array.new_default(
							cg.heaptype.String,
							mod.i32.add(
								mod.i32.add(
									mod.i32.add(
										mod.i32.add(
											string_0_len,
											string_1_len,
										),
										string_2_len,
									),
									string_3_len,
								),
								string_4_len,
							),
						)),
						mod.local.set(OFFSET_IDX, mod.i32.const(0)),
						...[
							[string_0_get, string_0_len],
							[string_1_get, string_1_len],
							[string_2_get, string_2_len],
							[string_3_get, string_3_len],
						].flatMap(([str_get, str_len]) => [
							mod.array.copy(result_get, offset_get, str_get, mod.i32.const(0), str_len),
							mod.local.set(OFFSET_IDX, mod.i32.add(offset_get, str_len)),
						]),
						mod.array.copy(result_get, offset_get, string_4_get, mod.i32.const(0), string_4_len),
						result_get,
					], cg.reftype.String)).value),
				);
			});

			test.suite('CollectionLinearNew', () => {
				test.test('empty TUPLE.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						();
					}`);
					return assertEqualBins(
						(stmts[0] as AST.StatementExpression).expr!.lower(opt).codegen(cg),
						new BinValue(cg, cg.codegenTuple()).value,
					);
				});
				test.test('nonempty TUPLE.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						val mut x: int = 42;
						(x, 4.2, (null,));
					}`);
					const mod = cg.module;
					return assertEqualBins(
						(stmts[1] as AST.StatementExpression).expr!.lower(opt).codegen(cg),
						new BinValue(cg, cg.codegenTuple([
							mod.local.get(0, cg.reftype.Value),
							genConst(cg, 4.2),
							mod.local.get(1, cg.reftype.Value),
						])).value,
					);
				});
				test.test('empty LIST.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						[];
					}`);
					return assertEqualBins(
						(stmts[0] as AST.StatementExpression).expr!.lower(opt).codegen(cg),
						new BinValue(cg, cg.codegenList()).value,
					);
				});
				test.test('nonempty LIST.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						val mut x: int = 42;
						[x, 4.2, (null,), x/2, @e];
					}`);
					const mod = cg.module;
					return assertEqualBins(
						(stmts[1] as AST.StatementExpression).expr!.lower(opt).codegen(cg),
						new BinValue(cg, cg.codegenList([
							mod.local.get(0, cg.reftypeNull.Value),
							genConst(cg, 4.2),
							mod.local.get(1, cg.reftypeNull.Value),
							mod.local.get(2, cg.reftypeNull.Value),
							genConst(cg, Symbol(0x101)),
						])).value,
					);
				});
				test.test('empty SET.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						{};
					}`);
					return assert.strictEqual(
						binaryen.emitText((stmts[0] as AST.StatementExpression).expr!.lower(opt).codegen(cg)),
						binaryen.emitText(new BinValue(cg, cg.codegenMap()).value).replaceAll('$1', '$0'),
					);
				});
				test.test('nonempty SET.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						val mut x: int = 42;
						{x, 4.2, (null,), x/2, @e};
					}`);
					const mod = cg.module;
					return assert.strictEqual(
						binaryen.emitText((stmts[1] as AST.StatementExpression).expr!.lower(opt).codegen(cg)),
						binaryen.emitText(new BinValue(cg, cg.codegenSet([
							new BinValue(cg, mod.local.get(0, cg.reftype.Value)).value,
							genConst(cg, 4.2),
							new BinValue(cg, mod.local.get(1, cg.reftype.Value)).value,
							new BinValue(cg, mod.local.get(2, cg.reftype.Value)).value, // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
							genConst(cg, Symbol(0x101)),
						])).value).replaceAll('$4', '$3'),
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
					}`);
					const mod = cg.module;
					return assertEqualBins(
						(stmts[1] as AST.StatementExpression).expr!.lower(opt).codegen(cg),
						new BinValue(cg, cg.codegenRecord(new Map([
							[257n, new BinValue(cg, mod.local.get(0, cg.reftype.Value)) .toProperty(257n)],
							[258n, new BinValue(cg, genConst(cg, 4.2))                  .toProperty(258n)],
							[259n, new BinValue(cg, mod.local.get(1, cg.reftype.Value)) .toProperty(259n)],
							[260n, new BinValue(cg, mod.local.get(2, cg.reftype.Value)) .toProperty(260n)], // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
							[261n, new BinValue(cg, genConst(cg, Symbol(0x105)))        .toProperty(261n)],
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
					}`);
					return assertEqualBins(
						stmts.slice(9).map((stmt) => (stmt as AST.StatementExpression).expr!.lower(opt).codegen(cg)),
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
				test.test('empty DICT.NEW', () => {
					// there exists no syntax for empty Dicts, so constructing it manually
					const cg = new Builder();
					return assertEqualBins(
						new IR.DictNew(new Map(), new TYPE.Dict(TYPE.INT)).codegen(cg),
						new BinValue(cg, cg.codegenDict()).value,
					);
				});
				test.test('nonempty DICT.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						val mut x: int = 42;
						[a= x, b= 4.2, c= (null,), d= x/2, e= @e];
					}`);
					const mod = cg.module;
					return assertEqualBins(
						(stmts[1] as AST.StatementExpression).expr!.lower(opt).codegen(cg),
						new BinValue(cg, cg.codegenDict(new Map([
							[257n, new BinValue(cg, mod.local.get(0, cg.reftype.Value)) .toProperty(257n)],
							[258n, new BinValue(cg, genConst(cg, 4.2))                  .toProperty(258n)],
							[259n, new BinValue(cg, mod.local.get(1, cg.reftype.Value)) .toProperty(259n)],
							[260n, new BinValue(cg, mod.local.get(2, cg.reftype.Value)) .toProperty(260n)],
							[261n, new BinValue(cg, genConst(cg, Symbol(0x105)))        .toProperty(261n)],
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
					}`);
					return assertEqualBins(
						stmts.slice(9).map((stmt) => (stmt as AST.StatementExpression).expr!.lower(opt).codegen(cg)),
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

			test.suite('MapNew', () => {
				test.test('empty MAP.NEW', () => {
					// there exists no syntax for empty Maps, so constructing it manually
					const cg = new Builder();
					return assert.strictEqual(
						binaryen.emitText(new IR.MapNew(new Map(), new TYPE.Map(TYPE.INT, TYPE.FLOAT)).codegen(cg)),
						binaryen.emitText(new BinValue(cg, cg.codegenMap()).value).replaceAll('$1', '$0'),
					);
				});
				test.test('nonempty MAP.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						val mut x: int = 42;
						{1.1 -> x, 2.2 -> 4.2, 3.3 -> (null,), 4.4 -> x/2, 5.5 -> @e};
					}`);
					const mod = cg.module;
					return assert.strictEqual(
						binaryen.emitText((stmts[1] as AST.StatementExpression).expr!.lower(opt).codegen(cg)),
						binaryen.emitText(new BinValue(cg, cg.codegenMap(new Map([
							[genConst(cg, 1.1), new BinValue(cg, mod.local.get(0, cg.reftype.Value)).value],
							[genConst(cg, 2.2), genConst(cg, 4.2)],
							[genConst(cg, 3.3), new BinValue(cg, mod.local.get(1, cg.reftype.Value)).value],
							[genConst(cg, 4.4), new BinValue(cg, mod.local.get(2, cg.reftype.Value)).value], // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
							[genConst(cg, 5.5), genConst(cg, Symbol(0x101))],
						]))).value).replaceAll('$4', '$3'),
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
				}`);
				const mod = cg.module;
				return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
					mod.drop(mod.array.get(
						new BinValue(cg, mod.local.get(2, cg.reftype.Value)).cast(cg.reftype.Tuple),
						mod.i32.const(2),
						cg.reftype.Value,
					)),
					mod.drop(mod.array.get(
						new BinValue(cg, mod.local.get(1, cg.reftype.Value)).cast(cg.reftype.Tuple),
						mod.i32.const(0),
						cg.reftype.Value,
					)),
					mod.drop(mod.array.get(
						new BinValue(cg, mod.local.get(1, cg.reftype.Value)).cast(cg.reftype.Tuple),
						mod.i32.const(1),
						cg.reftype.Value,
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
				}`);
				const mod = cg.module;
				return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
					mod.drop(mod.call('Record.get', [
						new BinValue(cg, mod.local.get(2, cg.reftype.Value)).cast(cg.reftype.Record),
						bigint_to_i64(mod, 0x103n, true),
					], cg.reftype.Value)),
					mod.drop(mod.call('Record.get', [
						new BinValue(cg, mod.local.get(1, cg.reftype.Value)).cast(cg.reftype.Record),
						bigint_to_i64(mod, 0x101n, true),
					], cg.reftype.Value)),
					mod.drop(mod.call('Record.get', [
						new BinValue(cg, mod.local.get(1, cg.reftype.Value)).cast(cg.reftype.Record),
						bigint_to_i64(mod, 0x102n, true),
					], cg.reftype.Value)),
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
						list.[-1];
					}`);
					const mod = cg.module;
					const list_get:   binaryen.ExpressionRef = mod.local.get(1, cg.reftype.Value);
					const item_0_get: binaryen.ExpressionRef = mod.local.get(4, cg.reftypeNull.Value);
					const item_1_get: binaryen.ExpressionRef = mod.local.get(5, cg.reftypeNull.Value);
					const item_2_get: binaryen.ExpressionRef = mod.local.get(6, cg.reftypeNull.Value);
					const item_3_get: binaryen.ExpressionRef = mod.local.get(7, cg.reftypeNull.Value);
					return assertEqualBins(opt.instructions.slice(4).map((instr) => instr.codegen(cg)), [
						mod.drop(mod.block(null, [
							mod.local.set(4, mod.array.get(
								cg.structGet.list.internal(new BinValue(cg, mod.local.get(2, cg.reftype.Value)).cast(cg.reftype.List)),
								mod.i32.wrap(new BinValue(cg, mod.local.get(3, cg.reftype.Value)).interpret('asInt')),
								cg.reftypeNull.Value,
							)),
							mod.if(
								mod.ref.is_null(item_0_get),
								genConst(cg),
								mod.ref.as_non_null(item_0_get),
							),
						], cg.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(5, mod.array.get(
								cg.structGet.list.internal(new BinValue(cg, list_get).cast(cg.reftype.List)),
								mod.i32.wrap(new BinValue(cg, genConst(cg, 0n)).interpret('asInt')),
								cg.reftypeNull.Value,
							)),
							mod.if(
								mod.ref.is_null(item_1_get),
								genConst(cg),
								mod.ref.as_non_null(item_1_get),
							),
						], cg.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(6, mod.array.get(
								cg.structGet.list.internal(new BinValue(cg, list_get).cast(cg.reftype.List)),
								mod.i32.wrap(new BinValue(cg, genConst(cg, 3n)).interpret('asInt')),
								cg.reftypeNull.Value,
							)),
							mod.if(
								mod.ref.is_null(item_2_get),
								genConst(cg),
								mod.ref.as_non_null(item_2_get),
							),
						], cg.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(7, mod.array.get(
								cg.structGet.list.internal(new BinValue(cg, list_get).cast(cg.reftype.List)),
								mod.i32.wrap(new BinValue(cg, genConst(cg, -1n)).interpret('asInt')),
								cg.reftypeNull.Value,
							)),
							mod.if(
								mod.ref.is_null(item_3_get),
								genConst(cg),
								mod.ref.as_non_null(item_3_get),
							),
						], cg.reftype.Value)),
					]);
				});
				test.test('DICT.GET', () => {
					const {opt, cg} = setupScript(`{
						val mut x:    int    = 42;
						val mut dict: [:int] = [a= 42, c= 43];

						[a= x, b= 43, c= 44].[@b];
						dict.[@a];
						dict.[@c];
					}`);
					const mod = cg.module;
					return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
						mod.drop(mod.block(null, [
							mod.local.set(3, mod.tuple.extract(mod.call('Dict.find', [
								new BinValue(cg, mod.local.get(2, cg.reftype.Value)).cast(cg.reftype.Dict),
								new BinValue(cg, genConst(cg, Symbol(0x104))).interpret('asNat'),
							], binaryen.createType([binaryen.i32, cg.reftypeNull.Property])), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(mod.local.get(3, cg.reftypeNull.Property)),
									mod.call('Property.is-tombstone', [mod.local.get(3, cg.reftypeNull.Property)], binaryen.i32),
								),
								genConst(cg),
								cg.structGet.property.val(mod.local.get(3, cg.reftypeNull.Property)),
							),
						], cg.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(4, mod.tuple.extract(mod.call('Dict.find', [
								new BinValue(cg, mod.local.get(1, cg.reftype.Value)).cast(cg.reftype.Dict),
								new BinValue(cg, genConst(cg, Symbol(0x101))).interpret('asNat'),
							], binaryen.createType([binaryen.i32, cg.reftypeNull.Property])), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(mod.local.get(4, cg.reftypeNull.Property)),
									mod.call('Property.is-tombstone', [mod.local.get(4, cg.reftypeNull.Property)], binaryen.i32),
								),
								genConst(cg),
								cg.structGet.property.val(mod.local.get(4, cg.reftypeNull.Property)),
							),
						], cg.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(5, mod.tuple.extract(mod.call('Dict.find', [
								new BinValue(cg, mod.local.get(1, cg.reftype.Value)).cast(cg.reftype.Dict),
								new BinValue(cg, genConst(cg, Symbol(0x102))).interpret('asNat'),
							], binaryen.createType([binaryen.i32, cg.reftypeNull.Property])), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(mod.local.get(5, cg.reftypeNull.Property)),
									mod.call('Property.is-tombstone', [mod.local.get(5, cg.reftypeNull.Property)], binaryen.i32),
								),
								genConst(cg),
								cg.structGet.property.val(mod.local.get(5, cg.reftypeNull.Property)),
							),
						], cg.reftype.Value)),
					]);
				});
				test.test('SET.GET', () => {
					const {opt, cg} = setupScript(`{
						val 'set': {float} = {4.2, 2.4};
						'set'.[4.2];
						'set'.[3.3];
					}`);
					const mod = cg.module;
					const base:         binaryen.ExpressionRef = mod.local.get(1, cg.reftype.Value); // index 0 = nonempty map setup (implementation of Set)
					const maybe_case_0: binaryen.ExpressionRef = mod.local.get(2, cg.reftypeNull.Case);
					const maybe_case_1: binaryen.ExpressionRef = mod.local.get(3, cg.reftypeNull.Case);
					return assertEqualBins(opt.instructions.slice(1).map((instr) => instr.codegen(cg)), [
						mod.drop(mod.block(null, [
							mod.local.set(2, mod.tuple.extract(mod.call('Map.find', [
								new BinValue(cg, base).cast(cg.reftype.Map),
								genConst(cg, 4.2),
							], binaryen.createType([binaryen.i32, cg.reftypeNull.Case])), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(maybe_case_0),
									mod.call('Case.is-tombstone', [maybe_case_0], binaryen.i32),
								),
								genConst(cg, false),
								genConst(cg, true),
							),
						], cg.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(3, mod.tuple.extract(mod.call('Map.find', [
								new BinValue(cg, base).cast(cg.reftype.Map),
								genConst(cg, 3.3),
							], binaryen.createType([binaryen.i32, cg.reftypeNull.Case])), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(maybe_case_1),
									mod.call('Case.is-tombstone', [maybe_case_1], binaryen.i32),
								),
								genConst(cg, false),
								genConst(cg, true),
							),
						], cg.reftype.Value)),
					]);
				});
				test.test('MAP.GET', () => {
					const {opt, cg} = setupScript(`{
						val map: {float -> int} = {4.2 -> 42, 2.4 -> 24};
						map.[4.2];
						map.[3.3];
					}`);
					const mod = cg.module;
					const base:         binaryen.ExpressionRef = mod.local.get(1, cg.reftype.Value); // index 0 = nonempty map setup
					const maybe_case_0: binaryen.ExpressionRef = mod.local.get(2, cg.reftypeNull.Case);
					const maybe_case_1: binaryen.ExpressionRef = mod.local.get(3, cg.reftypeNull.Case);
					return assertEqualBins(opt.instructions.slice(1).map((instr) => instr.codegen(cg)), [
						mod.drop(mod.block(null, [
							mod.local.set(2, mod.tuple.extract(mod.call('Map.find', [
								new BinValue(cg, base).cast(cg.reftype.Map),
								genConst(cg, 4.2),
							], binaryen.createType([binaryen.i32, cg.reftypeNull.Case])), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(maybe_case_0),
									mod.call('Case.is-tombstone', [maybe_case_0], binaryen.i32),
								),
								genConst(cg),
								cg.structGet.case.con(maybe_case_0),
							),
						], cg.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(3, mod.tuple.extract(mod.call('Map.find', [
								new BinValue(cg, base).cast(cg.reftype.Map),
								genConst(cg, 3.3),
							], binaryen.createType([binaryen.i32, cg.reftypeNull.Case])), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(maybe_case_1),
									mod.call('Case.is-tombstone', [maybe_case_1], binaryen.i32),
								),
								genConst(cg),
								cg.structGet.case.con(maybe_case_1),
							),
						], cg.reftype.Value)),
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
				}`, {codegen: false});
				const mod = cg.module;
				const CALL = {
					vnot: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vnot', [arg], cg.reftype.Value),
					vemp: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vemp', [arg], cg.reftype.Value),
					vneg: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vneg', [arg], cg.reftype.Value),
					vtoi: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vtoi', [arg], cg.reftype.Value),
					vton: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vton', [arg], cg.reftype.Value),
					vtof: (arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vtof', [arg], cg.reftype.Value),
				} as const;
				return assertEqualBins(
					stmts.map((stmt) => (stmt as AST.StatementExpression).expr!.lower(opt).codegen(cg)),
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
				}`, {codegen: false});
				const mod = cg.module;
				const CALL = {
					viadd:   (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('viadd',   [arg0, arg1], cg.reftype.Value),
					vfadd:   (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vfadd',   [arg0, arg1], cg.reftype.Value),
					visub_s: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('visub_s', [arg0, arg1], cg.reftype.Value),
					visub_u: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('visub_u', [arg0, arg1], cg.reftype.Value),
					vfsub:   (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vfsub',   [arg0, arg1], cg.reftype.Value),
					vimul:   (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vimul',   [arg0, arg1], cg.reftype.Value),
					vfmul:   (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vfmul',   [arg0, arg1], cg.reftype.Value),
					vidiv_s: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vidiv_s', [arg0, arg1], cg.reftype.Value),
					vidiv_u: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vidiv_u', [arg0, arg1], cg.reftype.Value),
					vfdiv:   (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vfdiv',   [arg0, arg1], cg.reftype.Value),
					viexp:   (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('viexp',   [arg0, arg1], cg.reftype.Value),
					vlt:     (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vlt',     [arg0, arg1], cg.reftype.Value),
					vgt:     (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vgt',     [arg0, arg1], cg.reftype.Value),
					vle:     (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vle',     [arg0, arg1], cg.reftype.Value),
					vge:     (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vge',     [arg0, arg1], cg.reftype.Value),
					vid:     (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vid',     [arg0, arg1], cg.reftype.Value),
					veq:     (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('veq',     [arg0, arg1], cg.reftype.Value),
				} as const;
				return assertEqualBins(
					stmts.map((stmt) => (stmt as AST.StatementExpression).expr!.lower(opt).codegen(cg)),
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
		});
	});


	test.suite('Instruction', () => {
		test.suite('#codegen', () => {
			test.test('Drop returns (drop).', () => {
				const {opt, cg} = setupScript(`{
					null;
					false;
					@hello;
					42;
					4.2;
				}`, {codegen: false});
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
				}`, {codegen: false});
				const mod = cg.module;
				return assertEqualBins(
					opt.instructions.map((instr) => instr.codegen(cg)),
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

			test.test('uninitialized Decl returns (local.set) with (struct.new_default).', () => {
				// there exists no syntax for empty Decls, so constructing it manually
				const cg = new Builder();
				assertEqualBins(
					new IR.Decl(new Optimizer().newTemp(TYPE.INT)).codegen(cg),
					cg.module.local.set(0, cg.module.struct.new_default(cg.reftype.Value)),
				);
			});

			test.suite('CollectionDynamicSet', () => {
				test.test('LIST.SET', () => {
					const {opt, cg} = setupScript(`{
						val mut x:    int       = 42;
						val mut list: mut [int] = [42, 43];

						set [x, 43, 44].[1 + 1] = 45;
						set list.[0] = 46;
						set list.[2] = 47;
					}`);
					const mod = cg.module;
					return assertEqualBins(opt.instructions.slice(4).map((instr) => instr.codegen(cg)), [
						mod.call('List.set', [
							new BinValue(cg, mod.local.get(2, cg.reftype.Value)).cast(cg.reftype.List),
							mod.i32.wrap(new BinValue(cg, mod.local.get(3, cg.reftype.Value)).interpret('asInt')),
							genConst(cg, 45n),
						], binaryen.none),
						mod.call('List.set', [
							new BinValue(cg, mod.local.get(1, cg.reftype.Value)).cast(cg.reftype.List),
							mod.i32.wrap(new BinValue(cg, genConst(cg, 0n)).interpret('asInt')),
							genConst(cg, 46n),
						], binaryen.none),
						mod.call('List.set', [
							new BinValue(cg, mod.local.get(1, cg.reftype.Value)).cast(cg.reftype.List),
							mod.i32.wrap(new BinValue(cg, genConst(cg, 2n)).interpret('asInt')),
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
					}`);
					const mod = cg.module;
					return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
						mod.call('Dict.set', [
							new BinValue(cg, mod.local.get(2, cg.reftype.Value)).cast(cg.reftype.Dict),
							new BinValue(cg, genConst(cg, Symbol(0x104))).interpret('asNat'),
							genConst(cg, 45n),
						], binaryen.none),
						mod.call('Dict.set', [
							new BinValue(cg, mod.local.get(1, cg.reftype.Value)).cast(cg.reftype.Dict),
							new BinValue(cg, genConst(cg, Symbol(0x101))).interpret('asNat'),
							genConst(cg, 46n),
						], binaryen.none),
						mod.call('Dict.set', [
							new BinValue(cg, mod.local.get(1, cg.reftype.Value)).cast(cg.reftype.Dict),
							new BinValue(cg, genConst(cg, Symbol(0x102))).interpret('asNat'),
							genConst(cg, 47n),
						], binaryen.none),
					]);
				});
				test.test('SET.SET', () => {
					const {opt, cg} = setupScript(`{
						val 'set': mut {float} = {4.2, 2.4};
						set 'set'.[4.2] = false;
						set 'set'.[3.3] = true;
					}`, {codegen: false});
					const mod = cg.module;
					const base:           binaryen.ExpressionRef = mod.local.get(1, cg.reftype.Value); // index 0 = nonempty map setup (implementation of Set)
					const base_get_0:     binaryen.ExpressionRef = mod.local.get(2, cg.reftype.Map);
					const accessor_get_0: binaryen.ExpressionRef = mod.local.get(3, cg.reftype.Value);
					const base_get_1:     binaryen.ExpressionRef = mod.local.get(4, cg.reftype.Map);
					const accessor_get_1: binaryen.ExpressionRef = mod.local.get(5, cg.reftype.Value);
					opt.instructions[0].codegen(cg);
					return assertEqualBins(opt.instructions.slice(1).map((instr) => instr.codegen(cg)), [
						mod.block(null, [
							mod.local.set(2, new BinValue(cg, base).cast(cg.reftype.Map)),
							mod.local.set(3, genConst(cg, 4.2)),
							mod.if(
								new BinVect(mod, new BinValue(cg, genConst(cg, false)).asPrimitive).isSpecial(true),
								mod.call('Map.set', [base_get_0, accessor_get_0, genConst(cg)], binaryen.none),
								mod.drop(mod.call('Map.delete', [base_get_0, accessor_get_0], cg.reftypeNull.Value)),
							),
						]),
						mod.block(null, [
							mod.local.set(4, new BinValue(cg, base).cast(cg.reftype.Map)),
							mod.local.set(5, genConst(cg, 3.3)),
							mod.if(
								new BinVect(mod, new BinValue(cg, genConst(cg, true)).asPrimitive).isSpecial(true),
								mod.call('Map.set', [base_get_1, accessor_get_1, genConst(cg)], binaryen.none),
								mod.drop(mod.call('Map.delete', [base_get_1, accessor_get_1], cg.reftypeNull.Value)),
							),
						]),
					]);
				});
				test.test('MAP.SET', () => {
					const {opt, cg} = setupScript(`{
						val map: mut {float -> int} = {4.2 -> 42, 2.4 -> 24};
						set map.[4.2] = 21;
						set map.[3.3] = 21;
					}`);
					const mod = cg.module;
					const base: binaryen.ExpressionRef = mod.local.get(1, cg.reftype.Value); // index 0 = nonempty map setup
					return assertEqualBins(opt.instructions.slice(1).map((instr) => instr.codegen(cg)), [
						mod.call('Map.set', [new BinValue(cg, base).cast(cg.reftype.Map), genConst(cg, 4.2), genConst(cg, 21n)], binaryen.none),
						mod.call('Map.set', [new BinValue(cg, base).cast(cg.reftype.Map), genConst(cg, 3.3), genConst(cg, 21n)], binaryen.none),
					]);
				});
			});

			test.suite('CollectionDynamicCopy', () => {
				test.suite('LIST.COPY', () => {
					test.test('tuple argument.', () => {
						const {opt, cg} = setupScript(`{
							List.<int>((2, 3, 5));
						}`, {codegen: false});
						const mod = cg.module;
						const destlist_get: binaryen.ExpressionRef = mod.local.get(2, cg.reftype.List);
						const srcref_get:   binaryen.ExpressionRef = mod.local.get(3, cg.reftype.Tuple);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, new BinValue(cg, mod.local.get(0, cg.reftype.Value)).cast(cg.reftype.List)),
								mod.local.set(3, new BinValue(cg, mod.local.get(1, cg.reftype.Value)).cast(cg.reftype.Tuple)),
								mod.call('List.adjust-capacity', [
									destlist_get,
									mod.call('capacity-needed', [mod.array.len(srcref_get)], binaryen.i32),
								], binaryen.none),
								mod.array.copy(
									cg.structGet.list.internal(destlist_get),
									mod.i32.const(0),
									srcref_get,
									mod.i32.const(0),
									mod.array.len(srcref_get),
								),
							]),
						);
					});
					test.test('List argument.', () => {
						const {opt, cg} = setupScript(`{
							List.<int>([2, 3, 5]);
						}`, {codegen: false});
						const mod = cg.module;
						const destlist_get: binaryen.ExpressionRef = mod.local.get(2, cg.reftype.List);
						const srcref_get:   binaryen.ExpressionRef = mod.local.get(3, cg.reftype.ListInternal);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, new BinValue(cg, mod.local.get(0, cg.reftype.Value)).cast(cg.reftype.List)),
								mod.local.set(3, cg.structGet.list.internal(new BinValue(cg, mod.local.get(1, cg.reftype.Value)).cast(cg.reftype.List))),
								mod.call('List.adjust-capacity', [
									destlist_get,
									mod.array.len(srcref_get),
								], binaryen.none),
								mod.array.copy(
									cg.structGet.list.internal(destlist_get),
									mod.i32.const(0),
									srcref_get,
									mod.i32.const(0),
									mod.array.len(srcref_get),
								),
							]),
						);
					});
					test.test('Set argument.', () => {
						const {opt, cg} = setupScript(`{
							List.<int>({2, 3, 5});
						}`, {codegen: false});
						const mod = cg.module;
						const cases_get: binaryen.ExpressionRef = mod.local.get(4, cg.reftype.MapInternal);
						const j_get:     binaryen.ExpressionRef = mod.local.get(5, binaryen.i32);
						const i_get:     binaryen.ExpressionRef = mod.local.get(6, binaryen.i32);
						const case_get:  binaryen.ExpressionRef = mod.local.get(7, cg.reftypeNull.Case);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(5, mod.i32.const(0)),
								mod.block(null, [
									mod.local.set(3, new BinValue(cg, mod.local.get(0, cg.reftype.Value)).cast(cg.reftype.List)),
									mod.local.set(4, cg.structGet.map.internal(new BinValue(cg, mod.local.get(2, cg.reftype.Value)).cast(cg.reftype.Map))), // index 1 = nonempty map setup (implementation of Set)
									mod.block('exit-0', [
										mod.local.set(6, mod.i32.const(0)),
										mod.loop('repeat-0', mod.block(null, [
											mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(cases_get))),
											mod.local.set(7, mod.array.get(cases_get, i_get, cg.reftypeNull.Case)),
											mod.if(
												mod.i32.eqz(mod.ref.is_null(case_get)),
												mod.block(null, [
													mod.call('List.set', [
														mod.local.get(3, cg.reftype.List),
														j_get,
														cg.structGet.case.ant(case_get),
													], binaryen.none),
													mod.local.set(5, mod.i32.add(j_get, mod.i32.const(1))),
												]),
											),
											mod.local.set(6, mod.i32.add(i_get, mod.i32.const(1))),
											mod.br('repeat-0'),
										])),
									]),
								]),
							]),
						);
					});
				});
				test.suite('DICT.COPY', () => {
					test.test('tuple argument.', () => {
						const {opt, cg} = setupScript(`{
							Dict.<int>(( (@a, 2), (@b, 3), (@c, 5) ));
						}`, {codegen: false});
						const mod = cg.module;
						const pairs_get: binaryen.ExpressionRef = mod.local.get(6, cg.reftype.Tuple);
						const i_get:     binaryen.ExpressionRef = mod.local.get(7, binaryen.i32);
						opt.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(5, new BinValue(cg, mod.local.get(0, cg.reftype.Value)).cast(cg.reftype.Dict)),
								mod.local.set(6, new BinValue(cg, mod.local.get(4, cg.reftype.Value)).cast(cg.reftype.Tuple)),
								mod.block('exit-0', [
									mod.local.set(7, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(pairs_get))),
										mod.local.set(8, mod.array.get(pairs_get, i_get, cg.reftype.Value)),
										mod.call('Dict.set', [
											mod.local.get(5, cg.reftype.Dict),
											new BinValue(cg, mod.array.get(
												mod.local.tee(9, new BinValue(cg, mod.local.get(8, cg.reftype.Value)).cast(cg.reftype.Tuple), cg.reftype.Tuple),
												mod.i32.const(0),
												cg.reftype.Value,
											)).interpret('asNat'),
											mod.array.get(mod.local.get(9, cg.reftype.Tuple), mod.i32.const(1), cg.reftype.Value),
										], binaryen.none),
										mod.local.set(7, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('record argument.', () => {
						const {opt, cg} = setupScript(`{
							Dict.<int>((a= 2, b= 3, c= 5));
						}`, {codegen: false});
						const mod = cg.module;
						const destdict_get: binaryen.ExpressionRef = mod.local.get(2, cg.reftype.Dict);
						const srcref_get:   binaryen.ExpressionRef = mod.local.get(3, cg.reftype.Record);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, new BinValue(cg, mod.local.get(0, cg.reftype.Value)).cast(cg.reftype.Dict)),
								mod.local.set(3, new BinValue(cg, mod.local.get(1, cg.reftype.Value)).cast(cg.reftype.Record)),
								mod.call('Dict.adjust-capacity', [
									destdict_get,
									mod.call('capacity-needed', [mod.array.len(srcref_get)], binaryen.i32),
								], binaryen.none),
								mod.array.copy(
									cg.structGet.dict.internal(destdict_get),
									mod.i32.const(0),
									srcref_get,
									mod.i32.const(0),
									mod.array.len(srcref_get),
								),
							]),
						);
					});
					test.test('List argument.', () => {
						const {opt, cg} = setupScript(`{
							Dict.<int>([ (@a, 2), (@b, 3), (@c, 5) ]);
						}`, {codegen: false});
						const mod = cg.module;
						const pairs_get: binaryen.ExpressionRef = mod.local.get(6, cg.reftype.ListInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(7, binaryen.i32);
						const item_get:  binaryen.ExpressionRef = mod.local.get(8, cg.reftypeNull.Value);
						opt.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(5, new BinValue(cg, mod.local.get(0, cg.reftype.Value)).cast(cg.reftype.Dict)),
								mod.local.set(6, cg.structGet.list.internal(new BinValue(cg, mod.local.get(4, cg.reftype.Value)).cast(cg.reftype.List))),
								mod.block('exit-0', [
									mod.local.set(7, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(pairs_get))),
										mod.local.set(8, mod.array.get(pairs_get, i_get, cg.reftypeNull.Value)),
										mod.if(
											mod.i32.eqz(mod.ref.is_null(item_get)),
											mod.call('Dict.set', [
												mod.local.get(5, cg.reftype.Dict),
												new BinValue(cg, mod.array.get(
													mod.local.tee(9, new BinValue(cg, item_get).cast(cg.reftype.Tuple), cg.reftype.Tuple),
													mod.i32.const(0),
													cg.reftype.Value,
												)).interpret('asNat'),
												mod.array.get(mod.local.get(9, cg.reftype.Tuple), mod.i32.const(1), cg.reftype.Value),
											], binaryen.none),
										),
										mod.local.set(7, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('Dict argument.', () => {
						const {opt, cg} = setupScript(`{
							Dict.<int>([a= 2, b= 3, c= 5]);
						}`, {codegen: false});
						const mod = cg.module;
						const destdict_get: binaryen.ExpressionRef = mod.local.get(2, cg.reftype.Dict);
						const srcref_get:   binaryen.ExpressionRef = mod.local.get(3, cg.reftype.DictInternal);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, new BinValue(cg, mod.local.get(0, cg.reftype.Value)).cast(cg.reftype.Dict)),
								mod.local.set(3, cg.structGet.dict.internal(new BinValue(cg, mod.local.get(1, cg.reftype.Value)).cast(cg.reftype.Dict))),
								mod.call('Dict.adjust-capacity', [
									destdict_get,
									mod.array.len(srcref_get),
								], binaryen.none),
								mod.array.copy(
									cg.structGet.dict.internal(destdict_get),
									mod.i32.const(0),
									srcref_get,
									mod.i32.const(0),
									mod.array.len(srcref_get),
								),
							]),
						);
					});
					test.test('Set argument.', () => {
						const {opt, cg} = setupScript(`{
							Dict.<int>({ (@a, 2), (@b, 3), (@c, 5) });
						}`, {codegen: false});
						const mod = cg.module;
						const cases_get: binaryen.ExpressionRef = mod.local.get(7, cg.reftype.MapInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(8, binaryen.i32);
						const case_get:  binaryen.ExpressionRef = mod.local.get(9, cg.reftypeNull.Case);
						opt.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(6, new BinValue(cg, mod.local.get(0, cg.reftype.Value)).cast(cg.reftype.Dict)),
								mod.local.set(7, cg.structGet.map.internal(new BinValue(cg, mod.local.get(5, cg.reftype.Value)).cast(cg.reftype.Map))), // index 4 = nonempty map setup (implementation of Set)
								mod.block('exit-0', [
									mod.local.set(8, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(cases_get))),
										mod.local.set(9, mod.array.get(cases_get, i_get, cg.reftypeNull.Case)),
										mod.if(
											mod.i32.eqz(mod.ref.is_null(case_get)),
											mod.call('Dict.set', [
												mod.local.get(6, cg.reftype.Dict),
												new BinValue(cg, mod.array.get(
													mod.local.tee(10, new BinValue(cg, cg.structGet.case.ant(case_get)).cast(cg.reftype.Tuple), cg.reftype.Tuple),
													mod.i32.const(0),
													cg.reftype.Value,
												)).interpret('asNat'),
												mod.array.get(mod.local.get(10, cg.reftype.Tuple), mod.i32.const(1), cg.reftype.Value),
											], binaryen.none),
										),
										mod.local.set(8, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('Map argument.', () => {
						const {opt, cg} = setupScript(`{
							Dict.<int>({@a -> 2, @b -> 3, @c -> 5});
						}`, {codegen: false});
						const mod = cg.module;
						const cases_get: binaryen.ExpressionRef = mod.local.get(4, cg.reftype.MapInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(5, binaryen.i32);
						const case_get:  binaryen.ExpressionRef = mod.local.get(6, cg.reftypeNull.Case);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(3, new BinValue(cg, mod.local.get(0, cg.reftype.Value)).cast(cg.reftype.Dict)),
								mod.local.set(4, cg.structGet.map.internal(new BinValue(cg, mod.local.get(2, cg.reftype.Value)).cast(cg.reftype.Map))), // index 1 = nonempty map setup
								mod.block('exit-0', [
									mod.local.set(5, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(cases_get))),
										mod.local.set(6, mod.array.get(cases_get, i_get, cg.reftypeNull.Case)),
										mod.if(
											mod.i32.eqz(mod.ref.is_null(case_get)),
											mod.block(null, [
												mod.call('Dict.set', [
													mod.local.get(3, cg.reftype.Dict),
													new BinValue(cg, cg.structGet.case.ant(case_get)).interpret('asNat'),
													cg.structGet.case.con(case_get),
												], binaryen.none),
											]),
										),
										mod.local.set(5, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
				});
				test.suite('SET.COPY', () => {
					test.test('tuple argument.', () => {
						const {opt, cg} = setupScript(`{
							Set.<int>((2, 3, 5));
						}`, {codegen: false});
						const mod = cg.module;
						const items_get: binaryen.ExpressionRef = mod.local.get(3, cg.reftype.Tuple);
						const i_get:     binaryen.ExpressionRef = mod.local.get(4, binaryen.i32);
						const item_get:  binaryen.ExpressionRef = mod.local.get(5, cg.reftype.Value);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, new BinValue(cg, mod.local.get(0, cg.reftype.Value)).cast(cg.reftype.Map)),
								mod.local.set(3, new BinValue(cg, mod.local.get(1, cg.reftype.Value)).cast(cg.reftype.Tuple)),
								mod.block('exit-0', [
									mod.local.set(4, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(items_get))),
										mod.local.set(5, mod.array.get(items_get, i_get, cg.reftype.Value)),
										mod.call('Map.set', [
											mod.local.get(2, cg.reftype.Map),
											item_get,
											genConst(cg),
										], binaryen.none),
										mod.local.set(4, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('List argument.', () => {
						const {opt, cg} = setupScript(`{
							Set.<int>([2, 3, 5]);
						}`, {codegen: false});
						const mod = cg.module;
						const items_get: binaryen.ExpressionRef = mod.local.get(3, cg.reftype.ListInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(4, binaryen.i32);
						const item_get:  binaryen.ExpressionRef = mod.local.get(5, cg.reftype.Value);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, new BinValue(cg, mod.local.get(0, cg.reftype.Value)).cast(cg.reftype.Map)),
								mod.local.set(3, cg.structGet.list.internal(new BinValue(cg, mod.local.get(1, cg.reftype.Value)).cast(cg.reftype.List))),
								mod.block('exit-0', [
									mod.local.set(4, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(items_get))),
										mod.local.set(5, mod.array.get(items_get, i_get, cg.reftypeNull.Value)),
										mod.if(
											mod.i32.eqz(mod.ref.is_null(item_get)),
											mod.call('Map.set', [
												mod.local.get(2, cg.reftype.List),
												mod.ref.as_non_null(item_get),
												genConst(cg),
											], binaryen.none),
										),
										mod.local.set(4, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('Set argument.', () => {
						const {opt, cg} = setupScript(`{
							Set.<int>({2, 3, 5});
						}`, {codegen: false});
						const mod = cg.module;
						const destset_get: binaryen.ExpressionRef = mod.local.get(3, cg.reftype.Map);
						const srcref_get:  binaryen.ExpressionRef = mod.local.get(4, cg.reftype.MapInternal);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(3, new BinValue(cg, mod.local.get(0, cg.reftype.Value)).cast(cg.reftype.Map)),
								mod.local.set(4, cg.structGet.map.internal(new BinValue(cg, mod.local.get(2, cg.reftype.Value)).cast(cg.reftype.Map))), // index 1 = nonempty map setup (implementation of Set)
								mod.call('Map.adjust-capacity', [
									destset_get,
									mod.array.len(srcref_get),
								], binaryen.none),
								mod.array.copy(
									cg.structGet.map.internal(destset_get),
									mod.i32.const(0),
									srcref_get,
									mod.i32.const(0),
									mod.array.len(srcref_get),
								),
							]),
						);
					});
				});
				test.suite('MAP.COPY', () => {
					test.test('tuple argument.', () => {
						const {opt, cg} = setupScript(`{
							Map.<float, int>(( (1.414, 2), (1.732, 3), (2.236, 5) ));
						}`, {codegen: false});
						const mod = cg.module;
						const pairs_get: binaryen.ExpressionRef = mod.local.get(6, cg.reftype.Tuple);
						const i_get:     binaryen.ExpressionRef = mod.local.get(7, binaryen.i32);
						opt.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(5, new BinValue(cg, mod.local.get(0, cg.reftype.Value)).cast(cg.reftype.Map)),
								mod.local.set(6, new BinValue(cg, mod.local.get(4, cg.reftype.Value)).cast(cg.reftype.Tuple)),
								mod.block('exit-0', [
									mod.local.set(7, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(pairs_get))),
										mod.local.set(8, mod.array.get(pairs_get, i_get, cg.reftype.Value)),
										mod.call('Map.set', [
											mod.local.get(5, cg.reftype.Map),
											mod.array.get(mod.local.tee(9, new BinValue(cg, mod.local.get(8, cg.reftype.Value)).cast(cg.reftype.Tuple), cg.reftype.Tuple), mod.i32.const(0), cg.reftype.Value),
											mod.array.get(mod.local.get(9, cg.reftype.Tuple), mod.i32.const(1), cg.reftype.Value),
										], binaryen.none),
										mod.local.set(7, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('List argument.', () => {
						const {opt, cg} = setupScript(`{
							Map.<float, int>([ (1.414, 2), (1.732, 3), (2.236, 5) ]);
						}`, {codegen: false});
						const mod = cg.module;
						const pairs_get: binaryen.ExpressionRef = mod.local.get(6, cg.reftype.ListInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(7, binaryen.i32);
						const item_get:  binaryen.ExpressionRef = mod.local.get(8, cg.reftypeNull.Value);
						opt.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(5, new BinValue(cg, mod.local.get(0, cg.reftype.Value)).cast(cg.reftype.Map)),
								mod.local.set(6, cg.structGet.list.internal(new BinValue(cg, mod.local.get(4, cg.reftype.Value)).cast(cg.reftype.List))),
								mod.block('exit-0', [
									mod.local.set(7, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(pairs_get))),
										mod.local.set(8, mod.array.get(pairs_get, i_get, cg.reftypeNull.Value)),
										mod.if(
											mod.i32.eqz(mod.ref.is_null(item_get)),
											mod.call('Map.set', [
												mod.local.get(5, cg.reftype.Map),
												mod.array.get(mod.local.tee(9, new BinValue(cg, item_get).cast(cg.reftype.Tuple), cg.reftype.Tuple), mod.i32.const(0), cg.reftype.Value),
												mod.array.get(mod.local.get(9, cg.reftype.Tuple), mod.i32.const(1), cg.reftype.Value),
											], binaryen.none),
										),
										mod.local.set(7, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('Set argument.', () => {
						const {opt, cg} = setupScript(`{
							Map.<float, int>({ (1.414, 2), (1.732, 3), (2.236, 5) });
						}`, {codegen: false});
						const mod = cg.module;
						const cases_get: binaryen.ExpressionRef = mod.local.get(7, cg.reftype.MapInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(8, binaryen.i32);
						const case_get:  binaryen.ExpressionRef = mod.local.get(9, cg.reftypeNull.Case);
						opt.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(6, new BinValue(cg, mod.local.get(0, cg.reftype.Value)).cast(cg.reftype.Map)),
								mod.local.set(7, cg.structGet.map.internal(new BinValue(cg, mod.local.get(5, cg.reftype.Value)).cast(cg.reftype.Map))), // index 4 = nonempty map setup (implementation of Set)
								mod.block('exit-0', [
									mod.local.set(8, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(cases_get))),
										mod.local.set(9, mod.array.get(cases_get, i_get, cg.reftypeNull.Case)),
										mod.if(
											mod.i32.eqz(mod.ref.is_null(case_get)),
											mod.call('Map.set', [
												mod.local.get(6, cg.reftype.Map),
												mod.array.get(mod.local.tee(10, new BinValue(cg, cg.structGet.case.ant(case_get)).cast(cg.reftype.Tuple), cg.reftype.Tuple), mod.i32.const(0), cg.reftype.Value),
												mod.array.get(mod.local.get(10, cg.reftype.Tuple), mod.i32.const(1), cg.reftype.Value),
											], binaryen.none),
										),
										mod.local.set(8, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('Map argument.', () => {
						const {opt, cg} = setupScript(`{
							Map.<float, int>({1.414 -> 2, 1.732 -> 3, 2.236 -> 5});
						}`, {codegen: false});
						const mod = cg.module;
						const destmap_get: binaryen.ExpressionRef = mod.local.get(3, cg.reftype.Map);
						const srcref_get:  binaryen.ExpressionRef = mod.local.get(4, cg.reftype.MapInternal);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(3, new BinValue(cg, mod.local.get(0, cg.reftype.Value)).cast(cg.reftype.Map)),
								mod.local.set(4, cg.structGet.map.internal(new BinValue(cg, mod.local.get(2, cg.reftype.Value)).cast(cg.reftype.Map))), // index 1 = nonempty map setup (implementation of Set)
								mod.call('Map.adjust-capacity', [
									destmap_get,
									mod.array.len(srcref_get),
								], binaryen.none),
								mod.array.copy(
									cg.structGet.map.internal(destmap_get),
									mod.i32.const(0),
									srcref_get,
									mod.i32.const(0),
									mod.array.len(srcref_get),
								),
							]),
						);
					});
				});
			});
		});
	});


	test.test('WASM module validates.', () => {
		setupScript(`{
			null;
			false;
			@hello;
			42;
			4.2;

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

			val user: (name: str) = (name= "Alan");
			"""Hello, {{ user.name }}, you have {{ 2 * 3 }} new messages.""";

			();

			val mut x1: int = 42;
			(x1, 4.2, (null,));

			[];

			val mut x2: int = 42;
			[x2, 4.2, (null,), x2/2, @e];

			{};

			{x2, 4.2, (null,), x2/2, @e};

			val mut x3: int = 42;
			(a= x3, b= 4.2, c= (null,), d= x3/2, e= @e);

			@b;
			@c;
			@a;
			@bb;
			@cc;
			@aa;
			@bbb;
			@ccc;
			@aaa;
			(a= 42, aa= false, b= 4.2);
			(aa= true, c= null, a= 42);
			(b= 42, bb= 4.2, bbb= null);

			val mut x4: int = 42;
			[a= x4, b= 4.2, c= (null,), d= x4/2, e= @e];

			@b;
			@c;
			@a;
			@bb;
			@cc;
			@aa;
			@bbb;
			@ccc;
			@aaa;
			[a= 42, aa= false, b= 4.2];
			[aa= true, c= null, a= 42];
			[b= 42, c= 4.2, aaa= null];

			{1.1 -> x4, 2.2 -> 4.2, 3.3 -> (null,), 4.4 -> x4/2, 5.5 -> @e};

			val mut tup1: (int, int, ?: int) = (42, 43);
			val mut rec1: (a: int, b: int, c?: int) = (a= 42, b= 43);
			val mut list1: [int] = [42, 43];
			val mut dict1: [:int] = [a= 42, c= 43];
			val 'set1': {float} = {4.2, 2.4};
			val map1: {float -> int} = {4.2 -> 42, 2.4 -> 24};

			(x1, 43, 44).2;
			tup1.0;
			tup1.1;

			(a= x2, b= 43, c= 44).c;
			rec1.a;
			rec1.b;

			[x3, 43, 44].[1 + 1];
			list1.[0];
			list1.[3];
			list1.[-1];

			[a= x4, b= 43, c= 44].[@b];
			dict1.[@a];
			dict1.[@c];

			'set1'.[4.2];
			'set1'.[3.3];

			map1.[4.2];
			map1.[3.3];

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

			set a = null;
			set b = true;
			set c = @world;
			set d = 43;
			set e = 4.3;

			val mut list2: mut [int] = [42, 43];
			val mut dict2: mut [:int] = [a= 42, c= 43];
			val 'set2': mut {float} = {4.2, 2.4};
			val map2: mut {float -> int} = {4.2 -> 42, 2.4 -> 24};

			set [x1, 43, 44].[1 + 1] = 45;
			set list2.[0] = 46;
			set list2.[2] = 47;

			set [a= x2, b= 43, c= 44].[@b] = 45;
			set dict2.[@a] = 46;
			set dict2.[@c] = 47;

			set {x3, x4}.[x3] = false;
			set 'set2'.[4.2] = false;
			set 'set2'.[3.3] = true;

			set {x3 -> 4.2, x4 -> 2.4}.[x3] = 2.4;
			set map2.[4.2] = 21;
			set map2.[3.3] = 21;

			List.<int>((2, 3, 5));
			List.<int>([2, 3, 5]);
			List.<int>({2, 3, 5});
			Dict.<int>(( (@a, 2), (@b, 3), (@c, 5) ));
			Dict.<int>((a= 2, b= 3, c= 5));
			Dict.<int>([ (@a, 2), (@b, 3), (@c, 5) ]);
			Dict.<int>([a= 2, b= 3, c= 5]);
			Dict.<int>({ (@a, 2), (@b, 3), (@c, 5) });
			Dict.<int>({@a -> 2, @b -> 3, @c -> 5});
			Set.<int>((2, 3, 5));
			Set.<int>([2, 3, 5]);
			Set.<int>({2, 3, 5});
			Map.<float, int>(( (1.414, 2), (1.732, 3), (2.236, 5) ));
			Map.<float, int>([ (1.414, 2), (1.732, 3), (2.236, 5) ]);
			Map.<float, int>({ (1.414, 2), (1.732, 3), (2.236, 5) });
			Map.<float, int>({1.414 -> 2, 1.732 -> 3, 2.236 -> 5});
		}`); // assert does not throw
	});
});

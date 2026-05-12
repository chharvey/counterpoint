import * as assert from 'node:assert';
import * as test from 'node:test';
import binaryen from 'binaryen';
import {
	type AST,
	VALUE,
	TYPE,
	Optimizer,
	IR,
	bigint_to_i64,
	Builder,
} from '../../src/index.ts';
import {assertEqualBins} from '../assert-helpers.ts';
import {
	setupScript,
	genConst,
} from '../helpers.ts';



test.suite('Opcode', () => {
	test.suite('Value', () => {
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
					stmts.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
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
					stmts.slice(5).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
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
					mod.drop(cg.newValue(mod.block(null, [
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
					], cg.reftype.String))),
				);
			});

			test.suite('CollectionLinearNew', () => {
				test.test('empty TUPLE.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						();
					}`);
					return assertEqualBins(
						(stmts[0] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
						cg.newValue(cg.codegenTuple()),
					);
				});
				test.test('nonempty TUPLE.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						val mut x: int = 42;
						(x, 4.2, (null,));
					}`);
					const mod = cg.module;
					return assertEqualBins(
						(stmts[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
						cg.newValue(cg.codegenTuple([
							mod.local.get(0, cg.reftype.Value),
							genConst(cg, 4.2),
							mod.local.get(1, cg.reftype.Value),
						])),
					);
				});
				test.test('empty LIST.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						[];
					}`);
					return assertEqualBins(
						(stmts[0] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
						cg.newValue(cg.codegenList()),
					);
				});
				test.test('nonempty LIST.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						val mut x: int = 42;
						[x, 4.2, (null,), x/2, @e];
					}`);
					const mod = cg.module;
					return assertEqualBins(
						(stmts[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
						cg.newValue(cg.codegenList([
							mod.local.get(0, cg.reftypeNull.Value),
							genConst(cg, 4.2),
							mod.local.get(1, cg.reftypeNull.Value),
							mod.local.get(2, cg.reftypeNull.Value),
							genConst(cg, Symbol(0x101)),
						])),
					);
				});
				test.test('empty SET.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						{};
					}`);
					return assert.strictEqual(
						binaryen.emitText((stmts[0] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
						binaryen.emitText(cg.newValue(cg.codegenMap())).replaceAll('$1', '$0'),
					);
				});
				test.test('nonempty SET.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						val mut x: int = 42;
						{x, 4.2, (null,), x/2, @e};
					}`);
					const mod = cg.module;
					return assert.strictEqual(
						binaryen.emitText((stmts[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
						binaryen.emitText(cg.newValue(cg.codegenSet([
							mod.local.get(0, cg.reftype.Value),
							genConst(cg, 4.2),
							mod.local.get(1, cg.reftype.Value),
							mod.local.get(2, cg.reftype.Value), // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
							genConst(cg, Symbol(0x101)),
						]))).replaceAll('$4', '$3'),
					);
				});
			});

			test.suite('RecordNew', () => {
				test.test('empty RECORD.NEW', () => {
					// there exists no syntax for empty records, so constructing it manually
					const cg = new Builder();
					return assertEqualBins(
						new IR.RecordNew(new Map(), new TYPE.Record()).codegen(cg),
						cg.newValue(cg.codegenRecord()),
					);
				});
				test.test('nonempty RECORD.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						val mut x: int = 42;
						(a= x, b= 4.2, c= (null,), d= x/2, e= @e);
					}`);
					const mod = cg.module;
					return assertEqualBins(
						(stmts[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
						cg.newValue(cg.codegenRecord(new Map([
							[257n, cg.newProperty(257n, mod.local.get(0, cg.reftype.Value))],
							[258n, cg.newProperty(258n, genConst(cg, 4.2))],
							[259n, cg.newProperty(259n, mod.local.get(1, cg.reftype.Value))],
							[260n, cg.newProperty(260n, mod.local.get(2, cg.reftype.Value))], // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
							[261n, cg.newProperty(261n, genConst(cg, Symbol(0x105)))],
						]))),
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
						stmts.slice(9).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
						[new Map([
							// (a= 42, aa= false, b= 4.2);  % (258, 261, 256)
							[258n, cg.newProperty(258n, genConst(cg, 42n))],
							[261n, cg.newProperty(261n, genConst(cg, false))],
							[256n, cg.newProperty(256n, genConst(cg, 4.2))],
						]), new Map([
							// (aa= true, c= null, a= 42);  % (261, 257, 258)
							[261n, cg.newProperty(261n, genConst(cg, true))],
							[257n, cg.newProperty(257n, genConst(cg))],
							[258n, cg.newProperty(258n, genConst(cg, 42n))],
						]), new Map([
							// (b= 42, bb= 4.2, bbb= null); % (256, 259, 262)
							[256n, cg.newProperty(256n, genConst(cg, 42n))],
							[259n, cg.newProperty(259n, genConst(cg, 4.2))],
							[262n, cg.newProperty(262n, genConst(cg))],
						])].map((props) => cg.newValue(cg.codegenRecord(props))),
					);
				});
			});

			test.suite('DictNew', () => {
				test.test('empty DICT.NEW', () => {
					// there exists no syntax for empty Dicts, so constructing it manually
					const cg = new Builder();
					return assertEqualBins(
						new IR.DictNew(new Map(), new TYPE.Dict(TYPE.INT)).codegen(cg),
						cg.newValue(cg.codegenDict()),
					);
				});
				test.test('nonempty DICT.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						val mut x: int = 42;
						[a= x, b= 4.2, c= (null,), d= x/2, e= @e];
					}`);
					const mod = cg.module;
					return assertEqualBins(
						(stmts[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg),
						cg.newValue(cg.codegenDict(new Map([
							[257n, cg.newProperty(257n, mod.local.get(0, cg.reftype.Value))],
							[258n, cg.newProperty(258n, genConst(cg, 4.2))],
							[259n, cg.newProperty(259n, mod.local.get(1, cg.reftype.Value))],
							[260n, cg.newProperty(260n, mod.local.get(2, cg.reftype.Value))],
							[261n, cg.newProperty(261n, genConst(cg, Symbol(0x105)))],
						]))),
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
						stmts.slice(9).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
						[new Map([
							// [a= 42, aa= false, b= 4.2]; % (258, 261, 256)
							[258n, cg.newProperty(258n, genConst(cg, 42n))],
							[261n, cg.newProperty(261n, genConst(cg, false))],
							[256n, cg.newProperty(256n, genConst(cg, 4.2))],
						]), new Map([
							// [aa= true, c= null, a= 42]; % (261, 257, 258)
							[261n, cg.newProperty(261n, genConst(cg, true))],
							[257n, cg.newProperty(257n, genConst(cg))],
							[258n, cg.newProperty(258n, genConst(cg, 42n))],
						]), new Map([
							// [b= 42, c= 4.2, aaa= null]; % (256, 257, 264)
							[256n, cg.newProperty(256n, genConst(cg, 42n))],
							[257n, cg.newProperty(257n, genConst(cg, 4.2))],
							[264n, cg.newProperty(264n, genConst(cg))],
						])].map((props) => cg.newValue(cg.codegenDict(props))),
					);
				});
			});

			test.suite('MapNew', () => {
				test.test('empty MAP.NEW', () => {
					// there exists no syntax for empty Maps, so constructing it manually
					const cg = new Builder();
					return assert.strictEqual(
						binaryen.emitText(new IR.MapNew(new Map(), new TYPE.Map(TYPE.INT, TYPE.FLOAT)).codegen(cg)),
						binaryen.emitText(cg.newValue(cg.codegenMap())).replaceAll('$1', '$0'),
					);
				});
				test.test('nonempty MAP.NEW', () => {
					const {stmts, opt, cg} = setupScript(`{
						val mut x: int = 42;
						{1.1 -> x, 2.2 -> 4.2, 3.3 -> (null,), 4.4 -> x/2, 5.5 -> @e};
					}`);
					const mod = cg.module;
					return assert.strictEqual(
						binaryen.emitText((stmts[1] as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
						binaryen.emitText(cg.newValue(cg.codegenMap(new Map([
							[genConst(cg, 1.1), mod.local.get(0, cg.reftype.Value)],
							[genConst(cg, 2.2), genConst(cg, 4.2)],
							[genConst(cg, 3.3), mod.local.get(1, cg.reftype.Value)],
							[genConst(cg, 4.4), mod.local.get(2, cg.reftype.Value)], // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
							[genConst(cg, 5.5), genConst(cg, Symbol(0x101))],
						])))).replaceAll('$4', '$3'),
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
				const {mod, Value} = cg.vm;
				return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
					mod.drop(mod.array.get(
						Value.cast(mod.local.get(2, cg.reftype.Value), cg.reftype.Tuple),
						mod.i32.const(2),
						cg.reftype.Value,
					)),
					mod.drop(mod.array.get(
						Value.cast(mod.local.get(1, cg.reftype.Value), cg.reftype.Tuple),
						mod.i32.const(0),
						cg.reftype.Value,
					)),
					mod.drop(mod.array.get(
						Value.cast(mod.local.get(1, cg.reftype.Value), cg.reftype.Tuple),
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
				const {mod, Value} = cg.vm;
				return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
					mod.drop(mod.call('Record.get', [
						Value.cast(mod.local.get(2, cg.reftype.Value), cg.reftype.Record),
						bigint_to_i64(mod, 0x103n, true),
					], cg.reftype.Value)),
					mod.drop(mod.call('Record.get', [
						Value.cast(mod.local.get(1, cg.reftype.Value), cg.reftype.Record),
						bigint_to_i64(mod, 0x101n, true),
					], cg.reftype.Value)),
					mod.drop(mod.call('Record.get', [
						Value.cast(mod.local.get(1, cg.reftype.Value), cg.reftype.Record),
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
					const {mod, Vect, Value} = cg.vm;
					const list_get:   binaryen.ExpressionRef = mod.local.get(1, cg.reftype.Value);
					const item_0_get: binaryen.ExpressionRef = mod.local.get(4, cg.reftypeNull.Value);
					const item_1_get: binaryen.ExpressionRef = mod.local.get(5, cg.reftypeNull.Value);
					const item_2_get: binaryen.ExpressionRef = mod.local.get(6, cg.reftypeNull.Value);
					const item_3_get: binaryen.ExpressionRef = mod.local.get(7, cg.reftypeNull.Value);
					return assertEqualBins(opt.instructions.slice(4).map((instr) => instr.codegen(cg)), [
						mod.drop(mod.block(null, [
							mod.local.set(4, mod.array.get(
								cg.structGet.list.internal(Value.cast(mod.local.get(2, cg.reftype.Value), cg.reftype.List)),
								mod.i32.wrap(Vect.asInt(Value.field(mod.local.get(3, cg.reftype.Value)).primitive)),
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
								cg.structGet.list.internal(Value.cast(list_get, cg.reftype.List)),
								mod.i32.wrap(Vect.asInt(Value.field(genConst(cg, 0n)).primitive)),
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
								cg.structGet.list.internal(Value.cast(list_get, cg.reftype.List)),
								mod.i32.wrap(Vect.asInt(Value.field(genConst(cg, 3n)).primitive)),
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
								cg.structGet.list.internal(Value.cast(list_get, cg.reftype.List)),
								mod.i32.wrap(Vect.asInt(Value.field(genConst(cg, -1n)).primitive)),
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
					const {mod, Vect, Value, Property} = cg.vm;
					return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
						mod.drop(mod.block(null, [
							mod.local.set(3, mod.tuple.extract(mod.call('Dict.find', [
								Value.cast(mod.local.get(2, cg.reftype.Value), cg.reftype.Dict),
								Vect.asNat(Value.field(genConst(cg, Symbol(0x104))).primitive),
							], binaryen.createType([binaryen.i32, cg.reftypeNull.Property])), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(mod.local.get(3, cg.reftypeNull.Property)),
									Property.isTombstone(mod.local.get(3, cg.reftypeNull.Property)),
								),
								genConst(cg),
								Property.field(mod.local.get(3, cg.reftypeNull.Property)).val,
							),
						], cg.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(4, mod.tuple.extract(mod.call('Dict.find', [
								Value.cast(mod.local.get(1, cg.reftype.Value), cg.reftype.Dict),
								Vect.asNat(Value.field(genConst(cg, Symbol(0x101))).primitive),
							], binaryen.createType([binaryen.i32, cg.reftypeNull.Property])), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(mod.local.get(4, cg.reftypeNull.Property)),
									Property.isTombstone(mod.local.get(4, cg.reftypeNull.Property)),
								),
								genConst(cg),
								Property.field(mod.local.get(4, cg.reftypeNull.Property)).val,
							),
						], cg.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(5, mod.tuple.extract(mod.call('Dict.find', [
								Value.cast(mod.local.get(1, cg.reftype.Value), cg.reftype.Dict),
								Vect.asNat(Value.field(genConst(cg, Symbol(0x102))).primitive),
							], binaryen.createType([binaryen.i32, cg.reftypeNull.Property])), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(mod.local.get(5, cg.reftypeNull.Property)),
									Property.isTombstone(mod.local.get(5, cg.reftypeNull.Property)),
								),
								genConst(cg),
								Property.field(mod.local.get(5, cg.reftypeNull.Property)).val,
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
					const {mod, Value} = cg.vm;
					const base:         binaryen.ExpressionRef = mod.local.get(1, cg.reftype.Value); // index 0 = nonempty map setup (implementation of Set)
					const maybe_case_0: binaryen.ExpressionRef = mod.local.get(2, cg.reftypeNull.Case);
					const maybe_case_1: binaryen.ExpressionRef = mod.local.get(3, cg.reftypeNull.Case);
					return assertEqualBins(opt.instructions.slice(1).map((instr) => instr.codegen(cg)), [
						mod.drop(mod.block(null, [
							mod.local.set(2, mod.tuple.extract(mod.call('Map.find', [
								Value.cast(base, cg.reftype.Map),
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
								Value.cast(base, cg.reftype.Map),
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
					const {mod, Value, Case} = cg.vm;
					const base:         binaryen.ExpressionRef = mod.local.get(1, cg.reftype.Value); // index 0 = nonempty map setup
					const maybe_case_0: binaryen.ExpressionRef = mod.local.get(2, cg.reftypeNull.Case);
					const maybe_case_1: binaryen.ExpressionRef = mod.local.get(3, cg.reftypeNull.Case);
					return assertEqualBins(opt.instructions.slice(1).map((instr) => instr.codegen(cg)), [
						mod.drop(mod.block(null, [
							mod.local.set(2, mod.tuple.extract(mod.call('Map.find', [
								Value.cast(base, cg.reftype.Map),
								genConst(cg, 4.2),
							], binaryen.createType([binaryen.i32, cg.reftypeNull.Case])), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(maybe_case_0),
									mod.call('Case.is-tombstone', [maybe_case_0], binaryen.i32),
								),
								genConst(cg),
								Case.field(maybe_case_0).con,
							),
						], cg.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(3, mod.tuple.extract(mod.call('Map.find', [
								Value.cast(base, cg.reftype.Map),
								genConst(cg, 3.3),
							], binaryen.createType([binaryen.i32, cg.reftypeNull.Case])), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(maybe_case_1),
									mod.call('Case.is-tombstone', [maybe_case_1], binaryen.i32),
								),
								genConst(cg),
								Case.field(maybe_case_1).con,
							),
						], cg.reftype.Value)),
					]);
				});
			});

			test.suite('Unop', () => {
				test.test('ISNULL operator returns custom WASM function `$cpl:is-null`.', () => {
					// there exists no syntax for “is null” operator, so constructing it manually
					const cg = new Builder();
					assertEqualBins(
						new IR.Unop(IR.OpCode.ISNULL, new IR.Const(VALUE.NULL), TYPE.BOOL).codegen(cg),
						cg.vm.op.isNull(genConst(cg)),
					);
				});
				test.test('TOBOOL operator returns custom WASM function `$cpl:not` applied twice.', () => {
					// there exists no syntax for “to bool” operator, so constructing it manually
					const cg = new Builder();
					assertEqualBins(
						new IR.Unop(IR.OpCode.TOBOOL, new IR.Const(VALUE.NULL), TYPE.BOOL).codegen(cg),
						cg.vm.op.not(cg.vm.op.not(genConst(cg))),
					);
				});
				test.test('Primitive unary operators return custom WASM functions.', () => {
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
					return assertEqualBins(
						stmts.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
						[
							cg.vm.op.not(genConst(cg)),
							cg.vm.op.not(genConst(cg, false)),
							cg.vm.op.not(genConst(cg, Symbol(0x100))),
							cg.vm.op.not(genConst(cg, 42n)),
							cg.vm.op.not(genConst(cg, 4.2)),

							cg.vm.op.isEmpty(genConst(cg)),
							cg.vm.op.isEmpty(genConst(cg, false)),
							cg.vm.op.isEmpty(genConst(cg, Symbol(0x100))),
							cg.vm.op.isEmpty(genConst(cg, 42n)),
							cg.vm.op.isEmpty(genConst(cg, 4.2)),

							cg.vm.op.negate(genConst(cg, 42n)),
							cg.vm.op.negate(genConst(cg, 4.2)),

							cg.vm.op.toInt(genConst(cg, 42n, 'nat')),
							cg.vm.op.toInt(genConst(cg, 4.2)),
							cg.vm.op.toNat(genConst(cg, 42n)),
							cg.vm.op.toNat(genConst(cg, 4.2)),
							cg.vm.op.toFloat(genConst(cg, 42n, 'nat')),
							cg.vm.op.toFloat(genConst(cg, 42n)),
						],
					);
				});
				test.test('LIST.COUNT', () => {
					const {stmts, opt, cg} = setupScript(`{
						val mut x: int = 42;
						val list: [int] = [x, 43, 44];
						list;
					}`);
					// there exists no syntax for List count, so constructing it manually
					const list = (stmts[2] as AST.ASTNodeStatementExpression).expr!.lower(opt) as IR.Get;
					const unop = new IR.Unop(
						IR.OpCode.LIST_COUNT,
						list,
						TYPE.NAT,
					);
					return assertEqualBins(
						unop.codegen(cg),
						cg.newValue(cg.newVect(
							cg.module.i64.extend_u(cg.module.call('List.count', [list.codegen(cg)], binaryen.i32)),
							{unsigned: true},
						)),
					);
				});
				test.test('DICT.COUNT', () => {
					const {stmts, opt, cg} = setupScript(`{
						val mut x: int = 42;
						val dict: [:int] = [a= x, b= 43, c= 44];
						dict;
					}`);
					// there exists no syntax for Dict count, so constructing it manually
					const dict = (stmts[2] as AST.ASTNodeStatementExpression).expr!.lower(opt) as IR.Get;
					const unop = new IR.Unop(
						IR.OpCode.DICT_COUNT,
						dict,
						TYPE.NAT,
					);
					return assertEqualBins(
						unop.codegen(cg),
						cg.newValue(cg.newVect(
							cg.module.i64.extend_u(cg.module.call('Dict.count', [dict.codegen(cg)], binaryen.i32)),
							{unsigned: true},
						)),
					);
				});
				test.test('SET.COUNT', () => {
					const {stmts, opt, cg} = setupScript(`{
						val mut x: int = 42;
						val 'set': {int} = {x, 43, 44};
						'set';
					}`);
					// there exists no syntax for Set count, so constructing it manually
					const set = (stmts[2] as AST.ASTNodeStatementExpression).expr!.lower(opt) as IR.Get;
					const unop = new IR.Unop(
						IR.OpCode.SET_COUNT,
						set,
						TYPE.NAT,
					);
					return assertEqualBins(
						unop.codegen(cg),
						cg.newValue(cg.newVect(
							cg.module.i64.extend_u(cg.module.call('Map.count', [set.codegen(cg)], binaryen.i32)),
							{unsigned: true},
						)),
					);
				});
				test.test('MAP.COUNT', () => {
					const {stmts, opt, cg} = setupScript(`{
						val mut x: int = 42;
						val map: {float -> int} = {1.1 -> x, 2.2 -> 43, 3.3 -> 44};
						map;
					}`);
					// there exists no syntax for Map count, so constructing it manually
					const map = (stmts[2] as AST.ASTNodeStatementExpression).expr!.lower(opt) as IR.Get;
					const unop = new IR.Unop(
						IR.OpCode.MAP_COUNT,
						map,
						TYPE.NAT,
					);
					return assertEqualBins(
						unop.codegen(cg),
						cg.newValue(cg.newVect(
							cg.module.i64.extend_u(cg.module.call('Map.count', [map.codegen(cg)], binaryen.i32)),
							{unsigned: true},
						)),
					);
				});
			});

			test.test('Binop returns custom WASM functions.', () => {
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
					veq: (arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('veq',     [arg0, arg1], cg.reftype.Value),
				} as const;
				return assertEqualBins(
					stmts.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.lower(opt).codegen(cg)),
					[
						cg.vm.op.intAdd(genConst(cg, 2n), genConst(cg, 3n)),
						cg.vm.op.intSub(genConst(cg, 2n), genConst(cg, 3n)),
						cg.vm.op.intMul(genConst(cg, 2n), genConst(cg, 3n)),
						cg.vm.op.intDiv(genConst(cg, 2n), genConst(cg, 3n)),
						cg.vm.op.intExp(genConst(cg, 2n), genConst(cg, 3n)),

						cg.vm.op.natAdd(genConst(cg, 2n, 'nat'), genConst(cg, 3n, 'nat')),
						cg.vm.op.natSub(genConst(cg, 2n, 'nat'), genConst(cg, 3n, 'nat')),
						cg.vm.op.natMul(genConst(cg, 2n, 'nat'), genConst(cg, 3n, 'nat')),
						cg.vm.op.natDiv(genConst(cg, 2n, 'nat'), genConst(cg, 3n, 'nat')),
						cg.vm.op.natExp(genConst(cg, 2n, 'nat'), genConst(cg, 3n, 'nat')),

						cg.vm.op.floatAdd(genConst(cg, 2.0), genConst(cg, 3.0)),
						cg.vm.op.floatSub(genConst(cg, 2.0), genConst(cg, 3.0)),
						cg.vm.op.floatMul(genConst(cg, 2.0), genConst(cg, 3.0)),
						cg.vm.op.floatDiv(genConst(cg, 2.0), genConst(cg, 3.0)),
						cg.vm.op.floatExp(genConst(cg, 2.0), genConst(cg, 3.0)),

						cg.vm.op.lt(genConst(cg, 2n), genConst(cg, 3.0)),
						cg.vm.op.gt(genConst(cg, 2n), genConst(cg, 3.0)),
						cg.vm.op.le(genConst(cg, 2n), genConst(cg, 3.0)),
						cg.vm.op.ge(genConst(cg, 2n), genConst(cg, 3.0)),

						cg.vm.op.id(genConst(cg, 2.0), genConst(cg, 3n)),
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
					const {mod, Vect, Value} = cg.vm;
					return assertEqualBins(opt.instructions.slice(4).map((instr) => instr.codegen(cg)), [
						mod.call('List.set', [
							Value.cast(mod.local.get(2, cg.reftype.Value), cg.reftype.List),
							mod.i32.wrap(Vect.asInt(Value.field(mod.local.get(3, cg.reftype.Value)).primitive)),
							genConst(cg, 45n),
						], binaryen.none),
						mod.call('List.set', [
							Value.cast(mod.local.get(1, cg.reftype.Value), cg.reftype.List),
							mod.i32.wrap(Vect.asInt(Value.field(genConst(cg, 0n)).primitive)),
							genConst(cg, 46n),
						], binaryen.none),
						mod.call('List.set', [
							Value.cast(mod.local.get(1, cg.reftype.Value), cg.reftype.List),
							mod.i32.wrap(Vect.asInt(Value.field(genConst(cg, 2n)).primitive)),
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
					const {mod, Vect, Value} = cg.vm;
					return assertEqualBins(opt.instructions.slice(3).map((instr) => instr.codegen(cg)), [
						mod.call('Dict.set', [
							Value.cast(mod.local.get(2, cg.reftype.Value), cg.reftype.Dict),
							Vect.asNat(Value.field(genConst(cg, Symbol(0x104))).primitive),
							genConst(cg, 45n),
						], binaryen.none),
						mod.call('Dict.set', [
							Value.cast(mod.local.get(1, cg.reftype.Value), cg.reftype.Dict),
							Vect.asNat(Value.field(genConst(cg, Symbol(0x101))).primitive),
							genConst(cg, 46n),
						], binaryen.none),
						mod.call('Dict.set', [
							Value.cast(mod.local.get(1, cg.reftype.Value), cg.reftype.Dict),
							Vect.asNat(Value.field(genConst(cg, Symbol(0x102))).primitive),
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
					const {mod, Vect, Value} = cg.vm;
					const base:           binaryen.ExpressionRef = mod.local.get(1, cg.reftype.Value); // index 0 = nonempty map setup (implementation of Set)
					const base_get_0:     binaryen.ExpressionRef = mod.local.get(2, cg.reftype.Map);
					const accessor_get_0: binaryen.ExpressionRef = mod.local.get(3, cg.reftype.Value);
					const base_get_1:     binaryen.ExpressionRef = mod.local.get(4, cg.reftype.Map);
					const accessor_get_1: binaryen.ExpressionRef = mod.local.get(5, cg.reftype.Value);
					opt.instructions[0].codegen(cg);
					return assertEqualBins(opt.instructions.slice(1).map((instr) => instr.codegen(cg)), [
						mod.block(null, [
							mod.local.set(2, Value.cast(base, cg.reftype.Map)),
							mod.local.set(3, genConst(cg, 4.2)),
							mod.if(
								Vect.isConst(Value.field(genConst(cg, false)).primitive, true),
								mod.call('Map.set', [base_get_0, accessor_get_0, genConst(cg)], binaryen.none),
								mod.drop(mod.call('Map.delete', [base_get_0, accessor_get_0], cg.reftypeNull.Value)),
							),
						]),
						mod.block(null, [
							mod.local.set(4, Value.cast(base, cg.reftype.Map)),
							mod.local.set(5, genConst(cg, 3.3)),
							mod.if(
								Vect.isConst(Value.field(genConst(cg, true)).primitive, true),
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
					const {mod, Value} = cg.vm;
					const base: binaryen.ExpressionRef = mod.local.get(1, cg.reftype.Value); // index 0 = nonempty map setup
					return assertEqualBins(opt.instructions.slice(1).map((instr) => instr.codegen(cg)), [
						mod.call('Map.set', [Value.cast(base, cg.reftype.Map), genConst(cg, 4.2), genConst(cg, 21n)], binaryen.none),
						mod.call('Map.set', [Value.cast(base, cg.reftype.Map), genConst(cg, 3.3), genConst(cg, 21n)], binaryen.none),
					]);
				});
			});

			test.suite('CollectionDynamicCopy', () => {
				test.suite('LIST.COPY', () => {
					test.test('tuple argument.', () => {
						const {opt, cg} = setupScript(`{
							List.<int>((2, 3, 5));
						}`, {codegen: false});
						const {mod, Value} = cg.vm;
						const destlist_get: binaryen.ExpressionRef = mod.local.get(2, cg.reftype.List);
						const srcref_get:   binaryen.ExpressionRef = mod.local.get(3, cg.reftype.Tuple);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, Value.cast(mod.local.get(0, cg.reftype.Value), cg.reftype.List)),
								mod.local.set(3, Value.cast(mod.local.get(1, cg.reftype.Value), cg.reftype.Tuple)),
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
						const {mod, Value} = cg.vm;
						const destlist_get: binaryen.ExpressionRef = mod.local.get(2, cg.reftype.List);
						const srcref_get:   binaryen.ExpressionRef = mod.local.get(3, cg.reftype.ListInternal);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, Value.cast(mod.local.get(0, cg.reftype.Value), cg.reftype.List)),
								mod.local.set(3, cg.structGet.list.internal(Value.cast(mod.local.get(1, cg.reftype.Value), cg.reftype.List))),
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
						const {mod, Value, Case} = cg.vm;
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
									mod.local.set(3, Value.cast(mod.local.get(0, cg.reftype.Value), cg.reftype.List)),
									mod.local.set(4, cg.structGet.map.internal(Value.cast(mod.local.get(2, cg.reftype.Value), cg.reftype.Map))), // index 1 = nonempty map setup (implementation of Set)
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
														Case.field(case_get).ant,
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
						const {mod, Vect, Value} = cg.vm;
						const pairs_get: binaryen.ExpressionRef = mod.local.get(6, cg.reftype.Tuple);
						const i_get:     binaryen.ExpressionRef = mod.local.get(7, binaryen.i32);
						opt.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(5, Value.cast(mod.local.get(0, cg.reftype.Value), cg.reftype.Dict)),
								mod.local.set(6, Value.cast(mod.local.get(4, cg.reftype.Value), cg.reftype.Tuple)),
								mod.block('exit-0', [
									mod.local.set(7, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(pairs_get))),
										mod.local.set(8, mod.array.get(pairs_get, i_get, cg.reftype.Value)),
										mod.call('Dict.set', [
											mod.local.get(5, cg.reftype.Dict),
											Vect.asNat(Value.field(mod.array.get(
												mod.local.tee(9, Value.cast(mod.local.get(8, cg.reftype.Value), cg.reftype.Tuple), cg.reftype.Tuple),
												mod.i32.const(0),
												cg.reftype.Value,
											)).primitive),
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
						const {mod, Value} = cg.vm;
						const destdict_get: binaryen.ExpressionRef = mod.local.get(2, cg.reftype.Dict);
						const srcref_get:   binaryen.ExpressionRef = mod.local.get(3, cg.reftype.Record);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, Value.cast(mod.local.get(0, cg.reftype.Value), cg.reftype.Dict)),
								mod.local.set(3, Value.cast(mod.local.get(1, cg.reftype.Value), cg.reftype.Record)),
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
						const {mod, Vect, Value} = cg.vm;
						const pairs_get: binaryen.ExpressionRef = mod.local.get(6, cg.reftype.ListInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(7, binaryen.i32);
						const item_get:  binaryen.ExpressionRef = mod.local.get(8, cg.reftypeNull.Value);
						opt.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(5, Value.cast(mod.local.get(0, cg.reftype.Value), cg.reftype.Dict)),
								mod.local.set(6, cg.structGet.list.internal(Value.cast(mod.local.get(4, cg.reftype.Value), cg.reftype.List))),
								mod.block('exit-0', [
									mod.local.set(7, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(pairs_get))),
										mod.local.set(8, mod.array.get(pairs_get, i_get, cg.reftypeNull.Value)),
										mod.if(
											mod.i32.eqz(mod.ref.is_null(item_get)),
											mod.call('Dict.set', [
												mod.local.get(5, cg.reftype.Dict),
												Vect.asNat(Value.field(mod.array.get(
													mod.local.tee(9, Value.cast(item_get, cg.reftype.Tuple), cg.reftype.Tuple),
													mod.i32.const(0),
													cg.reftype.Value,
												)).primitive),
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
						const {mod, Value} = cg.vm;
						const destdict_get: binaryen.ExpressionRef = mod.local.get(2, cg.reftype.Dict);
						const srcref_get:   binaryen.ExpressionRef = mod.local.get(3, cg.reftype.DictInternal);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, Value.cast(mod.local.get(0, cg.reftype.Value), cg.reftype.Dict)),
								mod.local.set(3, cg.structGet.dict.internal(Value.cast(mod.local.get(1, cg.reftype.Value), cg.reftype.Dict))),
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
						const {mod, Vect, Value, Case} = cg.vm;
						const cases_get: binaryen.ExpressionRef = mod.local.get(7, cg.reftype.MapInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(8, binaryen.i32);
						const case_get:  binaryen.ExpressionRef = mod.local.get(9, cg.reftypeNull.Case);
						opt.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(6, Value.cast(mod.local.get(0, cg.reftype.Value), cg.reftype.Dict)),
								mod.local.set(7, cg.structGet.map.internal(Value.cast(mod.local.get(5, cg.reftype.Value), cg.reftype.Map))), // index 4 = nonempty map setup (implementation of Set)
								mod.block('exit-0', [
									mod.local.set(8, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(cases_get))),
										mod.local.set(9, mod.array.get(cases_get, i_get, cg.reftypeNull.Case)),
										mod.if(
											mod.i32.eqz(mod.ref.is_null(case_get)),
											mod.call('Dict.set', [
												mod.local.get(6, cg.reftype.Dict),
												Vect.asNat(Value.field(mod.array.get(
													mod.local.tee(10, Value.cast(Case.field(case_get).ant, cg.reftype.Tuple), cg.reftype.Tuple),
													mod.i32.const(0),
													cg.reftype.Value,
												)).primitive),
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
						const {mod, Vect, Value, Case} = cg.vm;
						const cases_get: binaryen.ExpressionRef = mod.local.get(4, cg.reftype.MapInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(5, binaryen.i32);
						const case_get:  binaryen.ExpressionRef = mod.local.get(6, cg.reftypeNull.Case);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(3, Value.cast(mod.local.get(0, cg.reftype.Value), cg.reftype.Dict)),
								mod.local.set(4, cg.structGet.map.internal(Value.cast(mod.local.get(2, cg.reftype.Value), cg.reftype.Map))), // index 1 = nonempty map setup
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
													Vect.asNat(Value.field(Case.field(case_get).ant).primitive),
													Case.field(case_get).con,
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
						const {mod, Value} = cg.vm;
						const items_get: binaryen.ExpressionRef = mod.local.get(3, cg.reftype.Tuple);
						const i_get:     binaryen.ExpressionRef = mod.local.get(4, binaryen.i32);
						const item_get:  binaryen.ExpressionRef = mod.local.get(5, cg.reftype.Value);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, Value.cast(mod.local.get(0, cg.reftype.Value), cg.reftype.Map)),
								mod.local.set(3, Value.cast(mod.local.get(1, cg.reftype.Value), cg.reftype.Tuple)),
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
						const {mod, Value} = cg.vm;
						const items_get: binaryen.ExpressionRef = mod.local.get(3, cg.reftype.ListInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(4, binaryen.i32);
						const item_get:  binaryen.ExpressionRef = mod.local.get(5, cg.reftype.Value);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, Value.cast(mod.local.get(0, cg.reftype.Value), cg.reftype.Map)),
								mod.local.set(3, cg.structGet.list.internal(Value.cast(mod.local.get(1, cg.reftype.Value), cg.reftype.List))),
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
						const {mod, Value} = cg.vm;
						const destset_get: binaryen.ExpressionRef = mod.local.get(3, cg.reftype.Map);
						const srcref_get:  binaryen.ExpressionRef = mod.local.get(4, cg.reftype.MapInternal);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(3, Value.cast(mod.local.get(0, cg.reftype.Value), cg.reftype.Map)),
								mod.local.set(4, cg.structGet.map.internal(Value.cast(mod.local.get(2, cg.reftype.Value), cg.reftype.Map))), // index 1 = nonempty map setup (implementation of Set)
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
						const {mod, Value} = cg.vm;
						const pairs_get: binaryen.ExpressionRef = mod.local.get(6, cg.reftype.Tuple);
						const i_get:     binaryen.ExpressionRef = mod.local.get(7, binaryen.i32);
						opt.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(5, Value.cast(mod.local.get(0, cg.reftype.Value), cg.reftype.Map)),
								mod.local.set(6, Value.cast(mod.local.get(4, cg.reftype.Value), cg.reftype.Tuple)),
								mod.block('exit-0', [
									mod.local.set(7, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(pairs_get))),
										mod.local.set(8, mod.array.get(pairs_get, i_get, cg.reftype.Value)),
										mod.call('Map.set', [
											mod.local.get(5, cg.reftype.Map),
											mod.array.get(mod.local.tee(9, Value.cast(mod.local.get(8, cg.reftype.Value), cg.reftype.Tuple), cg.reftype.Tuple), mod.i32.const(0), cg.reftype.Value),
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
						const {mod, Value} = cg.vm;
						const pairs_get: binaryen.ExpressionRef = mod.local.get(6, cg.reftype.ListInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(7, binaryen.i32);
						const item_get:  binaryen.ExpressionRef = mod.local.get(8, cg.reftypeNull.Value);
						opt.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(5, Value.cast(mod.local.get(0, cg.reftype.Value), cg.reftype.Map)),
								mod.local.set(6, cg.structGet.list.internal(Value.cast(mod.local.get(4, cg.reftype.Value), cg.reftype.List))),
								mod.block('exit-0', [
									mod.local.set(7, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(pairs_get))),
										mod.local.set(8, mod.array.get(pairs_get, i_get, cg.reftypeNull.Value)),
										mod.if(
											mod.i32.eqz(mod.ref.is_null(item_get)),
											mod.call('Map.set', [
												mod.local.get(5, cg.reftype.Map),
												mod.array.get(mod.local.tee(9, Value.cast(item_get, cg.reftype.Tuple), cg.reftype.Tuple), mod.i32.const(0), cg.reftype.Value),
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
						const {mod, Value, Case} = cg.vm;
						const cases_get: binaryen.ExpressionRef = mod.local.get(7, cg.reftype.MapInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(8, binaryen.i32);
						const case_get:  binaryen.ExpressionRef = mod.local.get(9, cg.reftypeNull.Case);
						opt.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(6, Value.cast(mod.local.get(0, cg.reftype.Value), cg.reftype.Map)),
								mod.local.set(7, cg.structGet.map.internal(Value.cast(mod.local.get(5, cg.reftype.Value), cg.reftype.Map))), // index 4 = nonempty map setup (implementation of Set)
								mod.block('exit-0', [
									mod.local.set(8, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(cases_get))),
										mod.local.set(9, mod.array.get(cases_get, i_get, cg.reftypeNull.Case)),
										mod.if(
											mod.i32.eqz(mod.ref.is_null(case_get)),
											mod.call('Map.set', [
												mod.local.get(6, cg.reftype.Map),
												mod.array.get(mod.local.tee(10, Value.cast(Case.field(case_get).ant, cg.reftype.Tuple), cg.reftype.Tuple), mod.i32.const(0), cg.reftype.Value),
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
						const {mod, Value} = cg.vm;
						const destmap_get: binaryen.ExpressionRef = mod.local.get(3, cg.reftype.Map);
						const srcref_get:  binaryen.ExpressionRef = mod.local.get(4, cg.reftype.MapInternal);
						opt.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							opt.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(3, Value.cast(mod.local.get(0, cg.reftype.Value), cg.reftype.Map)),
								mod.local.set(4, cg.structGet.map.internal(Value.cast(mod.local.get(2, cg.reftype.Value), cg.reftype.Map))), // index 1 = nonempty map setup (implementation of Set)
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

import * as assert from 'node:assert';
import * as test from 'node:test';
import * as binaryen from 'binaryen.ts';
import {
	type AST,
	VALUE,
	TYPE,
	Builder,
	OP,
	CodeGenerator,
} from '../../src/index.ts';
import {
	assertEqualBins,
	genConst,
	setupScript,
} from '../utils.ts';



test.suite('Opcode', () => {
	test.suite('Value', () => {
		test.suite('#codegen', () => {
			test.test('Trap returns (unreachable).', () => {
				const cg = new CodeGenerator();
				return assertEqualBins(new OP.Trap().codegen(cg), cg.mod.wasm.unreachable());
			});

			test.test('Const returns (struct.new $Value).', () => {
				const {stmts, builder, cg} = setupScript(`{
					null;
					false;
					@hello;
					42;
					4.2;
					"hello";
				}`, {codegen: false});
				return assertEqualBins(
					stmts.map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg)),
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
				const {stmts, builder, cg, wasm} = setupScript(`{
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
				return assertEqualBins(
					stmts.slice(5).map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg)),
					[
						wasm.local.get(0, cg.vm.reftype.Value),
						wasm.local.get(1, cg.vm.reftype.Value),
						wasm.local.get(2, cg.vm.reftype.Value),
						wasm.local.get(3, cg.vm.reftype.Value),
						wasm.local.get(4, cg.vm.reftype.Value),
					],
				);
			});

			test.test('Template returns (block) containing static repetition of (array.copy).', () => {
				const {builder, cg, wasm} = setupScript(`{
					val user: (name: str) = (name= "Alan");
					"""Hello, {{ user.name }}, you have {{ 2 * 3 }} new messages.""";
				}`);
				const {Value} = cg.vm;

				const strings = [
					genConst(cg, 'Hello, '),
					wasm.local.get(1, cg.vm.reftype.Value),
					genConst(cg, ', you have '),
					wasm.local.get(2, cg.vm.reftype.Value),
					genConst(cg, ' new messages.'),
				].map((code) => Value.stringify(code));

				const OFFSET_IDX = 9;

				const string_0_get: binaryen.ExpressionRef = wasm.local.get(3, cg.vm.reftype.String);
				const string_1_get: binaryen.ExpressionRef = wasm.local.get(4, cg.vm.reftype.String);
				const string_2_get: binaryen.ExpressionRef = wasm.local.get(5, cg.vm.reftype.String);
				const string_3_get: binaryen.ExpressionRef = wasm.local.get(6, cg.vm.reftype.String);
				const string_4_get: binaryen.ExpressionRef = wasm.local.get(7, cg.vm.reftype.String);

				const string_0_len: binaryen.ExpressionRef = wasm.array.len(string_0_get);
				const string_1_len: binaryen.ExpressionRef = wasm.array.len(string_1_get);
				const string_2_len: binaryen.ExpressionRef = wasm.array.len(string_2_get);
				const string_3_len: binaryen.ExpressionRef = wasm.array.len(string_3_get);
				const string_4_len: binaryen.ExpressionRef = wasm.array.len(string_4_get);

				const result_get: binaryen.ExpressionRef = wasm.local.get(8, cg.vm.reftype.String);
				const offset_get: binaryen.ExpressionRef = wasm.local.get(OFFSET_IDX, binaryen.i32);
				return assertEqualBins(
					builder.instructions[3].codegen(cg),
					wasm.drop(Value.newComposite(wasm.block(null, [
						wasm.local.set(3, strings[0]),
						wasm.local.set(4, strings[1]),
						wasm.local.set(5, strings[2]),
						wasm.local.set(6, strings[3]),
						wasm.local.set(7, strings[4]),
						wasm.local.set(8, wasm.array.new_default(
							cg.vm.heaptype.String,
							wasm.i32.add(
								wasm.i32.add(
									wasm.i32.add(
										wasm.i32.add(
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
						wasm.local.set(OFFSET_IDX, wasm.i32.const(0)),
						...[
							[string_0_get, string_0_len],
							[string_1_get, string_1_len],
							[string_2_get, string_2_len],
							[string_3_get, string_3_len],
						].flatMap(([str_get, str_len]) => [
							wasm.array.copy(result_get, offset_get, str_get, wasm.i32.const(0), str_len),
							wasm.local.set(OFFSET_IDX, wasm.i32.add(offset_get, str_len)),
						]),
						wasm.array.copy(result_get, offset_get, string_4_get, wasm.i32.const(0), string_4_len),
						result_get,
					], cg.vm.reftype.String))),
				);
			});

			test.suite('CollectionLinearNew', () => {
				test.test('empty TUPLE.NEW', () => {
					const {stmts, builder, cg} = setupScript(`{
						();
					}`);
					return assertEqualBins(
						(stmts[0] as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg),
						cg.vm.Value.newComposite(cg.codegenTuple()),
					);
				});
				test.test('nonempty TUPLE.NEW', () => {
					const {stmts, builder, cg, wasm} = setupScript(`{
						val mut x: int = 42;
						(x, 4.2, (null,));
					}`);
					const {Value} = cg.vm;
					return assertEqualBins(
						(stmts[1] as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg),
						Value.newComposite(cg.codegenTuple([
							wasm.local.get(0, cg.vm.reftype.Value),
							genConst(cg, 4.2),
							wasm.local.get(1, cg.vm.reftype.Value),
						])),
					);
				});
				test.test('empty LIST.NEW', () => {
					const {stmts, builder, cg} = setupScript(`{
						[];
					}`);
					return assertEqualBins(
						(stmts[0] as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg),
						cg.vm.Value.newComposite(cg.codegenList()),
					);
				});
				test.test('nonempty LIST.NEW', () => {
					const {stmts, builder, cg, wasm} = setupScript(`{
						val mut x: int = 42;
						[x, 4.2, (null,), x/2, @e];
					}`);
					const {Value} = cg.vm;
					return assertEqualBins(
						(stmts[1] as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg),
						Value.newComposite(cg.codegenList([
							wasm.local.get(0, cg.vm.reftypeNull.Value),
							genConst(cg, 4.2),
							wasm.local.get(1, cg.vm.reftypeNull.Value),
							wasm.local.get(2, cg.vm.reftypeNull.Value),
							genConst(cg, Symbol(0x101)),
						])),
					);
				});
				test.test('empty SET.NEW', () => {
					const {stmts, builder, cg} = setupScript(`{
						{};
					}`);
					return assert.strictEqual(
						binaryen.emitText((stmts[0] as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg)),
						binaryen.emitText(cg.vm.Value.newComposite(cg.codegenMap())).replaceAll('$1', '$0'),
					);
				});
				test.test('nonempty SET.NEW', () => {
					const {stmts, builder, cg, wasm} = setupScript(`{
						val mut x: int = 42;
						{x, 4.2, (null,), x/2, @e};
					}`);
					const {Value} = cg.vm;
					return assert.strictEqual(
						binaryen.emitText((stmts[1] as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg)),
						binaryen.emitText(Value.newComposite(cg.codegenSet([
							wasm.local.get(0, cg.vm.reftype.Value),
							genConst(cg, 4.2),
							wasm.local.get(1, cg.vm.reftype.Value),
							wasm.local.get(2, cg.vm.reftype.Value), // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
							genConst(cg, Symbol(0x101)),
						]))).replaceAll('$4', '$3'),
					);
				});
			});

			test.suite('RecordNew', () => {
				test.test('empty RECORD.NEW', () => {
					// there exists no syntax for empty records, so constructing it manually
					const cg = new CodeGenerator();
					return assertEqualBins(
						new OP.RecordNew(new Map(), new TYPE.Record()).codegen(cg),
						cg.vm.Value.newComposite(cg.codegenRecord()),
					);
				});
				test.test('nonempty RECORD.NEW', () => {
					const {stmts, builder, cg, wasm} = setupScript(`{
						val mut x: int = 42;
						(a= x, b= 4.2, c= (null,), d= x/2, e= @e);
					}`);
					const {Value} = cg.vm;
					return assertEqualBins(
						(stmts[1] as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg),
						Value.newComposite(cg.codegenRecord(new Map([
							[257n, cg.newProperty(257n, wasm.local.get(0, cg.vm.reftype.Value))],
							[258n, cg.newProperty(258n, genConst(cg, 4.2))],
							[259n, cg.newProperty(259n, wasm.local.get(1, cg.vm.reftype.Value))],
							[260n, cg.newProperty(260n, wasm.local.get(2, cg.vm.reftype.Value))], // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
							[261n, cg.newProperty(261n, genConst(cg, Symbol(0x105)))],
						]))),
					);
				});
				test.test('inserts keys in source order.', () => {
					const {stmts, builder, cg} = setupScript(`{
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
						stmts.slice(9).map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg)),
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
						])].map((props) => cg.vm.Value.newComposite(cg.codegenRecord(props))),
					);
				});
			});

			test.suite('DictNew', () => {
				test.test('empty DICT.NEW', () => {
					// there exists no syntax for empty Dicts, so constructing it manually
					const cg = new CodeGenerator();
					return assertEqualBins(
						new OP.DictNew(new Map(), new TYPE.Dict(TYPE.INT)).codegen(cg),
						cg.vm.Value.newComposite(cg.codegenDict()),
					);
				});
				test.test('nonempty DICT.NEW', () => {
					const {stmts, builder, cg, wasm} = setupScript(`{
						val mut x: int = 42;
						[a= x, b= 4.2, c= (null,), d= x/2, e= @e];
					}`);
					const {Value} = cg.vm;
					return assertEqualBins(
						(stmts[1] as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg),
						Value.newComposite(cg.codegenDict(new Map([
							[257n, cg.newProperty(257n, wasm.local.get(0, cg.vm.reftype.Value))],
							[258n, cg.newProperty(258n, genConst(cg, 4.2))],
							[259n, cg.newProperty(259n, wasm.local.get(1, cg.vm.reftype.Value))],
							[260n, cg.newProperty(260n, wasm.local.get(2, cg.vm.reftype.Value))],
							[261n, cg.newProperty(261n, genConst(cg, Symbol(0x105)))],
						]))),
					);
				});
				test.test('inserts keys in source order.', () => {
					const {stmts, builder, cg} = setupScript(`{
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
						stmts.slice(9).map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg)),
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
						])].map((props) => cg.vm.Value.newComposite(cg.codegenDict(props))),
					);
				});
			});

			test.suite('MapNew', () => {
				test.test('empty MAP.NEW', () => {
					// there exists no syntax for empty Maps, so constructing it manually
					const cg = new CodeGenerator();
					return assert.strictEqual(
						binaryen.emitText(new OP.MapNew(new Map(), new TYPE.Map(TYPE.INT, TYPE.FLOAT)).codegen(cg)),
						binaryen.emitText(cg.vm.Value.newComposite(cg.codegenMap())).replaceAll('$1', '$0'),
					);
				});
				test.test('nonempty MAP.NEW', () => {
					const {stmts, builder, cg, wasm} = setupScript(`{
						val mut x: int = 42;
						{1.1 -> x, 2.2 -> 4.2, 3.3 -> (null,), 4.4 -> x/2, 5.5 -> @e};
					}`);
					const {Value} = cg.vm;
					return assert.strictEqual(
						binaryen.emitText((stmts[1] as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg)),
						binaryen.emitText(Value.newComposite(cg.codegenMap(new Map([
							[genConst(cg, 1.1), wasm.local.get(0, cg.vm.reftype.Value)],
							[genConst(cg, 2.2), genConst(cg, 4.2)],
							[genConst(cg, 3.3), wasm.local.get(1, cg.vm.reftype.Value)],
							[genConst(cg, 4.4), wasm.local.get(2, cg.vm.reftype.Value)], // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
							[genConst(cg, 5.5), genConst(cg, Symbol(0x101))],
						])))).replaceAll('$4', '$3'),
					);
				});
			});

			test.test('TupleGet returns (array.get).', () => {
				const {builder, cg, wasm} = setupScript(`{
					val mut x:   int                = 42;
					val mut tup: (int, int, ?: int) = (42, 43);

					(x, 43, 44).2;
					tup.0;
					tup.1;
				}`);
				const {Value} = cg.vm;
				return assertEqualBins(builder.instructions.slice(3).map((instr) => instr.codegen(cg)), [
					wasm.drop(wasm.array.get(
						Value.cast(wasm.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.Tuple),
						wasm.i32.const(2),
						cg.vm.reftype.Value,
					)),
					wasm.drop(wasm.array.get(
						Value.cast(wasm.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Tuple),
						wasm.i32.const(0),
						cg.vm.reftype.Value,
					)),
					wasm.drop(wasm.array.get(
						Value.cast(wasm.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Tuple),
						wasm.i32.const(1),
						cg.vm.reftype.Value,
					)),
				]);
			});

			test.test('RecordGet returns (call $Record.get).', () => {
				const {builder, cg, wasm} = setupScript(`{
					val mut x:   int                       = 42;
					val mut rec: (a: int, b: int, c?: int) = (a= 42, b= 43);

					(a= x, b= 43, c= 44).c;
					rec.a;
					rec.b;
				}`);
				const {Value, Record: VmRecord} = cg.vm;
				return assertEqualBins(builder.instructions.slice(3).map((instr) => instr.codegen(cg)), [
					wasm.drop(VmRecord.get(
						Value.cast(wasm.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.Record),
						wasm.i64.const(0x103n),
					)),
					wasm.drop(VmRecord.get(
						Value.cast(wasm.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Record),
						wasm.i64.const(0x101n),
					)),
					wasm.drop(VmRecord.get(
						Value.cast(wasm.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Record),
						wasm.i64.const(0x102n),
					)),
				]);
			});

			test.suite('CollectionDynamicGet', () => {
				test.test('LIST.GET', () => {
					const {builder, cg, wasm} = setupScript(`{
						val mut x:    int   = 42;
						val mut list: [int] = [42, 43];

						[x, 43, 44].[1 + 1];
						list.[0];
						list.[3];
						list.[-1];
					}`);
					const {Vect, Value, List} = cg.vm;
					const list_get:   binaryen.ExpressionRef = wasm.local.get(1, cg.vm.reftype.Value);
					const item_0_get: binaryen.ExpressionRef = wasm.local.get(4, cg.vm.reftypeNull.Value);
					const item_1_get: binaryen.ExpressionRef = wasm.local.get(5, cg.vm.reftypeNull.Value);
					const item_2_get: binaryen.ExpressionRef = wasm.local.get(6, cg.vm.reftypeNull.Value);
					const item_3_get: binaryen.ExpressionRef = wasm.local.get(7, cg.vm.reftypeNull.Value);
					return assertEqualBins(builder.instructions.slice(4).map((instr) => instr.codegen(cg)), [
						wasm.drop(wasm.block(null, [
							wasm.local.set(4, wasm.array.get(
								List.field(Value.cast(wasm.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.List)).internal,
								wasm.i32.wrap(Vect.asInt(Value.field(wasm.local.get(3, cg.vm.reftype.Value)).primitive)),
								cg.vm.reftypeNull.Value,
							)),
							wasm.if(
								wasm.ref.is_null(item_0_get),
								genConst(cg),
								wasm.ref.as_non_null(item_0_get),
							),
						], cg.vm.reftype.Value)),
						wasm.drop(wasm.block(null, [
							wasm.local.set(5, wasm.array.get(
								List.field(Value.cast(list_get, cg.vm.reftype.List)).internal,
								wasm.i32.wrap_i64(Vect.asInt(Value.field(genConst(cg, 0n)).primitive)),
								cg.vm.reftypeNull.Value,
							)),
							wasm.if(
								wasm.ref.is_null(item_1_get),
								genConst(cg),
								wasm.ref.as_non_null(item_1_get),
							),
						], cg.vm.reftype.Value)),
						wasm.drop(wasm.block(null, [
							wasm.local.set(6, wasm.array.get(
								List.field(Value.cast(list_get, cg.vm.reftype.List)).internal,
								wasm.i32.wrap_i64(Vect.asInt(Value.field(genConst(cg, 3n)).primitive)),
								cg.vm.reftypeNull.Value,
							)),
							wasm.if(
								wasm.ref.is_null(item_2_get),
								genConst(cg),
								wasm.ref.as_non_null(item_2_get),
							),
						], cg.vm.reftype.Value)),
						wasm.drop(wasm.block(null, [
							wasm.local.set(7, wasm.array.get(
								List.field(Value.cast(list_get, cg.vm.reftype.List)).internal,
								wasm.i32.wrap_i64(Vect.asInt(Value.field(genConst(cg, -1n)).primitive)),
								cg.vm.reftypeNull.Value,
							)),
							wasm.if(
								wasm.ref.is_null(item_3_get),
								genConst(cg),
								wasm.ref.as_non_null(item_3_get),
							),
						], cg.vm.reftype.Value)),
					]);
				});
				test.test('DICT.GET', () => {
					const {builder, cg, wasm} = setupScript(`{
						val mut x:    int    = 42;
						val mut dict: [:int] = [a= 42, c= 43];

						[a= x, b= 43, c= 44].[@b];
						dict.[@a];
						dict.[@c];
					}`);
					const {Vect, Value, Property, Dict} = cg.vm;
					return assertEqualBins(builder.instructions.slice(3).map((instr) => instr.codegen(cg)), [
						wasm.drop(wasm.block(null, [
							wasm.local.set(3, wasm.tuple.extract(Dict.find(
								Value.cast(wasm.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.Dict),
								Vect.asNat(Value.field(genConst(cg, Symbol(0x104))).primitive),
							), 1)),
							wasm.if(
								wasm.i32.or(
									wasm.ref.is_null(wasm.local.get(3, cg.vm.reftypeNull.Property)),
									Property.isTombstone(wasm.local.get(3, cg.vm.reftypeNull.Property)),
								),
								genConst(cg),
								Property.field(wasm.local.get(3, cg.vm.reftypeNull.Property)).val,
							),
						], cg.vm.reftype.Value)),
						wasm.drop(wasm.block(null, [
							wasm.local.set(4, wasm.tuple.extract(Dict.find(
								Value.cast(wasm.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Dict),
								Vect.asNat(Value.field(genConst(cg, Symbol(0x101))).primitive),
							), 1)),
							wasm.if(
								wasm.i32.or(
									wasm.ref.is_null(wasm.local.get(4, cg.vm.reftypeNull.Property)),
									Property.isTombstone(wasm.local.get(4, cg.vm.reftypeNull.Property)),
								),
								genConst(cg),
								Property.field(wasm.local.get(4, cg.vm.reftypeNull.Property)).val,
							),
						], cg.vm.reftype.Value)),
						wasm.drop(wasm.block(null, [
							wasm.local.set(5, wasm.tuple.extract(Dict.find(
								Value.cast(wasm.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Dict),
								Vect.asNat(Value.field(genConst(cg, Symbol(0x102))).primitive),
							), 1)),
							wasm.if(
								wasm.i32.or(
									wasm.ref.is_null(wasm.local.get(5, cg.vm.reftypeNull.Property)),
									Property.isTombstone(wasm.local.get(5, cg.vm.reftypeNull.Property)),
								),
								genConst(cg),
								Property.field(wasm.local.get(5, cg.vm.reftypeNull.Property)).val,
							),
						], cg.vm.reftype.Value)),
					]);
				});
				test.test('SET.GET', () => {
					const {builder, cg, wasm} = setupScript(`{
						val 'set': {float} = {4.2, 2.4};
						'set'.[4.2];
						'set'.[3.3];
					}`);
					const {Value, Case, Map: VmMap} = cg.vm;
					const base:         binaryen.ExpressionRef = wasm.local.get(1, cg.vm.reftype.Value); // index 0 = nonempty map setup (implementation of Set)
					const maybe_case_0: binaryen.ExpressionRef = wasm.local.get(2, cg.vm.reftypeNull.Case);
					const maybe_case_1: binaryen.ExpressionRef = wasm.local.get(3, cg.vm.reftypeNull.Case);
					return assertEqualBins(builder.instructions.slice(1).map((instr) => instr.codegen(cg)), [
						wasm.drop(wasm.block(null, [
							wasm.local.set(2, wasm.tuple.extract(VmMap.find(
								Value.cast(base, cg.vm.reftype.Map),
								genConst(cg, 4.2),
							), 1)),
							wasm.if(
								wasm.i32.or(
									wasm.ref.is_null(maybe_case_0),
									Case.isTombstone(maybe_case_0),
								),
								genConst(cg, false),
								genConst(cg, true),
							),
						], cg.vm.reftype.Value)),
						wasm.drop(wasm.block(null, [
							wasm.local.set(3, wasm.tuple.extract(VmMap.find(
								Value.cast(base, cg.vm.reftype.Map),
								genConst(cg, 3.3),
							), 1)),
							wasm.if(
								wasm.i32.or(
									wasm.ref.is_null(maybe_case_1),
									Case.isTombstone(maybe_case_1),
								),
								genConst(cg, false),
								genConst(cg, true),
							),
						], cg.vm.reftype.Value)),
					]);
				});
				test.test('MAP.GET', () => {
					const {builder, cg, wasm} = setupScript(`{
						val map: {float -> int} = {4.2 -> 42, 2.4 -> 24};
						map.[4.2];
						map.[3.3];
					}`);
					const {Value, Case, Map: VmMap} = cg.vm;
					const base:         binaryen.ExpressionRef = wasm.local.get(1, cg.vm.reftype.Value); // index 0 = nonempty map setup
					const maybe_case_0: binaryen.ExpressionRef = wasm.local.get(2, cg.vm.reftypeNull.Case);
					const maybe_case_1: binaryen.ExpressionRef = wasm.local.get(3, cg.vm.reftypeNull.Case);
					return assertEqualBins(builder.instructions.slice(1).map((instr) => instr.codegen(cg)), [
						wasm.drop(wasm.block(null, [
							wasm.local.set(2, wasm.tuple.extract(VmMap.find(
								Value.cast(base, cg.vm.reftype.Map),
								genConst(cg, 4.2),
							), 1)),
							wasm.if(
								wasm.i32.or(
									wasm.ref.is_null(maybe_case_0),
									Case.isTombstone(maybe_case_0),
								),
								genConst(cg),
								Case.field(maybe_case_0).con,
							),
						], cg.vm.reftype.Value)),
						wasm.drop(wasm.block(null, [
							wasm.local.set(3, wasm.tuple.extract(VmMap.find(
								Value.cast(base, cg.vm.reftype.Map),
								genConst(cg, 3.3),
							), 1)),
							wasm.if(
								wasm.i32.or(
									wasm.ref.is_null(maybe_case_1),
									Case.isTombstone(maybe_case_1),
								),
								genConst(cg),
								Case.field(maybe_case_1).con,
							),
						], cg.vm.reftype.Value)),
					]);
				});
			});

			test.suite('Unop', () => {
				test.test('ISNULL operator returns custom WASM function `$op:is-null`.', () => {
					// there exists no syntax for “is null” operator, so constructing it manually
					const cg = new CodeGenerator();
					assertEqualBins(
						new OP.Unop(OP.OpCode.ISNULL, new OP.Const(VALUE.NULL), TYPE.BOOL).codegen(cg),
						cg.vm.op.isNull(genConst(cg)),
					);
				});
				test.test('TOBOOL operator returns custom WASM function `$op:not` applied twice.', () => {
					// there exists no syntax for “to bool” operator, so constructing it manually
					const cg = new CodeGenerator();
					assertEqualBins(
						new OP.Unop(OP.OpCode.TOBOOL, new OP.Const(VALUE.NULL), TYPE.BOOL).codegen(cg),
						cg.vm.op.not(cg.vm.op.not(genConst(cg))),
					);
				});
				test.test('Primitive unary operators return custom WASM functions.', () => {
					const {stmts, builder, cg} = setupScript(`{
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
						stmts.map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg)),
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
					const {stmts, builder, cg, wasm} = setupScript(`{
						val mut x: int = 42;
						val list: [int] = [x, 43, 44];
						list;
					}`);
					const {Vect, Value, List} = cg.vm;
					// there exists no syntax for List count, so constructing it manually
					const list = (stmts[2] as AST.STMT.StatementExpression).expr!.build(builder) as OP.Get;
					const unop = new OP.Unop(
						OP.OpCode.LIST_COUNT,
						list,
						TYPE.NAT,
					);
					return assertEqualBins(
						unop.codegen(cg),
						Value.newPrimitive(Vect.newNat(wasm.i64.extend_i32_u(List.count(Value.cast(list.codegen(cg), cg.vm.reftype.List))))),
					);
				});
				test.test('DICT.COUNT', () => {
					const {stmts, builder, cg, wasm} = setupScript(`{
						val mut x: int = 42;
						val dict: [:int] = [a= x, b= 43, c= 44];
						dict;
					}`);
					const {Vect, Value, Dict} = cg.vm;
					// there exists no syntax for Dict count, so constructing it manually
					const dict = (stmts[2] as AST.STMT.StatementExpression).expr!.build(builder) as OP.Get;
					const unop = new OP.Unop(
						OP.OpCode.DICT_COUNT,
						dict,
						TYPE.NAT,
					);
					return assertEqualBins(
						unop.codegen(cg),
						Value.newPrimitive(Vect.newNat(wasm.i64.extend_i32_u(Dict.count(Value.cast(dict.codegen(cg), cg.vm.reftype.Dict))))),
					);
				});
				test.test('SET.COUNT', () => {
					const {stmts, builder, cg, wasm} = setupScript(`{
						val mut x: int = 42;
						val 'set': {int} = {x, 43, 44};
						'set';
					}`);
					const {Vect, Value, Map: VmMap} = cg.vm;
					// there exists no syntax for Set count, so constructing it manually
					const set = (stmts[2] as AST.STMT.StatementExpression).expr!.build(builder) as OP.Get;
					const unop = new OP.Unop(
						OP.OpCode.SET_COUNT,
						set,
						TYPE.NAT,
					);
					return assertEqualBins(
						unop.codegen(cg),
						Value.newPrimitive(Vect.newNat(wasm.i64.extend_i32_u(VmMap.count(Value.cast(set.codegen(cg), cg.vm.reftype.Map))))),
					);
				});
				test.test('MAP.COUNT', () => {
					const {stmts, builder, cg, wasm} = setupScript(`{
						val mut x: int = 42;
						val map: {float -> int} = {1.1 -> x, 2.2 -> 43, 3.3 -> 44};
						map;
					}`);
					const {Vect, Value, Map: VmMap} = cg.vm;
					// there exists no syntax for Map count, so constructing it manually
					const map = (stmts[2] as AST.STMT.StatementExpression).expr!.build(builder) as OP.Get;
					const unop = new OP.Unop(
						OP.OpCode.MAP_COUNT,
						map,
						TYPE.NAT,
					);
					return assertEqualBins(
						unop.codegen(cg),
						Value.newPrimitive(Vect.newNat(wasm.i64.extend_i32_u(VmMap.count(Value.cast(map.codegen(cg), cg.vm.reftype.Map))))),
					);
				});
			});

			test.test('Binop returns custom WASM functions.', () => {
				const {stmts, builder, cg} = setupScript(`{
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
				return assertEqualBins(
					stmts.map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg)),
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
						cg.vm.op.eq(genConst(cg, 2.0), genConst(cg, 3n)),
					],
				);
			});
		});
	});


	test.suite('Instruction', () => {
		test.suite('#codegen', () => {
			test.test('Drop returns (drop).', () => {
				const {builder, cg, wasm} = setupScript(`{
					null;
					false;
					@hello;
					42;
					4.2;
				}`, {codegen: false});
				return assertEqualBins(
					builder.instructions.map((instr) => instr.codegen(cg)),
					[
						wasm.drop(genConst(cg)),
						wasm.drop(genConst(cg, false)),
						wasm.drop(genConst(cg, Symbol(0x100))),
						wasm.drop(genConst(cg, 42n)),
						wasm.drop(genConst(cg, 4.2)),
					],
				);
			});

			test.test('Decl & Set both return (local.set).', () => {
				const {builder, cg, wasm} = setupScript(`{
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
				return assertEqualBins(
					builder.instructions.map((instr) => instr.codegen(cg)),
					[
						wasm.local.set(0, genConst(cg)),
						wasm.local.set(1, genConst(cg, false)),
						wasm.local.set(2, genConst(cg, Symbol(0x102))),
						wasm.local.set(3, genConst(cg, 42n)),
						wasm.local.set(4, genConst(cg, 4.2)),

						wasm.local.set(0, genConst(cg)),
						wasm.local.set(1, genConst(cg, true)),
						wasm.local.set(2, genConst(cg, Symbol(0x106))),
						wasm.local.set(3, genConst(cg, 43n)),
						wasm.local.set(4, genConst(cg, 4.3)),
					],
				);
			});

			test.test('uninitialized Decl returns (local.set) with (struct.new_default).', () => {
				// there exists no syntax for empty Decls, so constructing it manually
				const cg = new CodeGenerator();
				assertEqualBins(
					new OP.Decl(new Builder().newTemp(TYPE.INT)).codegen(cg),
					cg.mod.wasm.local.set(0, cg.mod.wasm.struct.new_default(cg.vm.reftype.Value)),
				);
			});

			test.suite('CollectionDynamicSet', () => {
				test.test('LIST.SET', () => {
					const {builder, cg, wasm} = setupScript(`{
						val mut x:    int       = 42;
						val mut list: mut [int] = [42, 43];

						set [x, 43, 44].[1 + 1] = 45;
						set list.[0] = 46;
						set list.[2] = 47;
					}`);
					const {Vect, Value, List} = cg.vm;
					return assertEqualBins(builder.instructions.slice(4).map((instr) => instr.codegen(cg)), [
						List.set(
							Value.cast(wasm.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.List),
							wasm.i32.wrap_i64(Vect.asInt(Value.field(wasm.local.get(3, cg.vm.reftype.Value)).primitive)),
							genConst(cg, 45n),
						),
						List.set(
							Value.cast(wasm.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.List),
							wasm.i32.wrap_i64(Vect.asInt(Value.field(genConst(cg, 0n)).primitive)),
							genConst(cg, 46n),
						),
						List.set(
							Value.cast(wasm.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.List),
							wasm.i32.wrap_i64(Vect.asInt(Value.field(genConst(cg, 2n)).primitive)),
							genConst(cg, 47n),
						),
					]);
				});
				test.test('DICT.SET', () => {
					const {builder, cg, wasm} = setupScript(`{
						val mut x:    int        = 42;
						val mut dict: mut [:int] = [a= 42, c= 43];

						set [a= x, b= 43, c= 44].[@b] = 45;
						set dict.[@a] = 46;
						set dict.[@c] = 47;
					}`);
					const {Vect, Value, Dict} = cg.vm;
					return assertEqualBins(builder.instructions.slice(3).map((instr) => instr.codegen(cg)), [
						Dict.set(
							Value.cast(wasm.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.Dict),
							Vect.asNat(Value.field(genConst(cg, Symbol(0x104))).primitive),
							genConst(cg, 45n),
						),
						Dict.set(
							Value.cast(wasm.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Dict),
							Vect.asNat(Value.field(genConst(cg, Symbol(0x101))).primitive),
							genConst(cg, 46n),
						),
						Dict.set(
							Value.cast(wasm.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Dict),
							Vect.asNat(Value.field(genConst(cg, Symbol(0x102))).primitive),
							genConst(cg, 47n),
						),
					]);
				});
				test.test('SET.SET', () => {
					const {builder, cg, wasm} = setupScript(`{
						val 'set': mut {float} = {4.2, 2.4};
						set 'set'.[4.2] = false;
						set 'set'.[3.3] = true;
					}`, {codegen: false});
					const {Vect, Value, Map: VmMap} = cg.vm;
					const base:           binaryen.ExpressionRef = wasm.local.get(1, cg.vm.reftype.Value); // index 0 = nonempty map setup (implementation of Set)
					const base_get_0:     binaryen.ExpressionRef = wasm.local.get(2, cg.vm.reftype.Map);
					const accessor_get_0: binaryen.ExpressionRef = wasm.local.get(3, cg.vm.reftype.Value);
					const base_get_1:     binaryen.ExpressionRef = wasm.local.get(4, cg.vm.reftype.Map);
					const accessor_get_1: binaryen.ExpressionRef = wasm.local.get(5, cg.vm.reftype.Value);
					builder.instructions[0].codegen(cg);
					return assertEqualBins(builder.instructions.slice(1).map((instr) => instr.codegen(cg)), [
						wasm.block(null, [
							wasm.local.set(2, Value.cast(base, cg.vm.reftype.Map)),
							wasm.local.set(3, genConst(cg, 4.2)),
							wasm.if(
								Vect.isConst(Value.field(genConst(cg, false)).primitive, true),
								VmMap.set(base_get_0, accessor_get_0, genConst(cg)),
								wasm.drop(VmMap.delete(base_get_0, accessor_get_0)),
							),
						]),
						wasm.block(null, [
							wasm.local.set(4, Value.cast(base, cg.vm.reftype.Map)),
							wasm.local.set(5, genConst(cg, 3.3)),
							wasm.if(
								Vect.isConst(Value.field(genConst(cg, true)).primitive, true),
								VmMap.set(base_get_1, accessor_get_1, genConst(cg)),
								wasm.drop(VmMap.delete(base_get_1, accessor_get_1)),
							),
						]),
					]);
				});
				test.test('MAP.SET', () => {
					const {builder, cg, wasm} = setupScript(`{
						val map: mut {float -> int} = {4.2 -> 42, 2.4 -> 24};
						set map.[4.2] = 21;
						set map.[3.3] = 21;
					}`);
					const {Value, Map: VmMap} = cg.vm;
					const base: binaryen.ExpressionRef = wasm.local.get(1, cg.vm.reftype.Value); // index 0 = nonempty map setup
					return assertEqualBins(builder.instructions.slice(1).map((instr) => instr.codegen(cg)), [
						VmMap.set(Value.cast(base, cg.vm.reftype.Map), genConst(cg, 4.2), genConst(cg, 21n)),
						VmMap.set(Value.cast(base, cg.vm.reftype.Map), genConst(cg, 3.3), genConst(cg, 21n)),
					]);
				});
			});

			test.suite('CollectionDynamicCopy', () => {
				test.suite('LIST.COPY', () => {
					test.test('tuple argument.', () => {
						const {builder, cg, wasm} = setupScript(`{
							List.<int>((2, 3, 5));
						}`, {codegen: false});
						const {Value, List} = cg.vm;
						const destlist_get: binaryen.ExpressionRef = wasm.local.get(2, cg.vm.reftype.List);
						const srcref_get:   binaryen.ExpressionRef = wasm.local.get(3, cg.vm.reftype.Tuple);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							wasm.block(null, [
								wasm.local.set(2, Value.cast(wasm.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.List)),
								wasm.local.set(3, Value.cast(wasm.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Tuple)),
								List.adjustCapacity(
									destlist_get,
									cg.vm.util.capacityNeeded(wasm.array.len(srcref_get)),
								),
								wasm.array.copy(
									List.field(destlist_get).internal,
									wasm.i32.const(0),
									srcref_get,
									wasm.i32.const(0),
									wasm.array.len(srcref_get),
								),
							]),
						);
					});
					test.test('List argument.', () => {
						const {builder, cg, wasm} = setupScript(`{
							List.<int>([2, 3, 5]);
						}`, {codegen: false});
						const {Value, List} = cg.vm;
						const destlist_get: binaryen.ExpressionRef = wasm.local.get(2, cg.vm.reftype.List);
						const srcref_get:   binaryen.ExpressionRef = wasm.local.get(3, cg.vm.reftype.ListInternal);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							wasm.block(null, [
								wasm.local.set(2, Value.cast(wasm.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.List)),
								wasm.local.set(3, List.field(Value.cast(wasm.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.List)).internal),
								List.adjustCapacity(
									destlist_get,
									wasm.array.len(srcref_get),
								),
								wasm.array.copy(
									List.field(destlist_get).internal,
									wasm.i32.const(0),
									srcref_get,
									wasm.i32.const(0),
									wasm.array.len(srcref_get),
								),
							]),
						);
					});
					test.test('Set argument.', () => {
						const {builder, cg, wasm} = setupScript(`{
							List.<int>({2, 3, 5});
						}`, {codegen: false});
						const {Value, Case, List, Map: VmMap} = cg.vm;
						const cases_get: binaryen.ExpressionRef = wasm.local.get(4, cg.vm.reftype.MapInternal);
						const j_get:     binaryen.ExpressionRef = wasm.local.get(5, binaryen.i32);
						const i_get:     binaryen.ExpressionRef = wasm.local.get(6, binaryen.i32);
						const case_get:  binaryen.ExpressionRef = wasm.local.get(7, cg.vm.reftypeNull.Case);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							wasm.block(null, [
								wasm.local.set(5, wasm.i32.const(0)),
								wasm.block(null, [
									wasm.local.set(3, Value.cast(wasm.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.List)),
									wasm.local.set(4, VmMap.field(Value.cast(wasm.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.Map)).internal), // index 1 = nonempty map setup (implementation of Set)
									wasm.block('exit-0', [
										wasm.local.set(6, wasm.i32.const(0)),
										wasm.loop('repeat-0', wasm.block(null, [
											wasm.br_if('exit-0', wasm.i32.ge_u(i_get, wasm.array.len(cases_get))),
											wasm.local.set(7, wasm.array.get(cases_get, i_get, cg.vm.reftypeNull.Case)),
											wasm.if(
												wasm.i32.eqz(wasm.ref.is_null(case_get)),
												wasm.block(null, [
													List.set(
														wasm.local.get(3, cg.vm.reftype.List),
														j_get,
														Case.field(case_get).ant,
													),
													wasm.local.set(5, wasm.i32.add(j_get, wasm.i32.const(1))),
												]),
											),
											wasm.local.set(6, wasm.i32.add(i_get, wasm.i32.const(1))),
											wasm.br('repeat-0'),
										])),
									]),
								]),
							]),
						);
					});
				});
				test.suite('DICT.COPY', () => {
					test.test('tuple argument.', () => {
						const {builder, cg, wasm} = setupScript(`{
							Dict.<int>(( (@a, 2), (@b, 3), (@c, 5) ));
						}`, {codegen: false});
						const {Vect, Value, Dict} = cg.vm;
						const pairs_get: binaryen.ExpressionRef = wasm.local.get(6, cg.vm.reftype.Tuple);
						const i_get:     binaryen.ExpressionRef = wasm.local.get(7, binaryen.i32);
						builder.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[5].codegen(cg),
							wasm.block(null, [
								wasm.local.set(5, Value.cast(wasm.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Dict)),
								wasm.local.set(6, Value.cast(wasm.local.get(4, cg.vm.reftype.Value), cg.vm.reftype.Tuple)),
								wasm.block('exit-0', [
									wasm.local.set(7, wasm.i32.const(0)),
									wasm.loop('repeat-0', wasm.block(null, [
										wasm.br_if('exit-0', wasm.i32.ge_u(i_get, wasm.array.len(pairs_get))),
										wasm.local.set(8, wasm.array.get(pairs_get, i_get, cg.vm.reftype.Value)),
										Dict.set(
											wasm.local.get(5, cg.vm.reftype.Dict),
											Vect.asNat(Value.field(wasm.array.get(
												wasm.local.tee(9, Value.cast(wasm.local.get(8, cg.vm.reftype.Value), cg.vm.reftype.Tuple), cg.vm.reftype.Tuple),
												wasm.i32.const(0),
												cg.vm.reftype.Value,
											)).primitive),
											wasm.array.get(wasm.local.get(9, cg.vm.reftype.Tuple), wasm.i32.const(1), cg.vm.reftype.Value),
										),
										wasm.local.set(7, wasm.i32.add(i_get, wasm.i32.const(1))),
										wasm.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('record argument.', () => {
						const {builder, cg, wasm} = setupScript(`{
							Dict.<int>((a= 2, b= 3, c= 5));
						}`, {codegen: false});
						const {Value, Dict} = cg.vm;
						const destdict_get: binaryen.ExpressionRef = wasm.local.get(2, cg.vm.reftype.Dict);
						const srcref_get:   binaryen.ExpressionRef = wasm.local.get(3, cg.vm.reftype.Record);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							wasm.block(null, [
								wasm.local.set(2, Value.cast(wasm.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Dict)),
								wasm.local.set(3, Value.cast(wasm.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Record)),
								Dict.adjustCapacity(
									destdict_get,
									cg.vm.util.capacityNeeded(wasm.array.len(srcref_get)),
								),
								wasm.array.copy(
									Dict.field(destdict_get).internal,
									wasm.i32.const(0),
									srcref_get,
									wasm.i32.const(0),
									wasm.array.len(srcref_get),
								),
							]),
						);
					});
					test.test('List argument.', () => {
						const {builder, cg, wasm} = setupScript(`{
							Dict.<int>([ (@a, 2), (@b, 3), (@c, 5) ]);
						}`, {codegen: false});
						const {Vect, Value, List, Dict} = cg.vm;
						const pairs_get: binaryen.ExpressionRef = wasm.local.get(6, cg.vm.reftype.ListInternal);
						const i_get:     binaryen.ExpressionRef = wasm.local.get(7, binaryen.i32);
						const item_get:  binaryen.ExpressionRef = wasm.local.get(8, cg.vm.reftypeNull.Value);
						builder.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[5].codegen(cg),
							wasm.block(null, [
								wasm.local.set(5, Value.cast(wasm.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Dict)),
								wasm.local.set(6, List.field(Value.cast(wasm.local.get(4, cg.vm.reftype.Value), cg.vm.reftype.List)).internal),
								wasm.block('exit-0', [
									wasm.local.set(7, wasm.i32.const(0)),
									wasm.loop('repeat-0', wasm.block(null, [
										wasm.br_if('exit-0', wasm.i32.ge_u(i_get, wasm.array.len(pairs_get))),
										wasm.local.set(8, wasm.array.get(pairs_get, i_get, cg.vm.reftypeNull.Value)),
										wasm.if(
											wasm.i32.eqz(wasm.ref.is_null(item_get)),
											Dict.set(
												wasm.local.get(5, cg.vm.reftype.Dict),
												Vect.asNat(Value.field(wasm.array.get(
													wasm.local.tee(9, Value.cast(item_get, cg.vm.reftype.Tuple), cg.vm.reftype.Tuple),
													wasm.i32.const(0),
													cg.vm.reftype.Value,
												)).primitive),
												wasm.array.get(wasm.local.get(9, cg.vm.reftype.Tuple), wasm.i32.const(1), cg.vm.reftype.Value),
											),
										),
										wasm.local.set(7, wasm.i32.add(i_get, wasm.i32.const(1))),
										wasm.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('Dict argument.', () => {
						const {builder, cg, wasm} = setupScript(`{
							Dict.<int>([a= 2, b= 3, c= 5]);
						}`, {codegen: false});
						const {Value, Dict} = cg.vm;
						const destdict_get: binaryen.ExpressionRef = wasm.local.get(2, cg.vm.reftype.Dict);
						const srcref_get:   binaryen.ExpressionRef = wasm.local.get(3, cg.vm.reftype.DictInternal);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							wasm.block(null, [
								wasm.local.set(2, Value.cast(wasm.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Dict)),
								wasm.local.set(3, Dict.field(Value.cast(wasm.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Dict)).internal),
								Dict.adjustCapacity(
									destdict_get,
									wasm.array.len(srcref_get),
								),
								wasm.array.copy(
									Dict.field(destdict_get).internal,
									wasm.i32.const(0),
									srcref_get,
									wasm.i32.const(0),
									wasm.array.len(srcref_get),
								),
							]),
						);
					});
					test.test('Set argument.', () => {
						const {builder, cg, wasm} = setupScript(`{
							Dict.<int>({ (@a, 2), (@b, 3), (@c, 5) });
						}`, {codegen: false});
						const {Vect, Value, Case, Dict, Map: VmMap} = cg.vm;
						const cases_get: binaryen.ExpressionRef = wasm.local.get(7, cg.vm.reftype.MapInternal);
						const i_get:     binaryen.ExpressionRef = wasm.local.get(8, binaryen.i32);
						const case_get:  binaryen.ExpressionRef = wasm.local.get(9, cg.vm.reftypeNull.Case);
						builder.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[5].codegen(cg),
							wasm.block(null, [
								wasm.local.set(6, Value.cast(wasm.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Dict)),
								wasm.local.set(7, VmMap.field(Value.cast(wasm.local.get(5, cg.vm.reftype.Value), cg.vm.reftype.Map)).internal), // index 4 = nonempty map setup (implementation of Set)
								wasm.block('exit-0', [
									wasm.local.set(8, wasm.i32.const(0)),
									wasm.loop('repeat-0', wasm.block(null, [
										wasm.br_if('exit-0', wasm.i32.ge_u(i_get, wasm.array.len(cases_get))),
										wasm.local.set(9, wasm.array.get(cases_get, i_get, cg.vm.reftypeNull.Case)),
										wasm.if(
											wasm.i32.eqz(wasm.ref.is_null(case_get)),
											Dict.set(
												wasm.local.get(6, cg.vm.reftype.Dict),
												Vect.asNat(Value.field(wasm.array.get(
													wasm.local.tee(10, Value.cast(Case.field(case_get).ant, cg.vm.reftype.Tuple), cg.vm.reftype.Tuple),
													wasm.i32.const(0),
													cg.vm.reftype.Value,
												)).primitive),
												wasm.array.get(wasm.local.get(10, cg.vm.reftype.Tuple), wasm.i32.const(1), cg.vm.reftype.Value),
											),
										),
										wasm.local.set(8, wasm.i32.add(i_get, wasm.i32.const(1))),
										wasm.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('Map argument.', () => {
						const {builder, cg, wasm} = setupScript(`{
							Dict.<int>({@a -> 2, @b -> 3, @c -> 5});
						}`, {codegen: false});
						const {Vect, Value, Case, Dict, Map: VmMap} = cg.vm;
						const cases_get: binaryen.ExpressionRef = wasm.local.get(4, cg.vm.reftype.MapInternal);
						const i_get:     binaryen.ExpressionRef = wasm.local.get(5, binaryen.i32);
						const case_get:  binaryen.ExpressionRef = wasm.local.get(6, cg.vm.reftypeNull.Case);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							wasm.block(null, [
								wasm.local.set(3, Value.cast(wasm.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Dict)),
								wasm.local.set(4, VmMap.field(Value.cast(wasm.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.Map)).internal), // index 1 = nonempty map setup
								wasm.block('exit-0', [
									wasm.local.set(5, wasm.i32.const(0)),
									wasm.loop('repeat-0', wasm.block(null, [
										wasm.br_if('exit-0', wasm.i32.ge_u(i_get, wasm.array.len(cases_get))),
										wasm.local.set(6, wasm.array.get(cases_get, i_get, cg.vm.reftypeNull.Case)),
										wasm.if(
											wasm.i32.eqz(wasm.ref.is_null(case_get)),
											wasm.block(null, [
												Dict.set(
													wasm.local.get(3, cg.vm.reftype.Dict),
													Vect.asNat(Value.field(Case.field(case_get).ant).primitive),
													Case.field(case_get).con,
												),
											]),
										),
										wasm.local.set(5, wasm.i32.add(i_get, wasm.i32.const(1))),
										wasm.br('repeat-0'),
									])),
								]),
							]),
						);
					});
				});
				test.suite('SET.COPY', () => {
					test.test('tuple argument.', () => {
						const {builder, cg, wasm} = setupScript(`{
							Set.<int>((2, 3, 5));
						}`, {codegen: false});
						const {Value, Map: VmMap} = cg.vm;
						const items_get: binaryen.ExpressionRef = wasm.local.get(3, cg.vm.reftype.Tuple);
						const i_get:     binaryen.ExpressionRef = wasm.local.get(4, binaryen.i32);
						const item_get:  binaryen.ExpressionRef = wasm.local.get(5, cg.vm.reftype.Value);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							wasm.block(null, [
								wasm.local.set(2, Value.cast(wasm.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Map)),
								wasm.local.set(3, Value.cast(wasm.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Tuple)),
								wasm.block('exit-0', [
									wasm.local.set(4, wasm.i32.const(0)),
									wasm.loop('repeat-0', wasm.block(null, [
										wasm.br_if('exit-0', wasm.i32.ge_u(i_get, wasm.array.len(items_get))),
										wasm.local.set(5, wasm.array.get(items_get, i_get, cg.vm.reftype.Value)),
										VmMap.set(
											wasm.local.get(2, cg.vm.reftype.Map),
											item_get,
											genConst(cg),
										),
										wasm.local.set(4, wasm.i32.add(i_get, wasm.i32.const(1))),
										wasm.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('List argument.', () => {
						const {builder, cg, wasm} = setupScript(`{
							Set.<int>([2, 3, 5]);
						}`, {codegen: false});
						const {Value, List, Map: VmMap} = cg.vm;
						const items_get: binaryen.ExpressionRef = wasm.local.get(3, cg.vm.reftype.ListInternal);
						const i_get:     binaryen.ExpressionRef = wasm.local.get(4, binaryen.i32);
						const item_get:  binaryen.ExpressionRef = wasm.local.get(5, cg.vm.reftype.Value);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							wasm.block(null, [
								wasm.local.set(2, Value.cast(wasm.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Map)),
								wasm.local.set(3, List.field(Value.cast(wasm.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.List)).internal),
								wasm.block('exit-0', [
									wasm.local.set(4, wasm.i32.const(0)),
									wasm.loop('repeat-0', wasm.block(null, [
										wasm.br_if('exit-0', wasm.i32.ge_u(i_get, wasm.array.len(items_get))),
										wasm.local.set(5, wasm.array.get(items_get, i_get, cg.vm.reftypeNull.Value)),
										wasm.if(
											wasm.i32.eqz(wasm.ref.is_null(item_get)),
											VmMap.set(
												wasm.local.get(2, cg.vm.reftype.List),
												wasm.ref.as_non_null(item_get),
												genConst(cg),
											),
										),
										wasm.local.set(4, wasm.i32.add(i_get, wasm.i32.const(1))),
										wasm.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('Set argument.', () => {
						const {builder, cg, wasm} = setupScript(`{
							Set.<int>({2, 3, 5});
						}`, {codegen: false});
						const {Value, Map: VmMap} = cg.vm;
						const destset_get: binaryen.ExpressionRef = wasm.local.get(3, cg.vm.reftype.Map);
						const srcref_get:  binaryen.ExpressionRef = wasm.local.get(4, cg.vm.reftype.MapInternal);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							wasm.block(null, [
								wasm.local.set(3, Value.cast(wasm.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Map)),
								wasm.local.set(4, VmMap.field(Value.cast(wasm.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.Map)).internal), // index 1 = nonempty map setup (implementation of Set)
								VmMap.adjustCapacity(
									destset_get,
									wasm.array.len(srcref_get),
								),
								wasm.array.copy(
									VmMap.field(destset_get).internal,
									wasm.i32.const(0),
									srcref_get,
									wasm.i32.const(0),
									wasm.array.len(srcref_get),
								),
							]),
						);
					});
				});
				test.suite('MAP.COPY', () => {
					test.test('tuple argument.', () => {
						const {builder, cg, wasm} = setupScript(`{
							Map.<float, int>(( (1.414, 2), (1.732, 3), (2.236, 5) ));
						}`, {codegen: false});
						const {Value, Map: VmMap} = cg.vm;
						const pairs_get: binaryen.ExpressionRef = wasm.local.get(6, cg.vm.reftype.Tuple);
						const i_get:     binaryen.ExpressionRef = wasm.local.get(7, binaryen.i32);
						builder.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[5].codegen(cg),
							wasm.block(null, [
								wasm.local.set(5, Value.cast(wasm.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Map)),
								wasm.local.set(6, Value.cast(wasm.local.get(4, cg.vm.reftype.Value), cg.vm.reftype.Tuple)),
								wasm.block('exit-0', [
									wasm.local.set(7, wasm.i32.const(0)),
									wasm.loop('repeat-0', wasm.block(null, [
										wasm.br_if('exit-0', wasm.i32.ge_u(i_get, wasm.array.len(pairs_get))),
										wasm.local.set(8, wasm.array.get(pairs_get, i_get, cg.vm.reftype.Value)),
										VmMap.set(
											wasm.local.get(5, cg.vm.reftype.Map),
											wasm.array.get(wasm.local.tee(9, Value.cast(wasm.local.get(8, cg.vm.reftype.Value), cg.vm.reftype.Tuple), cg.vm.reftype.Tuple), wasm.i32.const(0), cg.vm.reftype.Value),
											wasm.array.get(wasm.local.get(9, cg.vm.reftype.Tuple), wasm.i32.const(1), cg.vm.reftype.Value),
										),
										wasm.local.set(7, wasm.i32.add(i_get, wasm.i32.const(1))),
										wasm.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('List argument.', () => {
						const {builder, cg, wasm} = setupScript(`{
							Map.<float, int>([ (1.414, 2), (1.732, 3), (2.236, 5) ]);
						}`, {codegen: false});
						const {Value, List, Map: VmMap} = cg.vm;
						const pairs_get: binaryen.ExpressionRef = wasm.local.get(6, cg.vm.reftype.ListInternal);
						const i_get:     binaryen.ExpressionRef = wasm.local.get(7, binaryen.i32);
						const item_get:  binaryen.ExpressionRef = wasm.local.get(8, cg.vm.reftypeNull.Value);
						builder.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[5].codegen(cg),
							wasm.block(null, [
								wasm.local.set(5, Value.cast(wasm.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Map)),
								wasm.local.set(6, List.field(Value.cast(wasm.local.get(4, cg.vm.reftype.Value), cg.vm.reftype.List)).internal),
								wasm.block('exit-0', [
									wasm.local.set(7, wasm.i32.const(0)),
									wasm.loop('repeat-0', wasm.block(null, [
										wasm.br_if('exit-0', wasm.i32.ge_u(i_get, wasm.array.len(pairs_get))),
										wasm.local.set(8, wasm.array.get(pairs_get, i_get, cg.vm.reftypeNull.Value)),
										wasm.if(
											wasm.i32.eqz(wasm.ref.is_null(item_get)),
											VmMap.set(
												wasm.local.get(5, cg.vm.reftype.Map),
												wasm.array.get(wasm.local.tee(9, Value.cast(item_get, cg.vm.reftype.Tuple), cg.vm.reftype.Tuple), wasm.i32.const(0), cg.vm.reftype.Value),
												wasm.array.get(wasm.local.get(9, cg.vm.reftype.Tuple), wasm.i32.const(1), cg.vm.reftype.Value),
											),
										),
										wasm.local.set(7, wasm.i32.add(i_get, wasm.i32.const(1))),
										wasm.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('Set argument.', () => {
						const {builder, cg, wasm} = setupScript(`{
							Map.<float, int>({ (1.414, 2), (1.732, 3), (2.236, 5) });
						}`, {codegen: false});
						const {Value, Case, Map: VmMap} = cg.vm;
						const cases_get: binaryen.ExpressionRef = wasm.local.get(7, cg.vm.reftype.MapInternal);
						const i_get:     binaryen.ExpressionRef = wasm.local.get(8, binaryen.i32);
						const case_get:  binaryen.ExpressionRef = wasm.local.get(9, cg.vm.reftypeNull.Case);
						builder.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[5].codegen(cg),
							wasm.block(null, [
								wasm.local.set(6, Value.cast(wasm.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Map)),
								wasm.local.set(7, VmMap.field(Value.cast(wasm.local.get(5, cg.vm.reftype.Value), cg.vm.reftype.Map)).internal), // index 4 = nonempty map setup (implementation of Set)
								wasm.block('exit-0', [
									wasm.local.set(8, wasm.i32.const(0)),
									wasm.loop('repeat-0', wasm.block(null, [
										wasm.br_if('exit-0', wasm.i32.ge_u(i_get, wasm.array.len(cases_get))),
										wasm.local.set(9, wasm.array.get(cases_get, i_get, cg.vm.reftypeNull.Case)),
										wasm.if(
											wasm.i32.eqz(wasm.ref.is_null(case_get)),
											VmMap.set(
												wasm.local.get(6, cg.vm.reftype.Map),
												wasm.array.get(wasm.local.tee(10, Value.cast(Case.field(case_get).ant, cg.vm.reftype.Tuple), cg.vm.reftype.Tuple), wasm.i32.const(0), cg.vm.reftype.Value),
												wasm.array.get(wasm.local.get(10, cg.vm.reftype.Tuple), wasm.i32.const(1), cg.vm.reftype.Value),
											),
										),
										wasm.local.set(8, wasm.i32.add(i_get, wasm.i32.const(1))),
										wasm.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('Map argument.', () => {
						const {builder, cg, wasm} = setupScript(`{
							Map.<float, int>({1.414 -> 2, 1.732 -> 3, 2.236 -> 5});
						}`, {codegen: false});
						const {Value, Map: VmMap} = cg.vm;
						const destmap_get: binaryen.ExpressionRef = wasm.local.get(3, cg.vm.reftype.Map);
						const srcref_get:  binaryen.ExpressionRef = wasm.local.get(4, cg.vm.reftype.MapInternal);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							wasm.block(null, [
								wasm.local.set(3, Value.cast(wasm.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Map)),
								wasm.local.set(4, VmMap.field(Value.cast(wasm.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.Map)).internal), // index 1 = nonempty map setup (implementation of Set)
								VmMap.adjustCapacity(
									destmap_get,
									wasm.array.len(srcref_get),
								),
								wasm.array.copy(
									VmMap.field(destmap_get).internal,
									wasm.i32.const(0),
									srcref_get,
									wasm.i32.const(0),
									wasm.array.len(srcref_get),
								),
							]),
						);
					});
				});
			});
		});
	});
});

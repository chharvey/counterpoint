import * as assert from 'node:assert';
import * as test from 'node:test';
import * as binaryen from 'binaryen.ts';
import * as xjs from 'extrajs';
import {
	Validator,
	AST,
	assert_instanceof,
	VALUE,
	TYPE,
	CORE_LIB_NAMES,
	Builder,
	OP,
	CodeGenerator,
} from '../../../src/index.ts';
import {
	assertEqualBins,
	genConst,
	setupScript,
} from '../../utils.ts';



test.suite('ValueVisitorCodegen#visit', () => {
	test.test('Trap returns (unreachable).', () => {
		const cg = new CodeGenerator();
		return assertEqualBins(new OP.ValueVisitorCodegen(cg).visit(new OP.Trap()), cg.mod.wasm.unreachable());
	});


	test.test('Const returns (struct.new $Value).', () => {
		const {stmts, cg, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
			null;
			false;
			@hello;
			42;
			4.2;
			"hello";
		}`, {codegen: false});
		return assertEqualBins(
			stmts.map((stmt) => VISITOR.visit(visitors.build.expr.visit((stmt as AST.STMT.StatementExpression).expr!))),
			[
				genConst(cg),
				genConst(cg, false),
				genConst(cg, 'hello', 'sym'),
				genConst(cg, 42n),
				genConst(cg, 4.2),
				genConst(cg, 'hello'),
			],
		);
	});


	test.suite('Get', () => {
		test.test('variables return (local.get).', () => {
			const {stmts, cg, wasm, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				val mut a: null  = null;
				val mut b: bool  = false;
				val mut c: sym   = @hello;
				val mut d: int   = 42;
				val mut e: float = 4.2;
				val mut f?: str;

				a;
				b;
				c;
				d;
				e;
				f;
			}`);
			return assertEqualBins(
				stmts.slice(6).map((stmt) => VISITOR.visit(visitors.build.expr.visit((stmt as AST.STMT.StatementExpression).expr!))),
				Array.from(new Array(6), (_, i) => wasm.local.get(i, cg.vm.reftype.Value)),
			);
		});
		test.test('core lib classes return (global.get).', () => {
			const {stmts, cg, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				${CORE_LIB_NAMES.join(';')};
			}`);
			const {vm: {Class: VmClass}} = cg;
			return assertEqualBins(stmts.map((stmt) => VISITOR.visit(visitors.build.expr.visit((stmt as AST.STMT.StatementExpression).expr!))), [
				VmClass.NULL,
				VmClass.BOOLEAN,
				VmClass.SYMBOL,
				VmClass.INTEGER,
				VmClass.NATURAL,
				VmClass.FLOAT,
				VmClass.STRING,
				VmClass.OBJECT,
				VmClass.LIST,
				VmClass.DICT,
				VmClass.SET,
				VmClass.MAP,
				VmClass.EXCEPTION,
				VmClass.MAYBE,
				VmClass.NONE,
				VmClass.SOME,
				VmClass.RESULT,
				VmClass.FAIL,
				VmClass.OK,
				VmClass.FUNCTION,
				VmClass.CLASS,
			]);
		});
	});


	test.test('Template returns (block) containing static repetition of (array.copy).', () => {
		const {builder, cg, wasm, visitors} = setupScript(`{
			val user: (name: str) = (name= "Alan");
			"""Hello, {{user.name}}, you have {{2 * 3}} new messages.""";
		}`);
		const {heaptype, reftype, Value} = cg.vm;

		const strings = [
			genConst(cg, 'Hello, '),
			wasm.local.get(1, reftype.Value),
			genConst(cg, ', you have '),
			wasm.local.get(3, reftype.Value),
			genConst(cg, ' new messages.'),
		].map((code) => Value.asString(code));

		const RESULT_IDX =  9;
		const OFFSET_IDX = 10;

		const string_0_get: binaryen.ExpressionRef = wasm.local.get(4, reftype.String);
		const string_1_get: binaryen.ExpressionRef = wasm.local.get(5, reftype.String);
		const string_2_get: binaryen.ExpressionRef = wasm.local.get(6, reftype.String);
		const string_3_get: binaryen.ExpressionRef = wasm.local.get(7, reftype.String);
		const string_4_get: binaryen.ExpressionRef = wasm.local.get(8, reftype.String);

		const string_0_len: binaryen.ExpressionRef = wasm.array.len(string_0_get);
		const string_1_len: binaryen.ExpressionRef = wasm.array.len(string_1_get);
		const string_2_len: binaryen.ExpressionRef = wasm.array.len(string_2_get);
		const string_3_len: binaryen.ExpressionRef = wasm.array.len(string_3_get);
		const string_4_len: binaryen.ExpressionRef = wasm.array.len(string_4_get);

		const result_get: binaryen.ExpressionRef = wasm.local.get(RESULT_IDX, reftype.String);
		const offset_get: binaryen.ExpressionRef = wasm.local.get(OFFSET_IDX, binaryen.Type.i32);
		return assertEqualBins(
			visitors.codegen.instr.visit(builder.instructions.at(-1)!),
			wasm.drop(wasm.block(null, [
				wasm.local.set(4, strings[0]),
				wasm.local.set(5, strings[1]),
				wasm.local.set(6, strings[2]),
				wasm.local.set(7, strings[3]),
				wasm.local.set(8, strings[4]),
				wasm.local.set(RESULT_IDX, wasm.array.new_default(
					heaptype.String,
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
				Value.fromString(result_get),
			], reftype.Value)),
		);
	});


	test.suite('CollectionLinearNew', () => {
		test.test('empty TUPLE.NEW', () => {
			const {stmts, cg, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				();
			}`);
			return assertEqualBins(
				VISITOR.visit(visitors.build.expr.visit((stmts[0] as AST.STMT.StatementExpression).expr!)),
				cg.vm.Value.fromTuple(cg.codegenTuple()),
			);
		});
		test.test('nonempty TUPLE.NEW', () => {
			const {stmts, cg, wasm, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				val mut x: int = 42;
				(x, 4.2, (null,));
			}`);
			return assertEqualBins(
				VISITOR.visit(visitors.build.expr.visit((stmts[1] as AST.STMT.StatementExpression).expr!)),
				cg.vm.Value.fromTuple(cg.codegenTuple([
					wasm.local.get(0, cg.vm.reftype.Value),
					genConst(cg, 4.2),
					wasm.local.get(1, cg.vm.reftype.Value),
				])),
			);
		});
		test.test('empty LIST.NEW', () => {
			const {stmts, cg, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				[];
			}`);
			return assertEqualBins(
				VISITOR.visit(visitors.build.expr.visit((stmts[0] as AST.STMT.StatementExpression).expr!)),
				cg.vm.Value.fromList(cg.codegenList()),
			);
		});
		test.test('nonempty LIST.NEW', () => {
			const {stmts, cg, wasm, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				val mut x: int = 42;
				[x, 4.2, (null,), x/2, @e];
			}`);
			return assertEqualBins(
				VISITOR.visit(visitors.build.expr.visit((stmts[1] as AST.STMT.StatementExpression).expr!)),
				cg.vm.Value.fromList(cg.codegenList([
					wasm.local.get(0, cg.vm.reftypeNull.Value),
					genConst(cg, 4.2),
					wasm.local.get(1, cg.vm.reftypeNull.Value),
					wasm.local.get(2, cg.vm.reftypeNull.Value),
					genConst(cg, 'e', 'sym'),
				])),
			);
		});
		test.test('empty SET.NEW', () => {
			const {stmts, cg, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				{};
			}`);
			return assert.strictEqual(
				binaryen.emitText(VISITOR.visit(visitors.build.expr.visit((stmts[0] as AST.STMT.StatementExpression).expr!))),
				binaryen.emitText(cg.vm.Value.fromMap(cg.codegenSet())).replaceAll('$1', '$0'),
			);
		});
		test.test('nonempty SET.NEW', () => {
			const {stmts, cg, wasm, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				val mut x: int = 42;
				{x, 4.2, (null,), x/2, @e};
			}`);
			return assert.strictEqual(
				binaryen.emitText(VISITOR.visit(visitors.build.expr.visit((stmts[1] as AST.STMT.StatementExpression).expr!))),
				binaryen.emitText(cg.vm.Value.fromMap(cg.codegenSet([
					wasm.local.get(0, cg.vm.reftype.Value),
					genConst(cg, 4.2),
					wasm.local.get(1, cg.vm.reftype.Value),
					wasm.local.get(2, cg.vm.reftype.Value), // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
					genConst(cg, 'e', 'sym'),
				]))).replaceAll('$4', '$3'),
			);
		});
	});


	test.suite('RecordNew', () => {
		test.test('empty RECORD.NEW', () => {
			// there exists no syntax for empty records, so constructing it manually
			const cg = new CodeGenerator();
			return assertEqualBins(
				new OP.ValueVisitorCodegen(cg).visit(new OP.RecordNew(new Map(), new TYPE.Record())),
				cg.vm.Value.fromRecord(cg.codegenRecord()),
			);
		});
		test.test('nonempty RECORD.NEW', () => {
			const {stmts, cg, wasm, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				val mut x: int = 42;
				(a= x, b= 4.2, c= (null,), d= x/2, e= @e);
			}`);
			const id_a: bigint = Validator.keyId('a');
			const id_b: bigint = Validator.keyId('b');
			const id_c: bigint = Validator.keyId('c');
			const id_d: bigint = Validator.keyId('d');
			const id_e: bigint = Validator.keyId('e');
			return assertEqualBins(
				VISITOR.visit(visitors.build.expr.visit((stmts[1] as AST.STMT.StatementExpression).expr!)),
				cg.vm.Value.fromRecord(cg.codegenRecord(new Map([
					[id_a, cg.newProperty(id_a, wasm.local.get(0, cg.vm.reftype.Value))],
					[id_b, cg.newProperty(id_b, genConst(cg, 4.2))],
					[id_c, cg.newProperty(id_c, wasm.local.get(1, cg.vm.reftype.Value))],
					[id_d, cg.newProperty(id_d, wasm.local.get(2, cg.vm.reftype.Value))], // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
					[id_e, cg.newProperty(id_e, genConst(cg, Symbol(id_e.toString())))],
				]))),
			);
		});
		test.test('inserts keys in source order.', () => {
			const {stmts, cg, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				(a= 42, aa= false, b= 4.2);
				(aa= true, c= null, a= 42);
				(b= 42, bb= 4.2, bbb= null);
			}`);
			const id_b:   bigint = Validator.keyId('b');
			const id_c:   bigint = Validator.keyId('c');
			const id_a:   bigint = Validator.keyId('a');
			const id_bb:  bigint = Validator.keyId('bb');
			const id_aa:  bigint = Validator.keyId('aa');
			const id_bbb: bigint = Validator.keyId('bbb');
			return assertEqualBins(
				stmts.map((stmt) => VISITOR.visit(visitors.build.expr.visit((stmt as AST.STMT.StatementExpression).expr!))),
				[new Map([
					[id_a,  cg.newProperty(id_a,  genConst(cg, 42n))],
					[id_aa, cg.newProperty(id_aa, genConst(cg, false))],
					[id_b,  cg.newProperty(id_b,  genConst(cg, 4.2))],
				]), new Map([
					[id_aa, cg.newProperty(id_aa, genConst(cg, true))],
					[id_c,  cg.newProperty(id_c,  genConst(cg))],
					[id_a,  cg.newProperty(id_a,  genConst(cg, 42n))],
				]), new Map([
					[id_b,   cg.newProperty(id_b,   genConst(cg, 42n))],
					[id_bb,  cg.newProperty(id_bb,  genConst(cg, 4.2))],
					[id_bbb, cg.newProperty(id_bbb, genConst(cg))],
				])].map((props) => cg.vm.Value.fromRecord(cg.codegenRecord(props))),
			);
		});
	});


	test.suite('DictNew', () => {
		test.test('empty DICT.NEW', () => {
			// there exists no syntax for empty Dicts, so constructing it manually
			const cg = new CodeGenerator();
			return assertEqualBins(
				new OP.ValueVisitorCodegen(cg).visit(new OP.DictNew(new Map(), new TYPE.Dict(TYPE.INT))),
				cg.vm.Value.fromDict(cg.codegenDict()),
			);
		});
		test.test('nonempty DICT.NEW', () => {
			const {stmts, cg, wasm, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				val mut x: int = 42;
				[a= x, b= 4.2, c= (null,), d= x/2, e= @e];
			}`);
			const id_a: bigint = Validator.keyId('a');
			const id_b: bigint = Validator.keyId('b');
			const id_c: bigint = Validator.keyId('c');
			const id_d: bigint = Validator.keyId('d');
			const id_e: bigint = Validator.keyId('e');
			return assertEqualBins(
				VISITOR.visit(visitors.build.expr.visit((stmts[1] as AST.STMT.StatementExpression).expr!)),
				cg.vm.Value.fromDict(cg.codegenDict(new Map([
					[id_a, cg.newProperty(id_a, wasm.local.get(0, cg.vm.reftype.Value))],
					[id_b, cg.newProperty(id_b, genConst(cg, 4.2))],
					[id_c, cg.newProperty(id_c, wasm.local.get(1, cg.vm.reftype.Value))],
					[id_d, cg.newProperty(id_d, wasm.local.get(2, cg.vm.reftype.Value))],
					[id_e, cg.newProperty(id_e, genConst(cg, Symbol(id_e.toString())))],
				]))),
			);
		});
		test.test('inserts keys in source order.', () => {
			const {stmts, cg, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				[a= 42, aa= false, b= 4.2];
				[aa= true, c= null, a= 42];
				[b= 42, c= 4.2, aaa= null];
			}`);
			const id_b:   bigint = Validator.keyId('b');
			const id_c:   bigint = Validator.keyId('c');
			const id_a:   bigint = Validator.keyId('a');
			const id_aa:  bigint = Validator.keyId('aa');
			const id_aaa: bigint = Validator.keyId('aaa');
			return assertEqualBins(
				stmts.map((stmt) => VISITOR.visit(visitors.build.expr.visit((stmt as AST.STMT.StatementExpression).expr!))),
				[new Map([
					[id_a,  cg.newProperty(id_a,  genConst(cg, 42n))],
					[id_aa, cg.newProperty(id_aa, genConst(cg, false))],
					[id_b,  cg.newProperty(id_b,  genConst(cg, 4.2))],
				]), new Map([
					[id_aa, cg.newProperty(id_aa, genConst(cg, true))],
					[id_c,  cg.newProperty(id_c,  genConst(cg))],
					[id_a,  cg.newProperty(id_a,  genConst(cg, 42n))],
				]), new Map([
					[id_b,   cg.newProperty(id_b,   genConst(cg, 42n))],
					[id_c,   cg.newProperty(id_c,   genConst(cg, 4.2))],
					[id_aaa, cg.newProperty(id_aaa, genConst(cg))],
				])].map((props) => cg.vm.Value.fromDict(cg.codegenDict(props))),
			);
		});
	});


	test.suite('MapNew', () => {
		test.test('empty MAP.NEW', () => {
			// there exists no syntax for empty Maps, so constructing it manually
			const cg = new CodeGenerator();
			return assert.strictEqual(
				binaryen.emitText(new OP.ValueVisitorCodegen(cg).visit(new OP.MapNew(new Map(), new TYPE.Map(TYPE.INT, TYPE.FLOAT)))),
				binaryen.emitText(cg.vm.Value.fromMap(cg.codegenMap())).replaceAll('$1', '$0'),
			);
		});
		test.test('nonempty MAP.NEW', () => {
			const {stmts, cg, wasm, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				val mut x: int = 42;
				{1.1 -> x, 2.2 -> 4.2, 3.3 -> (null,), 4.4 -> x/2, 5.5 -> @e};
			}`);
			return assert.strictEqual(
				binaryen.emitText(VISITOR.visit(visitors.build.expr.visit((stmts[1] as AST.STMT.StatementExpression).expr!))),
				binaryen.emitText(cg.vm.Value.fromMap(cg.codegenMap(new Map([
					[genConst(cg, 1.1), wasm.local.get(0, cg.vm.reftype.Value)],
					[genConst(cg, 2.2), genConst(cg, 4.2)],
					[genConst(cg, 3.3), wasm.local.get(1, cg.vm.reftype.Value)],
					[genConst(cg, 4.4), wasm.local.get(2, cg.vm.reftype.Value)], // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
					[genConst(cg, 5.5), genConst(cg, 'e', 'sym')],
				])))).replaceAll('$4', '$3'),
			);
		});
	});


	test.test('ObjectNew', () => {
		const cg = new CodeGenerator();
		const {vm: {heaptype, reftype, Object: VmObject, Class: VmClass}, mod: {wasm}} = cg;
		const VISITOR = new OP.ValueVisitorCodegen(cg);

		/** The class named `Class` — it has a null `class_` field. */
		const the_class_class = new OP.ObjectNew(true);
		/** The class named `Object` — its `class_` field points to the class named `Class`. */
		const the_object_class = new OP.ObjectNew(true, the_class_class);
		/** A new Object instance — its `class_` field points to the class named `Object`. */
		const new_object = new OP.ObjectNew(false, the_object_class);

		const expected1: binaryen.ExpressionRef /* (ref $Class) */ = wasm.struct.new([
			wasm.ref.cast(VmClass.CLASS, reftype.Class),
			wasm.ref.null(heaptype.Dict),
			VmObject.ctrPlusPlus(),
		], heaptype.Class);

		return assertEqualBins([
			the_class_class,
			the_object_class,
			new_object,
		].map((opcode) => VISITOR.visit(opcode)), [
			VmClass.CLASS,
			expected1,
			wasm.struct.new([
				wasm.ref.cast(expected1, reftype.Class),
				wasm.ref.null(heaptype.Dict),
				VmObject.ctrPlusPlus(),
			], heaptype.Object),
		]);
	});


	test.test('ExcpNew', () => {
		const cg = new CodeGenerator();
		const {mod: {wasm}, vm: {reftype}} = cg;
		const VISITOR = new OP.ValueVisitorCodegen(cg);
		const actual = new OP.ExcpNew(new OP.Const(new VALUE.String('hello')));
		const expected: binaryen.ExpressionRef /* (ref $Exception) */ = cg.codegenException(wasm.ref.cast(genConst(cg, 'hello'), reftype.CplString));
		return assertEqualBins([
			actual,
			new OP.ExcpNew(new OP.Const(new VALUE.String('world')), actual),
		].map((opcode) => VISITOR.visit(opcode)), [
			expected,
			cg.codegenException(
				wasm.ref.cast(genConst(cg, 'world'), reftype.CplString),
				wasm.ref.cast(expected, reftype.Exception),
			),
		]);
	});


	test.test('MaybeNew', () => {
		const cg = new CodeGenerator();
		const VISITOR = new OP.ValueVisitorCodegen(cg);
		return assertEqualBins([
			new OP.MaybeNew(TYPE.STR),
			new OP.MaybeNew(TYPE.STR, new OP.Const(new VALUE.String('hello'))),
		].map((opcode) => VISITOR.visit(opcode)), [
			cg.codegenMaybe(),
			cg.codegenMaybe(new VALUE.String('hello').codegen(cg)),
		]);
	});


	test.test('ResultNew', () => {
		const cg = new CodeGenerator();
		const {mod: {wasm}, vm: {reftype}} = cg;
		const VISITOR = new OP.ValueVisitorCodegen(cg);
		const excp = new OP.ExcpNew(new OP.Const(new VALUE.String('message')));
		const value = new OP.Const(new VALUE.Integer(42n));
		return assertEqualBins([
			new OP.ResultNew(false, TYPE.INT, TYPE.EXCP, excp),
			new OP.ResultNew(true,  TYPE.INT, TYPE.EXCP, value),
		].map((opcode) => VISITOR.visit(opcode)), [
			cg.codegenResult(false, wasm.ref.cast(VISITOR.visit(excp), reftype.Exception)),
			cg.codegenResult(true, VISITOR.visit(value)),
		]);
	});


	test.test('TupleHas', () => {
		// there exists no syntax for Tuple has, so constructing it manually
		const tuple = new AST.ExprVisitorBuild(new Builder()).visit(AST.EXPR.Tuple.fromSource('(10, 20)'));
		const cg    = new CodeGenerator();
		const {vm: {Value}, mod: {wasm}} = cg;
		const VISITOR = new OP.ValueVisitorCodegen(cg);
		xjs.Array.forEachAggregated([1n, 2n], (idx) => assertEqualBins(
			VISITOR.visit(new OP.TupleHas(tuple, idx)),
			Value.boolFromI32(wasm.i32.lt_u(
				wasm.i32.const(Number(idx)),
				wasm.array.len(Value.asTuple(VISITOR.visit(tuple))),
			)),
		));
	});


	test.test('RecordHas', () => {
		// there exists no syntax for Record has, so constructing it manually
		const record = new AST.ExprVisitorBuild(new Builder()).visit(AST.EXPR.Record.fromSource('(a= 10, c= 20)'));
		const cg     = new CodeGenerator();
		const {vm: {Value, Record}, mod: {wasm}} = cg;
		const VISITOR = new OP.ValueVisitorCodegen(cg);
		return xjs.Array.forEachAggregated(['a', 'b'], (keysrc) => {
			const keyid: bigint = Validator.keyId(keysrc);
			return assertEqualBins(
				VISITOR.visit(new OP.RecordHas(record, {keyid, keysrc})),
				Value.boolFromI32(Record.hasKey(
					Value.asRecord(VISITOR.visit(record)),
					wasm.i64.const(keyid),
				)),
			);
		});
	});


	test.test('TupleGet returns (array.get).', () => {
		const {builder, cg, wasm, visitors} = setupScript(`{
			val mut x:   int                = 42;
			val mut tup: (int, int, ?: int) = (42, 43);

			(x, 43, 44).2;
			tup.0;
			tup.1;
		}`);
		const {reftype, Value} = cg.vm;
		return assertEqualBins(builder.instructions.slice(3).map((instr) => visitors.codegen.instr.visit(instr)), [
			wasm.drop(wasm.array.get(
				Value.asTuple(wasm.local.get(2, reftype.Value)),
				wasm.i32.const(2),
				reftype.Value,
			)),
			wasm.drop(wasm.array.get(
				Value.asTuple(wasm.local.get(1, reftype.Value)),
				wasm.i32.const(0),
				reftype.Value,
			)),
			wasm.drop(wasm.array.get(
				Value.asTuple(wasm.local.get(1, reftype.Value)),
				wasm.i32.const(1),
				reftype.Value,
			)),
		]);
	});


	test.test('RecordGet returns (call $Record.get).', () => {
		const {builder, cg, wasm, visitors} = setupScript(`{
			val mut x:   int                       = 42;
			val mut rec: (a: int, b: int, c?: int) = (a= 42, b= 43);

			(a= x, b= 43, c= 44).c;
			rec.a;
			rec.b;
		}`);
		const {reftype, Value, Record} = cg.vm;
		return assertEqualBins(builder.instructions.slice(3).map((instr) => visitors.codegen.instr.visit(instr)), [
			wasm.drop(Record.get(
				Value.asRecord(wasm.local.get(2, reftype.Value)),
				wasm.i64.const(Validator.keyId('c')),
			)),
			wasm.drop(Record.get(
				Value.asRecord(wasm.local.get(1, reftype.Value)),
				wasm.i64.const(Validator.keyId('a')),
			)),
			wasm.drop(Record.get(
				Value.asRecord(wasm.local.get(1, reftype.Value)),
				wasm.i64.const(Validator.keyId('b')),
			)),
		]);
	});


	test.suite('CollectionDynamicGet', () => {
		test.test('LIST.GET', () => {
			const {builder, cg, wasm, visitors} = setupScript(`{
				val mut x:    int   = 42;
				val mut list: [int] = [42, 43];

				[x, 43, 44].[1 + 1];
				list.[0];
				list.[3];
				list.[-1];
			}`);
			const {reftype, Vect, Value, List} = cg.vm;
			const list_cast: binaryen.ExpressionRef = Value.asList(wasm.local.get(1, reftype.Value));
			return assertEqualBins(builder.instructions.slice(4).map((instr) => visitors.codegen.instr.visit(instr)), [
				wasm.drop(List.get(
					Value.asList(wasm.local.get(2, reftype.Value)),
					wasm.i32.wrap(Vect.asInt(Value.asPrimitive(wasm.local.get(3, reftype.Value)))),
				)),
				wasm.drop(List.get(
					list_cast,
					wasm.i32.wrap_i64(Vect.asInt(Value.asPrimitive(genConst(cg, 0n)))),
				)),
				wasm.drop(List.get(
					list_cast,
					wasm.i32.wrap_i64(Vect.asInt(Value.asPrimitive(genConst(cg, 3n)))),
				)),
				wasm.drop(List.get(
					list_cast,
					wasm.i32.wrap_i64(Vect.asInt(Value.asPrimitive(genConst(cg, -1n)))),
				)),
			]);
		});
		test.test('DICT.GET', () => {
			const {builder, cg, wasm, visitors} = setupScript(`{
				val mut x:    int    = 42;
				val mut dict: [:int] = [a= 42, c= 43];

				[a= x, b= 43, c= 44].[@b];
				dict.[@a];
				dict.[@c];
			}`);
			const {reftype, Vect, Value, Dict} = cg.vm;
			const dict_cast: binaryen.ExpressionRef = Value.asDict(wasm.local.get(1, reftype.Value));
			return assertEqualBins(builder.instructions.slice(3).map((instr) => visitors.codegen.instr.visit(instr)), [
				wasm.drop(Dict.get(
					Value.asDict(wasm.local.get(2, reftype.Value)),
					Vect.asNat(Value.asPrimitive(genConst(cg, 'b', 'sym'))),
				)),
				wasm.drop(Dict.get(
					dict_cast,
					Vect.asNat(Value.asPrimitive(genConst(cg, 'a', 'sym'))),
				)),
				wasm.drop(Dict.get(
					dict_cast,
					Vect.asNat(Value.asPrimitive(genConst(cg, 'c', 'sym'))),
				)),
			]);
		});
		test.test('SET.GET', () => {
			const {builder, cg, wasm, visitors} = setupScript(`{
				val 'set': {float} = {4.2, 2.4};
				'set'.[4.2];
				'set'.[3.3];
			}`);
			const {reftype, reftypeNull, Value, Case, Map: VmMap} = cg.vm;
			const base:         binaryen.ExpressionRef = wasm.local.get(1, reftype.Value); // index 0 = nonempty map setup (implementation of Set)
			const nullish_case_0: binaryen.ExpressionRef = wasm.local.get(2, reftypeNull.Case);
			const nullish_case_1: binaryen.ExpressionRef = wasm.local.get(3, reftypeNull.Case);
			return assertEqualBins(builder.instructions.slice(1).map((instr) => visitors.codegen.instr.visit(instr)), [
				wasm.drop(wasm.block(null, [
					wasm.local.set(2, wasm.tuple.extract(VmMap.find(
						Value.asMap(base),
						genConst(cg, 4.2),
					), 1)),
					wasm.if(
						wasm.i32.or(
							wasm.ref.is_null(nullish_case_0),
							wasm.ref.eq(nullish_case_0, Case.TOMBSTONE),
						),
						genConst(cg, false),
						genConst(cg, true),
					),
				], reftype.Value)),
				wasm.drop(wasm.block(null, [
					wasm.local.set(3, wasm.tuple.extract(VmMap.find(
						Value.asMap(base),
						genConst(cg, 3.3),
					), 1)),
					wasm.if(
						wasm.i32.or(
							wasm.ref.is_null(nullish_case_1),
							wasm.ref.eq(nullish_case_1, Case.TOMBSTONE),
						),
						genConst(cg, false),
						genConst(cg, true),
					),
				], reftype.Value)),
			]);
		});
		test.test('MAP.GET', () => {
			const {builder, cg, wasm, visitors} = setupScript(`{
				val map: {float -> int} = {4.2 -> 42, 2.4 -> 24};
				map.[4.2];
				map.[3.3];
			}`);
			const {reftype, Value, Map: VmMap} = cg.vm;
			const map_cast: binaryen.ExpressionRef = Value.asMap(wasm.local.get(1, reftype.Value)); // index 0 = nonempty map setup
			return assertEqualBins(builder.instructions.slice(1).map((instr) => visitors.codegen.instr.visit(instr)), [
				wasm.drop(VmMap.get(
					map_cast,
					genConst(cg, 4.2),
				)),
				wasm.drop(VmMap.get(
					map_cast,
					genConst(cg, 3.3),
				)),
			]);
		});
	});


	test.suite('Unop', () => {
		test.test('Returns custom WASM functions.', () => {
			const {stmts, cg, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				Boolean.(null);
				Boolean.(false);
				Boolean.(true);
				Boolean.(@hello);
				Boolean.(-0);
				Boolean.(-42);
				Boolean.(+0);
				Boolean.(+42);
				Boolean.(0.0);
				Boolean.(4.2);
				Boolean.("hello");

				Integer.(+42);
				Integer.(4.2);
				Natural.(42);
				Natural.(4.2);
				Float.(+42);
				Float.(42);

				String.(null);
				String.(42);
				String.("hello");

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
			}`, {codegen: false});
			const id_hello = Validator.keyId('hello');
			return assertEqualBins(
				stmts.map((stmt) => VISITOR.visit(visitors.build.expr.visit((stmt as AST.STMT.StatementExpression).expr!))),
				[
					cg.vm.op.not(cg.vm.op.not(genConst(cg, null))),
					cg.vm.op.not(cg.vm.op.not(genConst(cg, false))),
					cg.vm.op.not(cg.vm.op.not(genConst(cg, true))),
					cg.vm.op.not(cg.vm.op.not(genConst(cg, Symbol(id_hello.toString())))),
					cg.vm.op.not(cg.vm.op.not(genConst(cg, -0n))),
					cg.vm.op.not(cg.vm.op.not(genConst(cg, -42n))),
					cg.vm.op.not(cg.vm.op.not(genConst(cg, 0n, 'nat'))),
					cg.vm.op.not(cg.vm.op.not(genConst(cg, 42n, 'nat'))),
					cg.vm.op.not(cg.vm.op.not(genConst(cg, 0.0))),
					cg.vm.op.not(cg.vm.op.not(genConst(cg, 4.2))),
					cg.vm.op.not(cg.vm.op.not(genConst(cg, 'hello'))),

					cg.vm.op.toInt(genConst(cg, 42n, 'nat')),
					cg.vm.op.toInt(genConst(cg, 4.2)),
					cg.vm.op.toNat(genConst(cg, 42n)),
					cg.vm.op.toNat(genConst(cg, 4.2)),
					cg.vm.op.toFloat(genConst(cg, 42n, 'nat')),
					cg.vm.op.toFloat(genConst(cg, 42n)),

					cg.vm.op.toStr(genConst(cg)),
					cg.vm.op.toStr(genConst(cg, 42n)),
					cg.vm.op.toStr(genConst(cg, 'hello')),

					cg.vm.op.not(genConst(cg)),
					cg.vm.op.not(genConst(cg, false)),
					cg.vm.op.not(genConst(cg, Symbol(id_hello.toString()))),
					cg.vm.op.not(genConst(cg, 42n)),
					cg.vm.op.not(genConst(cg, 4.2)),

					cg.vm.op.isEmpty(genConst(cg)),
					cg.vm.op.isEmpty(genConst(cg, false)),
					cg.vm.op.isEmpty(genConst(cg, Symbol(id_hello.toString()))),
					cg.vm.op.isEmpty(genConst(cg, 42n)),
					cg.vm.op.isEmpty(genConst(cg, 4.2)),

					cg.vm.op.negate(genConst(cg, 42n)),
					cg.vm.op.negate(genConst(cg, 4.2)),
				],
			);
		});
		test.test('LIST.COUNT', () => {
			const {stmts, cg, wasm, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				val mut x: int = 42;
				val list: [int] = [x, 43, 44];
				list;
			}`);
			const {Vect, Value, List} = cg.vm;
			// there exists no syntax for List count, so constructing it manually
			const list = visitors.build.expr.visit((stmts[2] as AST.STMT.StatementExpression).expr!) as OP.Get;
			const unop = new OP.Unop(OP.OpCode.LIST_COUNT, list, TYPE.NAT);
			return assertEqualBins(
				VISITOR.visit(unop),
				Value.fromNat(Vect.newNat(wasm.i64.extend_i32_u(List.count(Value.asList(VISITOR.visit(list)))))),
			);
		});
		test.test('DICT.COUNT', () => {
			const {stmts, cg, wasm, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				val mut x: int = 42;
				val dict: [:int] = [a= x, b= 43, c= 44];
				dict;
			}`);
			const {Vect, Value, Dict} = cg.vm;
			// there exists no syntax for Dict count, so constructing it manually
			const dict = visitors.build.expr.visit((stmts[2] as AST.STMT.StatementExpression).expr!) as OP.Get;
			const unop = new OP.Unop(OP.OpCode.DICT_COUNT, dict, TYPE.NAT);
			return assertEqualBins(
				VISITOR.visit(unop),
				Value.fromNat(Vect.newNat(wasm.i64.extend_i32_u(Dict.count(Value.asDict(VISITOR.visit(dict)))))),
			);
		});
		test.test('SET.COUNT', () => {
			const {stmts, cg, wasm, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				val mut x: int = 42;
				val 'set': {int} = {x, 43, 44};
				'set';
			}`);
			const {Vect, Value, Map: VmMap} = cg.vm;
			// there exists no syntax for Set count, so constructing it manually
			const set  = visitors.build.expr.visit((stmts[2] as AST.STMT.StatementExpression).expr!) as OP.Get;
			const unop = new OP.Unop(OP.OpCode.SET_COUNT, set, TYPE.NAT);
			return assertEqualBins(
				VISITOR.visit(unop),
				Value.fromNat(Vect.newNat(wasm.i64.extend_i32_u(VmMap.count(Value.asMap(VISITOR.visit(set)))))),
			);
		});
		test.test('MAP.COUNT', () => {
			const {stmts, cg, wasm, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				val mut x: int = 42;
				val map: {float -> int} = {1.1 -> x, 2.2 -> 43, 3.3 -> 44};
				map;
			}`);
			const {Vect, Value, Map: VmMap} = cg.vm;
			// there exists no syntax for Map count, so constructing it manually
			const map  = visitors.build.expr.visit((stmts[2] as AST.STMT.StatementExpression).expr!) as OP.Get;
			const unop = new OP.Unop(OP.OpCode.MAP_COUNT, map, TYPE.NAT);
			return assertEqualBins(
				VISITOR.visit(unop),
				Value.fromNat(Vect.newNat(wasm.i64.extend_i32_u(VmMap.count(Value.asMap(VISITOR.visit(map)))))),
			);
		});
		test.suite('instance of None/Fail.', () => {
			([OP.OpCode.NONE_IS, OP.OpCode.FAIL_IS] as const).forEach((operator, i) => {
				test.test(`[operator=${OP.OpCode[operator]}]`, () => {
					const {stmts, cg, wasm, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
						val mut a?: str;
						val mut b?: str;
						set b = "hello";
						val c: str? = None.<str>();
						val d: str? = Some.<str>("world");
						val e: int! = Fail.<int>(Exception.("message"));
						val f: int! = Ok.<int>(42);
						a;
						b;
						c;
						d;
						e;
						f;
					}`);
					const {reftype, op} = cg.vm;
					// there exists no syntax for “is None”/“is Fail”, so constructing it manually
					return assertEqualBins(stmts.slice(7).map((stmt) => VISITOR.visit(new OP.Unop(
						operator,
						visitors.build.expr.visit((stmt as AST.STMT.StatementExpression).expr!) as OP.Get,
						TYPE.BOOL,
					))), [0, 1, 2, 3, 5, 6].map((j) => [op.isNone, op.isFail][i](wasm.local.get(j, reftype.Value)))); // local index 4 is the decl for the Exception argument
				});
			});
		});
		test.test('MAYBE.UNWRAP', () => {
			const {builder, cg, wasm, visitors} = setupScript(`{
				val mut x?: str;
				val mut y?: int;
				set y = 42;
				x~?;
				y~?;
			}`);
			const {reftype, op} = cg.vm;
			return assertEqualBins(builder.instructions.map((instr) => visitors.codegen.instr.visit(instr)), [
				wasm.local.set(0, cg.codegenMaybe()),
				wasm.local.set(1, cg.codegenMaybe()),
				wasm.local.set(1, cg.codegenMaybe(genConst(cg, 42n))),
				wasm.drop(op.unwrapMaybe(wasm.local.get(0, reftype.Value))),
				wasm.drop(op.unwrapMaybe(wasm.local.get(1, reftype.Value))),
			]);
		});
		test.test('RESULT.UNWRAP', () => {
			const {builder, cg, wasm, visitors} = setupScript(`{
				val x: int! = Fail.<int>(Exception.("42"));
				val y: Result.<nat> = Ok.<nat>(+42);
				val z: Result.<float, Exception> = Ok.<float>(4.2);
				x~!;
				y~!;
				z~!;
			}`);
			const {reftype, op} = cg.vm;
			const excp: binaryen.ExpressionRef /* (ref $Exception) */ = cg.codegenException(wasm.ref.cast(genConst(cg, '42'), reftype.CplString));
			return assertEqualBins(builder.instructions.map((instr) => visitors.codegen.instr.visit(instr)), [
				wasm.local.set(0, excp),
				wasm.local.set(1, cg.codegenResult(false, wasm.ref.cast(wasm.local.get(0, binaryen.getExpressionType(excp)), reftype.Exception))), // HACK: issue with struct literals having “exact” types prevents passing `reftype.Exception` to `local.get()`
				wasm.local.set(2, cg.codegenResult(true, genConst(cg, 42n, 'nat'))),
				wasm.local.set(3, cg.codegenResult(true, genConst(cg, 4.2))),
				...[1, 2, 3].map((i) => wasm.drop(op.unwrapResult(wasm.local.get(i, reftype.Value)))),
			]);
		});
		test.test('RESULT.EXTRACT', () => {
			const {stmts, cg, wasm, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
				val x: int! = Fail.<int>(Exception.("42"));
				val y: Result.<nat> = Ok.<nat>(+42);
				val z: Result.<float, Exception> = Ok.<float>(4.2);
				x;
				y;
				z;
			}`);
			const {reftype, op} = cg.vm;
			// there exists no syntax for Result extract, so constructing it manually
			return assertEqualBins([3, 4, 5].map((i) => VISITOR.visit(new OP.Unop(
				OP.OpCode.RESULT_EXTRACT,
				visitors.build.expr.visit((stmts[i] as AST.STMT.StatementExpression).expr!) as OP.Get,
				TYPE.EXCP,
			))), [1, 2, 3].map((i) => op.extractResult(wasm.local.get(i, reftype.Value))));
		});
	});


	test.suite('Binop', () => {
		test.test('custom WASM arithmetic/comparative functions.', () => {
			const {stmts, cg, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
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
				stmts.map((stmt) => VISITOR.visit(visitors.build.expr.visit((stmt as AST.STMT.StatementExpression).expr!))),
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
		test.test('[operator=IS]', () => {
			const {builder, cg, wasm, visitors} = setupScript(`{
				${CORE_LIB_NAMES.map((classname) => `null is ${classname};`).join('\n')};
			}`);
			const {vm: {op, Class: VmClass}} = cg;
			const operand: binaryen.ExpressionRef = genConst(cg);
			return assertEqualBins(builder.instructions.map((instr) => visitors.codegen.instr.visit(instr)), [
				VmClass.NULL,
				VmClass.BOOLEAN,
				VmClass.SYMBOL,
				VmClass.INTEGER,
				VmClass.NATURAL,
				VmClass.FLOAT,
				VmClass.STRING,
				VmClass.OBJECT,
				VmClass.LIST,
				VmClass.DICT,
				VmClass.SET,
				VmClass.MAP,
				VmClass.EXCEPTION,
				VmClass.MAYBE,
				VmClass.NONE,
				VmClass.SOME,
				VmClass.RESULT,
				VmClass.FAIL,
				VmClass.OK,
				VmClass.FUNCTION,
				VmClass.CLASS,
			].map((klass) => wasm.drop(op.is(operand, klass))));
		});
	});


	test.test('OpFunction', () => {
		const {stmts, cg, visitors, visitors: {codegen: {value: VISITOR}}} = setupScript(`{
			\\(x: int, $y: int, zulu= z: int): void {
				x * y + z;
				return;
			};
		}`, {codegen: false});
		const op_fn: OP.Value = visitors.build.expr.visit((stmts[0] as AST.STMT.StatementExpression).expr!);
		assert_instanceof(op_fn, OP.Function);
		return assertEqualBins(
			VISITOR.visit(op_fn),
			cg.vm.Value.fromClosure(new CodeGenerator().codegenClosure('', 3n, op_fn.builder)), // new CodeGenerator resets the count
		);
	});
});

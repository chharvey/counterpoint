import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	Validator,
	AST,
	VALUE,
	TYPE,
	CLASS_CLASS,
	CoreLibName,
	Builder,
	Interpreter,
	OP,
} from '../../../src/index.ts';
import {
	extract_lines,
	repeat,
	assert_equal_values,
	setupScript,
} from '../../utils.ts';



test.suite('ValueVisitorInterpret#visit', () => {
	function interpret_extracted_drops(src: string): VALUE.Value[] {
		const interp = new Interpreter();
		setupScript(src, {codegen: false}).builder.interpret(interp);
		return interp.drops;
	}

	const VALUE_FLOAT_0  = new VALUE.Float();
	const VALUE_FLOAT_N0 = new VALUE.Float(-0.0);


	test.test('Trap always throws.', () => {
		assert.throws(() => new OP.ValueVisitorInterpret(new Interpreter()).visit(new OP.Trap()), /Trap\./);
	});


	test.test('Const returns interpreter value.', () => {
		const VISITOR = new OP.ValueVisitorInterpret(new Interpreter());
		xjs.Array.forEachAggregated([
			VALUE.NULL,
			VALUE.FALSE,
			VALUE.TRUE,
			VALUE.INT_0,
			VALUE.NAT_0,
			new VALUE.Symbol(0x100n, 'hello'),
			new VALUE.Integer(42n),
			new VALUE.Natural(42n),
			new VALUE.Float(4.2),
			new VALUE.String('hello'),
		], (val) => assert.ok(VISITOR.visit(new OP.Const(val)).identical(val)));
	});


	test.suite('Get', () => {
		test.test('variables return interpreter’s symbol table value.', () => {
			assert_equal_values(interpret_extracted_drops(`{
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
			}`), [
				VALUE.NULL,
				VALUE.FALSE,
				new VALUE.Symbol(Validator.keyId('hello'), 'hello'),
				new VALUE.Integer(42n),
				new VALUE.Float(4.2),
				new VALUE.None(TYPE.STR),
			]);
		});
		test.test('core lib classes return native class wrappers.', () => {
			assert_equal_values(interpret_extracted_drops(`{
				${[
					CoreLibName.NULL,
					CoreLibName.BOOLEAN,
					CoreLibName.SYMBOL,
					CoreLibName.INTEGER,
					CoreLibName.NATURAL,
					CoreLibName.FLOAT,
					CoreLibName.STRING,
					CoreLibName.OBJECT,
					CoreLibName.LIST,
					CoreLibName.DICT,
					CoreLibName.SET,
					CoreLibName.MAP,
					CoreLibName.EXCEPTION,
					CoreLibName.MAYBE,
					CoreLibName.NONE,
					CoreLibName.SOME,
					CoreLibName.RESULT,
					CoreLibName.FAIL,
					CoreLibName.OK,
					CoreLibName.FUNCTION,
					CoreLibName.CLASS,
				].join(';')};
			}`), [...new Map<TYPE.Type, VALUE.Class['nativeClass']>([
				[TYPE.NULL,                                  VALUE.Null],
				[TYPE.BOOL,                                  VALUE.Boolean],
				[TYPE.SYM,                                   VALUE.Symbol],
				[TYPE.INT,                                   VALUE.Integer],
				[TYPE.NAT,                                   VALUE.Natural],
				[TYPE.FLOAT,                                 VALUE.Float],
				[TYPE.STR,                                   VALUE.String],
				[TYPE.OBJ,                                   VALUE.Object],
				[new TYPE.List(TYPE.ANYTHING),               VALUE.List],
				[new TYPE.Dict(TYPE.ANYTHING),               VALUE.Dict],
				[new TYPE.Set(TYPE.ANYTHING),                VALUE.Set],
				[new TYPE.Map(TYPE.ANYTHING, TYPE.ANYTHING), VALUE.Map],
				[TYPE.EXCP,                                  VALUE.Exception],
				[new TYPE.Maybe(TYPE.ANYTHING),              VALUE.Maybe],
				[new TYPE.None(TYPE.ANYTHING),               VALUE.None],
				[new TYPE.Some(TYPE.ANYTHING),               VALUE.Some],
				[new TYPE.Result(TYPE.ANYTHING),             VALUE.Result],
				[new TYPE.Fail(TYPE.ANYTHING),               VALUE.Fail],
				[new TYPE.Ok(TYPE.ANYTHING),                 VALUE.Ok],
				[TYPE.FUNCTION,                              VALUE.Function],
				[TYPE.CLASS,                                 VALUE.Class],
			])].map(([t, c]) => new VALUE.Class(t, c)));
		});
	});


	test.test('Template interprets each child, stringifies, and concatenates.', () => {
		assert_equal_values(interpret_extracted_drops(`{
			val mut x: int = 85;

			"""42😀""";
			"""the answer is {{7 * 3 * 2}} but what is the question?""";
			"""the answer is {{x / 2}} but what is the question?""";
		}`), [
			new VALUE.String('42😀'),
			new VALUE.String('the answer is 42 but what is the question?'),
			new VALUE.String('the answer is 42 but what is the question?'),
		]);
	});


	test.test('CollectionLinearNew, RecordNew, DictNew, MapNew', () => {
		const expected_items = [
			VALUE.INT_1,
			new VALUE.Float(2.0),
			new VALUE.String('three'),
		];
		const expected_pairs = [
			[Validator.keyId('a'), expected_items[0]],
			[Validator.keyId('b'), expected_items[1]],
			[Validator.keyId('c'), expected_items[2]],
		] as const;
		return assert_equal_values(interpret_extracted_drops(`{
			(1, 2.0, "three");
			[1, 2.0, "three"];
			{1, 2.0, "three"};

			(a= 1, b= 2.0, c= "three");
			[a= 1, b= 2.0, c= "three"];

			{
				"a" || "" -> 1,
				21 + 21   -> 2.0,
				1.5 * 2.0 -> "three",
			};
		}`), [
			new VALUE.Tuple(expected_items),
			new VALUE.List(expected_items),
			new VALUE.Set(new Set<VALUE.Value>(expected_items)),
			new VALUE.Record(new Map<bigint, VALUE.Value>(expected_pairs)),
			new VALUE.Dict(new Map<bigint, VALUE.Value>(expected_pairs)),
			new VALUE.Map(new Map<VALUE.Value, VALUE.Value>([
				[new VALUE.String('a'),  expected_items[0]],
				[new VALUE.Integer(42n), expected_items[1]],
				[new VALUE.Float(3.0),   expected_items[2]],
			])),
		]);
	});


	test.test('ObjectNew', () => {
		const builder      = new Builder();
		const interp       = new Interpreter();
		const code_visitor = new OP.OpcodeVisitorInterpret(interp);

		/** The class named `Class` — it has a null `class_` field. */
		const the_class_class = new OP.ObjectNew(true);
		/** The class named `Object` — its `class_` field points to the class named `Class`. */
		const the_object_class = new OP.ObjectNew(true, the_class_class);
		/** A new Object instance — its `class_` field points to the class named `Object`. */
		const new_object = new OP.ObjectNew(false, the_object_class);

		builder.pushInstruction(new OP.Drop(the_class_class));
		builder.pushInstruction(new OP.Drop(the_object_class));
		builder.pushInstruction(new OP.Drop(new_object));

		builder.instructions.forEach((instr) => code_visitor.visit(instr));
		assert_instanceof(interp.drops[0], VALUE.Class);
		assert_instanceof(interp.drops[1], VALUE.Class);
		assert_instanceof(interp.drops[2], VALUE.Object);
		return assert.deepStrictEqual(interp.drops, [
			CLASS_CLASS,
			// @ts-expect-error --- deprecated usage
			new VALUE.Class(TYPE.OBJ, interp.drops[0]),
			new VALUE.Object(0n, interp.drops[1]),
		]);
	});


	test.test('ExcpNew', () => {
		assert_equal_values(interpret_extracted_drops(`{
			Exception.("message");
			Exception.("message", Exception.("cause"));
		}`), [
			new VALUE.Exception(new VALUE.String('message')),
			new VALUE.Exception(new VALUE.String('message'), new VALUE.Exception(new VALUE.String('cause'))),
		]);
	});


	test.test('MaybeNew', () => {
		const VISITOR = new OP.ValueVisitorInterpret(new Interpreter());
		return assert_equal_values([
			new OP.MaybeNew(TYPE.STR),
			new OP.MaybeNew(TYPE.STR, new OP.Const(new VALUE.String('hello'))),
		].map((opcode) => VISITOR.visit(opcode)), [
			new VALUE.None(TYPE.STR),
			new VALUE.Some(new VALUE.String('hello')),
		]);
	});


	test.test('ResultNew', () => {
		const VISITOR = new OP.ValueVisitorInterpret(new Interpreter());
		return assert_equal_values([
			new OP.ResultNew(false, TYPE.INT, TYPE.EXCP, new OP.ExcpNew(new OP.Const(new VALUE.String('message')))),
			new OP.ResultNew(true,  TYPE.INT, TYPE.EXCP, new OP.Const(new VALUE.Integer(42n))),
		].map((opcode) => VISITOR.visit(opcode)), [
			new VALUE.Fail(TYPE.INT, new VALUE.Exception(new VALUE.String('message'))),
			new VALUE.Ok(new VALUE.Integer(42n)),
		]);
	});


	test.test('TupleHas', () => {
		// there exists no syntax for Tuple has, so constructing it manually
		const tuple: OP.Value = new AST.ExprVisitorBuild(new Builder()).visit(AST.EXPR.Tuple.fromSource('(10, 20)'));
		const VISITOR         = new OP.ValueVisitorInterpret(new Interpreter());
		return assert_equal_values(new Map<VALUE.Value, VALUE.Boolean>([
			[VISITOR.visit(new OP.TupleHas(tuple, 1n)), VALUE.TRUE],
			[VISITOR.visit(new OP.TupleHas(tuple, 2n)), VALUE.FALSE],
		]));
	});


	test.test('RecordHas', () => {
		// there exists no syntax for Record has, so constructing it manually
		const record: OP.Value = new AST.ExprVisitorBuild(new Builder()).visit(AST.EXPR.Record.fromSource('(a= 10, c= 20)'));
		const VISITOR          = new OP.ValueVisitorInterpret(new Interpreter());
		return assert_equal_values(new Map<VALUE.Value, VALUE.Boolean>([
			[VISITOR.visit(new OP.RecordHas(record, {keyid: Validator.keyId('a'), keysrc: 'a'})), VALUE.TRUE],
			[VISITOR.visit(new OP.RecordHas(record, {keyid: Validator.keyId('b'), keysrc: 'b'})), VALUE.FALSE],
		]));
	});


	test.test('TupleGet, RecordGet', () => {
		assert_equal_values(interpret_extracted_drops(`{
			val     tup_fixed:   (int, float, str) = (1, 2.0, "three");
			val mut tup_unfixed: (int, float, str) = (1, 2.0, "three");

			val     rec_fixed:   (a: int, b: float, _: str) = (a= 1, b= 2.0, _= "three");
			val mut rec_unfixed: (a: int, b: float, _: str) = (a= 1, b= 2.0, _= "three");

			tup_fixed.0;    % value \`1\`
			tup_fixed.1;    % value \`2.0\`
			tup_fixed.2;    % value \`"three"\`
			tup_unfixed.0;  % value \`1\`
			tup_unfixed.1;  % value \`2.0\`
			tup_unfixed.2;  % value \`"three"\`

			rec_fixed.a;   % value \`1\`
			rec_fixed.b;   % value \`2.0\`
			rec_fixed._;   % value \`"three"\`
			rec_unfixed.a; % value \`1\`
			rec_unfixed.b; % value \`2.0\`
			rec_unfixed._; % value \`"three"\`
		}`), repeat([
			VALUE.INT_1,
			new VALUE.Float(2.0),
			new VALUE.String('three'),
		], 4).flat());
	});


	test.test('CollectionDynamicGet', () => {
		const expected_items = [
			VALUE.INT_1,
			new VALUE.Float(2.0),
			new VALUE.String('three'),
		];
		assert_equal_values(interpret_extracted_drops(`{
			val     list_fixed:   List.<     int | float | str> = [   1,    2.0,    "three"];
			val     dict_fixed:   Dict.<     int | float | str> = [a= 1, b= 2.0, c= "three"];
			val     set_fixed:    Set .<     int | float | str> = {1, 2.0, "three"};
			val     map_fixed:    Map .<str, int | float | str> = {"a" -> 1, "b" -> 2.0, "c" -> "three"};
			val mut list_unfixed: List.<     int | float | str> = list_fixed;
			val mut dict_unfixed: Dict.<     int | float | str> = dict_fixed;
			val mut set_unfixed:  Set .<     int | float | str> = set_fixed;
			val mut map_unfixed:  Map .<str, int | float | str> = map_fixed;

			list_fixed.[0];      % value \`1\`
			list_fixed.[1];      % value \`2.0\`
			list_fixed.[+2];     % value \`"three"\`
			dict_fixed.[@a];     % value \`1\`
			dict_fixed.[@b];     % value \`2.0\`
			dict_fixed.[@c];     % value \`"three"\`
			set_fixed.[1];       % value \`true\`
			set_fixed.[2.0];     % value \`true\`
			set_fixed.["three"]; % value \`true\`
			map_fixed.["a"];     % value \`1\`
			map_fixed.["b"];     % value \`2.0\`
			map_fixed.["c"];     % value \`"three"\`

			list_unfixed.[0];      % value \`1\`
			list_unfixed.[1];      % value \`2.0\`
			list_unfixed.[+2];     % value \`"three"\`
			dict_unfixed.[@a];     % value \`1\`
			dict_unfixed.[@b];     % value \`2.0\`
			dict_unfixed.[@c];     % value \`"three"\`
			set_unfixed.[1];       % value \`true\`
			set_unfixed.[2.0];     % value \`true\`
			set_unfixed.["three"]; % value \`true\`
			map_unfixed.["a"];     % value \`1\`
			map_unfixed.["b"];     % value \`2.0\`
			map_unfixed.["c"];     % value \`"three"\`
		}`), repeat([
			...expected_items,
			...expected_items,
			...repeat(VALUE.TRUE, 3),
			...expected_items,
		], 2).flat());
	});


	test.test.todo('Call', () => undefined);


	test.suite('Unop', () => {
		const operands: readonly string[] = extract_lines`
			null
			false
			true
			0
			42
			0.0
			-0.0
			4.2e+1
			+0
			+42
			""
			"hello"
			()
			(42,)
			(a= 42)
			[]
			[42]
			[a= 42]
			{}
			{42}
			{41 -> 42}
		`;
		function interpret_unops(op: string, tested: readonly string[] = operands): VALUE.Value[] {
			return interpret_extracted_drops(`{
				${tested.map((operand) => `${op} ${operand};`).join('\n')}
			}`);
		}
		function interpret_calls(ctor: string, tested: readonly string[] = operands): VALUE.Value[] {
			return interpret_extracted_drops(`{
				${tested.map((operand) => `${ctor}.(${operand});`).join('\n')}
			}`);
		}
		test.test('[operator=BOOL_FROM]', () => {
			assert_equal_values(interpret_calls('Boolean', operands), [
				...repeat(VALUE.FALSE, 2),
				...repeat(VALUE.TRUE, 19),
			]);
		});
		test.test('[operator=INT_FROM]', () => {
			assert_equal_values(interpret_calls('Integer', operands.slice(3, 10)), [
				VALUE.INT_0,
				new VALUE.Integer(42n),
				VALUE.INT_0,
				VALUE.INT_0,
				new VALUE.Integer(42n),
				VALUE.INT_0,
				new VALUE.Integer(42n),
			]);
		});
		test.test('[operator=NAT_FROM]', () => {
			assert_equal_values(interpret_calls('Natural', operands.slice(3, 10)), [
				VALUE.NAT_0,
				new VALUE.Natural(42n),
				VALUE.NAT_0,
				VALUE.NAT_0,
				new VALUE.Natural(42n),
				VALUE.NAT_0,
				new VALUE.Natural(42n),
			]);
		});
		test.test('[operator=FLOAT_FROM]', () => {
			assert_equal_values(interpret_calls('Float', operands.slice(3, 10)), [
				VALUE_FLOAT_0,
				new VALUE.Float(42.0),
				VALUE_FLOAT_0,
				VALUE_FLOAT_N0,
				new VALUE.Float(4.2e+1),
				VALUE_FLOAT_0,
				new VALUE.Float(42.0),
			]);
		});
		test.test('[operator=NOT]', () => {
			assert_equal_values(interpret_unops('!'), [
				...repeat(VALUE.TRUE, 2),
				...repeat(VALUE.FALSE, 19),
			]);
		});
		test.test('[operator=EMP]', () => {
			assert_equal_values(interpret_unops('?'), [
				VALUE.TRUE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.FALSE,
			]);
		});
		test.test('[operator=NEG]', () => {
			assert_equal_values(interpret_unops('-', operands.slice(3, 8)), [
				VALUE.INT_0,
				new VALUE.Integer(-42n),
				VALUE_FLOAT_N0,
				VALUE_FLOAT_0,
				new VALUE.Float(-4.2e+1),
			]);
		});
		test.test('[operator={LIST,DICT,SET,MAP}_COUNT]', () => {
			const builder      = new Builder();
			const interp       = new Interpreter();
			const code_visitor = new OP.OpcodeVisitorInterpret(interp);
			const items: readonly OP.ValueTac[] = [
				new OP.Const(VALUE.INT_1),
				new OP.Const(new VALUE.Float(2.0)),
				new OP.Const(new VALUE.String('three')),
			];
			builder.pushInstruction(new OP.Drop(new OP.Unop(
				OP.OpCode.LIST_COUNT,
				new OP.CollectionLinearNew(OP.TypeName.LIST, items, new TYPE.List(TYPE.ANYTHING)).asTac(builder),
				TYPE.NAT,
			)));
			builder.pushInstruction(new OP.Drop(new OP.Unop(
				OP.OpCode.DICT_COUNT,
				new OP.DictNew(new Map([
					[new VALUE.Symbol(0x100n, 'a'), items[0]],
					[new VALUE.Symbol(0x101n, 'b'), items[1]],
					[new VALUE.Symbol(0x102n, 'c'), items[2]],
				]), new TYPE.Dict(TYPE.ANYTHING)).asTac(builder),
				TYPE.NAT,
			)));
			builder.pushInstruction(new OP.Drop(new OP.Unop(
				OP.OpCode.SET_COUNT,
				new OP.CollectionLinearNew(OP.TypeName.SET, items, new TYPE.Set(TYPE.ANYTHING)).asTac(builder),
				TYPE.NAT,
			)));
			builder.pushInstruction(new OP.Drop(new OP.Unop(
				OP.OpCode.MAP_COUNT,
				new OP.MapNew(new Map([
					[new OP.Const(new VALUE.Symbol(0x100n, 'a')), items[0]],
					[new OP.Const(new VALUE.Symbol(0x101n, 'b')), items[1]],
					[new OP.Const(new VALUE.Symbol(0x102n, 'c')), items[2]],
				]), new TYPE.Map(TYPE.SYM, TYPE.ANYTHING)).asTac(builder),
				TYPE.NAT,
			)));
			builder.instructions.forEach((instr) => code_visitor.visit(instr));
			return assert_equal_values(interp.drops, repeat(new VALUE.Natural(3n), 4));
		});
		test.suite('instance of None/Fail.', () => {
			([OP.OpCode.NONE_IS, OP.OpCode.FAIL_IS] as const).forEach((operator, i) => {
				test.test(`[operator=${OP.OpCode[operator]}]`, () => {
					const {stmts, builder, visitors} = setupScript(`{
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
					}`, {codegen: false});
					const interp       = new Interpreter();
					const code_visitor = new OP.OpcodeVisitorInterpret(interp);
					const VISITOR      = new OP.ValueVisitorInterpret(interp);
					builder.instructions.slice(0, 8).map((instr) => code_visitor.visit(instr)); // instr index 5 is the decl for the Exception argument
					// there exists no syntax for “is None”/“is Fail”, so constructing it manually
					return assert_equal_values(stmts.slice(7).map((stmt) => VISITOR.visit(new OP.Unop(
						operator,
						visitors.build.expr.visit((stmt as AST.STMT.StatementExpression).expr!) as OP.Get,
						TYPE.BOOL,
					))), [
						[VALUE.TRUE, VALUE.FALSE, VALUE.TRUE, ...repeat(VALUE.FALSE, 3)],
						[...repeat(VALUE.FALSE, 4), VALUE.TRUE, VALUE.FALSE],
					][i]);
				});
			});
		});
		test.suite('[operator=MAYBE_UNWRAP]', () => {
			test.test('throws when operand is a None.', () => {
				const instrs: readonly OP.Instruction[] = setupScript(`{
					val mut x?: str;
					x~?;
				}`, {codegen: false}).builder.instructions;
				const code_visitor = new OP.OpcodeVisitorInterpret(new Interpreter());
				code_visitor.visit(instrs[0]);
				return assert.throws(() => code_visitor.visit(instrs[1]), /Unwrapped a None value/);
			});
			test.test('returns the value when operand is a Some.', () => {
				assert_equal_values(interpret_extracted_drops(`{
					val mut y?: str;
					set y = "hello";
					y~?;
				}`), [new VALUE.String('hello')]);
			});
		});
		test.suite('[operator=RESULT_UNWRAP]', () => {
			test.test('throws when operand is a Fail.', () => {
				const instrs: readonly OP.Instruction[] = setupScript(`{
					val x: int! = Fail.<int>(Exception.("42"));
					x~!;
				}`, {codegen: false}).builder.instructions;
				const code_visitor = new OP.OpcodeVisitorInterpret(new Interpreter());
				code_visitor.visit(instrs[0]);
				code_visitor.visit(instrs[1]);
				return assert.throws(() => code_visitor.visit(instrs[2]), /Unwrapped a Fail value/);
			});
			test.test('returns the value when operand is an Ok.', () => {
				assert_equal_values(interpret_extracted_drops(`{
					val y: Result.<nat> = Ok.<nat>(+42);
					val z: Result.<float, Exception> = Ok.<float>(4.2);
					y~!;
					z~!;
				}`), [
					new VALUE.Natural(42n),
					new VALUE.Float(4.2),
				]);
			});
		});
		test.suite('[operator=RESULT_EXTRACT]', () => {
			test.test('throws when operand is an Ok.', () => {
				const builder      = new Builder();
				const code_visitor = new OP.OpcodeVisitorInterpret(new Interpreter());
				builder.pushInstruction(new OP.Drop(new OP.Unop(
					OP.OpCode.RESULT_EXTRACT,
					new OP.ResultNew(true, TYPE.INT, TYPE.EXCP, new OP.Const(VALUE.INT_1)).asTac(builder),
					TYPE.EXCP,
				)));
				assert.strictEqual(builder.instructions.length, 2);
				code_visitor.visit(builder.instructions[0]);
				return assert.throws(() => code_visitor.visit(builder.instructions[1]), /Extracted from an Ok value/);
			});
			test.test('returns the reason when operand is a Fail.', () => {
				const builder      = new Builder();
				const interp       = new Interpreter();
				const code_visitor = new OP.OpcodeVisitorInterpret(interp);
				const message      = new VALUE.String('message');
				builder.pushInstruction(new OP.Drop(new OP.Unop(
					OP.OpCode.RESULT_EXTRACT,
					new OP.ResultNew(
						false,
						TYPE.INT,
						TYPE.EXCP,
						new OP.ExcpNew(new OP.Const(message)).asTac(builder),
					).asTac(builder),
					TYPE.EXCP,
				)));
				builder.instructions.forEach((instr) => code_visitor.visit(instr));
				return assert_equal_values(interp.drops, [new VALUE.Exception(message)]);
			});
		});
	});


	test.suite('Binop', () => {
		function interpret_binops(tested: readonly string[]): VALUE.Value[] {
			return interpret_extracted_drops(`{
				${tested.map((expr) => `${expr};`).join('\n')}
			}`);
		}
		test.test('integer operations.', () => {
			assert_equal_values(interpret_binops(extract_lines`
				42 + 420
				42 - 420
				 126 /  3
				-126 /  3
				 126 / -3
				-126 / -3
				 200 /  3
				 200 / -3
				-200 /  3
				-200 / -3
				-(5) ^ +(2 * 3)
				+5 ^ (+2 * +3)
			`), [
				/* eslint-disable @stylistic/list-style */
				new VALUE.Integer(42n + 420n),
				new VALUE.Integer(42n + -420n),
				new VALUE.Integer( 126n /  3n),
				new VALUE.Integer(-126n /  3n),
				new VALUE.Integer( 126n / -3n),
				new VALUE.Integer(-126n / -3n),
				new VALUE.Integer( 200n /  3n),
				new VALUE.Integer( 200n / -3n),
				new VALUE.Integer(-200n /  3n),
				new VALUE.Integer(-200n / -3n),
				new VALUE.Integer((-5n) ** (2n * 3n)),
				new VALUE.Natural(5n ** (2n * 3n)),
				/* eslint-enable @stylistic/list-style */
			]);
		});
		test.test('float operations.', () => {
			assert_equal_values(interpret_binops(extract_lines`
				3.0e1 - 201.0e-1
				3.0 * 2.1
			`), [
				new VALUE.Float(30 - 20.1),
				new VALUE.Float(3.0 * 2.1),
			]);
		});
		test.test('overflows integers properly.', () => {
			assert_equal_values(interpret_binops(extract_lines`
				2 ^ 63 + 2 ^ 62
				-(2 ^ 62) - 2 ^ 63
				42 ^ 2 * 420
			`), [
				new VALUE.Integer(-(2n ** 62n)),
				new VALUE.Integer(2n ** 62n),
				new VALUE.Integer((42n ** 2n * 420n) % (2n ** 64n)),
			]);
		});
		test.test('overflows naturals properly.', () => {
			assert_equal_values(
				interpret_binops(['+2 ^ +63  +  +2 ^ +62  +  +2 ^ +63']),
				[new VALUE.Natural(2n ** 63n + 2n ** 62n + 2n ** 63n)],
			);
		});
		test.test('does not underflow naturals.', () => {
			assert_equal_values(
				interpret_binops(['+5 - +9']),
				[VALUE.NAT_0],
			);
		});
		test.test('throws when the operation does not yield a valid number.', () => {
			assert.throws(() => interpret_binops(['42 / 0']),      RangeError);
			assert.throws(() => interpret_binops(['-4.0 ^ -0.5']), xjs.NaNError);
		});
		test.test('comparative operations.', () => {
			assert_equal_values(interpret_binops(extract_lines`
				3   <  3
				3   >  3
				3   <= 3
				3   >= 3
				+3  <  +3
				+3  >  +3
				+3  <= +3
				+3  >= +3
				5.2 <  7.0
				5.2 >  7.0
				5.2 <= 7.0
				5.2 >= 7.0
				5   <  +9
				5   >  +9
				5   <= +9
				5   >= +9
				+5  <  9
				+5  >  9
				+5  <= 9
				+5  >= 9
				5.2 <  9
				5.2 >  9
				5.2 <= 9
				5.2 >= 9
				5   <  9.2
				5   >  9.2
				5   <= 9.2
				5   >= 9.2
				5.2 <  +9
				5.2 >  +9
				5.2 <= +9
				5.2 >= +9
				+5  <  9.2
				+5  >  9.2
				+5  <= 9.2
				+5  >= 9.2
				+3  <  3
				+3  >  3
				+3  <= 3
				+3  >= 3
				3   <  +3
				3   >  +3
				3   <= +3
				3   >= +3
				3.0 <  +3
				3.0 >  +3
				3.0 <= +3
				3.0 >= +3
				+3  <  3.0
				+3  >  3.0
				+3  <= 3.0
				+3  >= 3.0
				3.0 <  3
				3.0 >  3
				3.0 <= 3
				3.0 >= 3
				3   <  3.0
				3   >  3.0
				3   <= 3.0
				3   >= 3.0
				-2 > (+2 ^ +64 - +3)
			`), [
				VALUE.FALSE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.TRUE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.FALSE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.TRUE,
				VALUE.FALSE,
				VALUE.FALSE,
				VALUE.TRUE,
				VALUE.TRUE,
				VALUE.TRUE,
			]);
		});
		test.suite('equality operations.', () => {
			test.test('simple non-numeric types.', () => {
				assert_equal_values(interpret_binops(extract_lines`
					null === null
					null ==  null
					null === 5
					null ==  5
					true === 1
					true ==  1
					true === 1.0
					true ==  1.0
					true === 5.1
					true ==  5.1
					true === true
					true ==  true
					@a === @a
					@a ==  @a
					@a === @b
					@a ==  @b
					@a === \\x100
					@a ==  \\x100
					@a === @\'a\'
					@a ==  @\'a\'
					@\'a\' === @\'\\u{61}\'
					@\'a\' ==  @\'\\u{61}\'
					@\'\\u{61}\' === @\'\\u{61}\'
					@\'\\u{61}\' ==  @\'\\u{61}\'
					"" == ""
					"a" === "a"
					"a" ==  "a"
					"hello\\u{20}world" === "hello world"
					"hello\\u{20}world" ==  "hello world"
					"a" !== "b"
					"a" !=  "b"
					"hello\\u{20}world" !== "hello20world"
					"hello\\u{20}world" !=  "hello20world"
				`), [
					VALUE.TRUE,
					VALUE.TRUE,
					VALUE.FALSE,
					VALUE.FALSE,
					VALUE.FALSE,
					VALUE.FALSE,
					VALUE.FALSE,
					VALUE.FALSE,
					VALUE.FALSE,
					VALUE.FALSE,
					VALUE.TRUE,
					VALUE.TRUE,
					VALUE.TRUE,
					VALUE.TRUE,
					VALUE.FALSE,
					VALUE.FALSE,
					VALUE.FALSE,
					VALUE.FALSE,
					VALUE.FALSE,
					VALUE.FALSE,
					VALUE.FALSE,
					VALUE.FALSE,
					VALUE.TRUE,
					VALUE.TRUE,
					VALUE.TRUE,
					VALUE.TRUE,
					VALUE.TRUE,
					VALUE.TRUE,
					VALUE.TRUE,
					VALUE.TRUE,
					VALUE.TRUE,
					VALUE.TRUE,
					VALUE.TRUE,
				]);
			});
			test.suite('numeric types.', () => {
				test.test('for identity (`===`), always returns `false` for distinct values.', () => {
					assert_equal_values(interpret_binops(extract_lines`
						0   === -0
						0.0 === -0.0
						0   === 0.0
						0   === -0.0
						-0  === 0.0
						-0  === -0.0
						3   === 3.0
					`), [
						VALUE.TRUE,
						...repeat(VALUE.FALSE, 6),
					]);
				});
				test.test('for equality (`==`), only returns `true` for mathematically equal values (coerces ints to floats when mixed).', () => {
					assert_equal_values(interpret_binops(extract_lines`
						0   == -0
						0.0 == -0.0
						0   == 0.0
						0   == -0.0
						-0  == 0.0
						-0  == -0.0
						3   == 3.0
					`), repeat(VALUE.TRUE, 7));
				});
			});
			test.test('compound types.', () => {
				assert_equal_values(interpret_extracted_drops(`{
					val a: anything = ();
					val b: anything = (42,);
					val c: anything = (x= 42);
					val d: Object   = [];
					val e: Object   = [42];
					val f: Object   = [x= 42];
					val g: Object   = {};
					val h: Object   = {42};
					val i: Object   = {41 -> 42};

					val bb: anything = ((42,),);
					val cc: anything = (x= (42,));
					val hh: Object   = {(42,)};
					val ii: Object   = {(41,) -> (42,)};

					a === ();
					b === (42,);
					c === (x= 42);
					d !== [];
					e !== [42];
					f !== [x= 42];
					g !== {};
					h !== {42};
					i !== {41 -> 42};
					a === a;
					b === b;
					c === c;
					d === d;
					e === e;
					f === f;
					g === g;
					h === h;
					i === i;
					a == ();
					b == (42,);
					c == (x= 42);
					d == [];
					e == [42];
					f == [x= 42];
					g == {};
					h == {42};
					i == {41 -> 42};

					bb === ((42,),);
					cc === (x= (42,));
					hh !== {(42,)};
					ii !== {(41,) -> (42,)};
					bb === bb;
					cc === cc;
					hh === hh;
					ii === ii;
					bb == ((42,),);
					cc == (x= (42,));
					hh == {(42,)};
					ii == {(41,) -> (42,)};

					b != (42, 43);
					c != (x= 43);
					c != (y= 42);
					i != {41 -> 43};
					i != {43 -> 42};
				}`), repeat(VALUE.TRUE, 44));
				return assert_equal_values(interpret_extracted_drops(`{
					val mut x?: int;
					val mut y?: float;
					val z: Some.<int> = Some.<int>(42);
					x === y;    %== false
					x == y;     %== true
					set x = 42;
					x == y;     %== false
					x === z;    %== false
					x == z;     %== true
				}`), [
					VALUE.FALSE,
					VALUE.TRUE,
					VALUE.FALSE,
					VALUE.FALSE,
					VALUE.TRUE,
				]);
			});
			test.test('compound value types’ constituents are compared using same operand.', () => {
				assert_equal_values(interpret_binops(extract_lines`
					(   42.0,)  === (   42,)
					(   42.0,)  ==  (   42,)
					(a= 42.0)   === (a= 42)
					(a= 42.0)   ==  (a= 42)
					(    0.0,)  === (   -0.0,)
					(    0.0,)  ==  (   -0.0,)
					(a=  0.0)   === (a= -0.0)
					(a=  0.0)   ==  (a= -0.0)
				`), [
					VALUE.FALSE,
					VALUE.TRUE,
					VALUE.FALSE,
					VALUE.TRUE,
					VALUE.FALSE,
					VALUE.TRUE,
					VALUE.FALSE,
					VALUE.TRUE,
				]);
			});
		});
		test.suite('IS', () => {
			const srcs: readonly string[] = extract_lines`
				null
				false
				true
				0
				42
				0.0
				-0.0
				4.2e+1
				+0
				+42
				""
				"hello"
				()
				(42,)
				(a= 42)
				[]
				[42]
				[a= 42]
				{}
				{42}
				{41 -> 42}
				None.<int>()
				Some.<int>(42)
				Fail.<int>(Exception.("err"))
				Ok.<int>(42)
			`;
			let expecteds: readonly VALUE.Value[];
			test.before(() => {
				const builder      = new Builder();
				const interp       = new Interpreter();
				const expr_visitor = new AST.ExprVisitorBuild(builder);
				const code_visitor = new OP.OpcodeVisitorInterpret(interp);
				srcs.forEach((src) => builder.pushInstruction(new OP.Drop(expr_visitor.visit(AST.EXPR.Expression.fromSource(src)).asTac(builder))));
				builder.instructions.forEach((instr) => code_visitor.visit(instr));
				expecteds = interp.drops;
			});
			test.suite('returns native `instanceof`.', () => {
				([
					CoreLibName.NULL,
					CoreLibName.BOOLEAN,
					CoreLibName.SYMBOL,
					CoreLibName.INTEGER,
					CoreLibName.NATURAL,
					CoreLibName.FLOAT,
					CoreLibName.STRING,
					CoreLibName.OBJECT,
					CoreLibName.LIST,
					CoreLibName.DICT,
					CoreLibName.SET,
					CoreLibName.MAP,
					CoreLibName.EXCEPTION,
					CoreLibName.MAYBE,
					CoreLibName.NONE,
					CoreLibName.SOME,
					CoreLibName.RESULT,
					CoreLibName.FAIL,
					CoreLibName.OK,
					CoreLibName.FUNCTION,
					CoreLibName.CLASS,
				] as const).forEach((name, i) => {
					test.test(name, () => {
						assert_equal_values(interpret_extracted_drops(`{
							${srcs.map((expr) => `${expr} is ${name};`).join('\n')}
						}`), expecteds.map((operand) => VALUE.Boolean.fromBoolean(operand instanceof [
							VALUE.Null,
							VALUE.Boolean,
							VALUE.Symbol,
							VALUE.Integer,
							VALUE.Natural,
							VALUE.Float,
							VALUE.String,
							VALUE.Object,
							VALUE.List,
							VALUE.Dict,
							VALUE.Set,
							VALUE.Map,
							VALUE.Exception,
							VALUE.Maybe,
							VALUE.None,
							VALUE.Some,
							VALUE.Result,
							VALUE.Fail,
							VALUE.Ok,
							VALUE.Function,
							VALUE.Class,
						][i])));
					});
				});
			});
		});
	});


	test.test('OpFunction', () => {
		const {stmts, builder} = setupScript(`{
			\\(x: int): void {
				x;
				return;
			};
		}`, {codegen: false});
		const typ: TYPE.Type = (stmts[0] as AST.STMT.StatementExpression).expr!.type;
		const fn:  OP.Value  = (builder.instructions[0] as OP.Drop).value;
		assert_instanceof(typ, TYPE.Function);
		assert_instanceof(fn,  OP.Function);
		return assert.deepStrictEqual(
			new OP.ValueVisitorInterpret(new Interpreter()).visit(fn),
			new VALUE.Function(typ, '\\(x: int): void { x; return; }', fn.builder),
		);
	});
});

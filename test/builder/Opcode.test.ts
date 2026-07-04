import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import binaryen from 'binaryen';
import {
	Validator,
	AST,
	VALUE,
	TYPE,
	Builder,
	Interpreter,
	OP,
	bigint_to_i64,
	CodeGenerator,
} from '../../src/index.ts';
import {
	extract_lines,
	repeat,
	assert_shallowStrictEqual,
	assertEqualBins,
	genConst,
	setupScript,
} from '../utils.ts';



test.suite('Opcode', () => {
	test.suite('Value', () => {
		test.suite('#interpret', () => {
			function interpret_extracted_drops(src: string): VALUE.Value[] {
				const interp = new Interpreter();
				return setupScript(src, {codegen: false}).builder.instructions.map((instr) => (instr instanceof OP.Drop
					? instr.value.interpret(interp)
					: instr.interpret(interp)
				)).filter((value) => !!value);
			}

			test.test('Trap always throws.', () => {
				assert.throws(() => new OP.Trap().interpret(), /Trap\./);
			});

			test.test('Const returns interpreter value.', () => {
				xjs.Array.forEachAggregated([
					VALUE.NULL,
					VALUE.FALSE,
					VALUE.TRUE,
					VALUE.INT_0,
					VALUE.NAT_0,
					VALUE.FLOAT_0,
					VALUE.STR_EMPTY,
					new VALUE.Symbol(0x100n, 'hello'),
					new VALUE.Integer(42n),
					new VALUE.Natural(42n),
					new VALUE.Float(4.2),
					new VALUE.String('hello'),
				], (val) => assert.deepStrictEqual(new OP.Const(val).interpret(), val));
			});

			test.test('Get returns validator’s symbol table value.', () => {
				assert.deepStrictEqual(interpret_extracted_drops(`{
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
				}`), [
					VALUE.NULL,
					VALUE.FALSE,
					new VALUE.Symbol(Validator.cookTokenIdentifier('hello'), 'hello'),
					new VALUE.Integer(42n),
					new VALUE.Float(4.2),
				]);
			});

			test.test('Template interprets each child, stringifies, and concatenates.', () => {
				assert.deepStrictEqual(interpret_extracted_drops(`{
					val mut x: int = 85;

					"""42😀""";
					"""the answer is {{ 7 * 3 * 2 }} but what is the question?""";
					"""the answer is {{ x / 2 }} but what is the question?""";
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
					[Validator.cookTokenIdentifier('a'), expected_items[0]],
					[Validator.cookTokenIdentifier('b'), expected_items[1]],
					[Validator.cookTokenIdentifier('c'), expected_items[2]],
				] as const;
				return assert.deepStrictEqual(interpret_extracted_drops(`{
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

			test.test('TupleGet, RecordGet', () => {
				assert.deepStrictEqual(interpret_extracted_drops(`{
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
				assert.deepStrictEqual(interpret_extracted_drops(`{
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

			test.test('Isset', () => {
				assert_shallowStrictEqual(interpret_extracted_drops(`{
					val mut a0?: int;
					val mut a1?: int;
					val mut a2?: int;

					val mut b: int = 42;
					val mut c0: int | null = 42;
					val mut c1: int | null = 42;
					val mut d: int | null = null;
					val e: int = 42;
					val f: int | null = 42;
					val g: int | null = null;

					set a1 = 42;
					set a2 = 42;
					delete a2;
					set c1 = null;

					isset a0; % false
					isset a1; % true
					isset a2; % false
					isset b;  % true
					isset c0; % true
					isset c1; % true
					isset d;  % true
					isset e;  % true
					isset f;  % true
					isset g;  % true
				}`), [
					VALUE.FALSE,
					VALUE.TRUE,
					VALUE.FALSE,
					...repeat(VALUE.TRUE, 7),
				]);
			});

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
						${ tested.map((operand) => `${ op } ${ operand };`).join('\n') }
					}`);
				}
				function interpret_calls(ctor: string, tested: readonly string[] = operands): VALUE.Value[] {
					return interpret_extracted_drops(`{
						${ tested.map((operand) => `${ ctor }.(${ operand });`).join('\n') }
					}`);
				}
				test.test('[operator=ISNULL]', () => {
					const builder = new Builder();
					const interp  = new Interpreter();
					operands.forEach((operand) => builder.pushInstruction(new OP.Drop(new OP.Unop(
						OP.OpCode.ISNULL,
						AST.EXPR.Expression.fromSource(operand).build(builder).asTac(builder),
						TYPE.BOOL,
					))));
					return assert.deepStrictEqual(
						builder.instructions.map((instr) => (instr instanceof OP.Drop
							? instr.value.interpret(interp)
							: instr.interpret(interp)
						)).filter((value) => !!value),
						[
							VALUE.TRUE,
							...repeat(VALUE.FALSE, 20),
						],
					);
				});
				test.test('[operator=NOT]', () => {
					assert.deepStrictEqual(interpret_unops('!'), [
						...repeat(VALUE.TRUE, 2),
						...repeat(VALUE.FALSE, 19),
					]);
				});
				test.test('[operator=EMP]', () => {
					assert.deepStrictEqual(interpret_unops('?'), [
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
					assert.deepStrictEqual(interpret_unops('-', operands.slice(3, 8)), [
						VALUE.INT_0,
						new VALUE.Integer(-42n),
						VALUE.FLOAT_N0,
						VALUE.FLOAT_0,
						new VALUE.Float(-4.2e+1),
					]);
				});
				test.test('[operator=TOBOOL]', () => {
					const builder = new Builder();
					const interp  = new Interpreter();
					operands.forEach((operand) => builder.pushInstruction(new OP.Drop(new OP.Unop(
						OP.OpCode.TOBOOL,
						AST.EXPR.Expression.fromSource(operand).build(builder).asTac(builder),
						TYPE.BOOL,
					))));
					return assert.deepStrictEqual(
						builder.instructions.map((instr) => (instr instanceof OP.Drop
							? instr.value.interpret(interp)
							: instr.interpret(interp)
						)).filter((value) => !!value),
						[
							...repeat(VALUE.FALSE, 2),
							...repeat(VALUE.TRUE, 19),
						],
					);
				});
				test.test('[operator=TOINT]', () => {
					assert.deepStrictEqual(interpret_calls('Integer', operands.slice(3, 10)), [
						VALUE.INT_0,
						new VALUE.Integer(42n),
						VALUE.INT_0,
						VALUE.INT_0,
						new VALUE.Integer(42n),
						VALUE.INT_0,
						new VALUE.Integer(42n),
					]);
				});
				test.test('[operator=TONAT]', () => {
					assert.deepStrictEqual(interpret_calls('Natural', operands.slice(3, 10)), [
						VALUE.NAT_0,
						new VALUE.Natural(42n),
						VALUE.NAT_0,
						VALUE.NAT_0,
						new VALUE.Natural(42n),
						VALUE.NAT_0,
						new VALUE.Natural(42n),
					]);
				});
				test.test('[operator=TOFLOAT]', () => {
					assert.deepStrictEqual(interpret_calls('Float', operands.slice(3, 10)), [
						VALUE.FLOAT_0,
						new VALUE.Float(42.0),
						VALUE.FLOAT_0,
						VALUE.FLOAT_N0,
						new VALUE.Float(4.2e+1),
						VALUE.FLOAT_0,
						new VALUE.Float(42.0),
					]);
				});
				test.test('[operator={LIST,DICT,SET,MAP}_COUNT]', () => {
					const builder = new Builder();
					const interp  = new Interpreter();
					const items: readonly OP.ValueTac[] = [
						new OP.Const(VALUE.INT_1),
						new OP.Const(new VALUE.Float(2.0)),
						new OP.Const(new VALUE.String('three')),
					];
					builder.pushInstruction(new OP.Drop(new OP.Unop(
						OP.OpCode.LIST_COUNT,
						new OP.CollectionLinearNew(OP.TypeName.LIST, items, new TYPE.List(TYPE.ANYTHING)),
						TYPE.NAT,
					)));
					builder.pushInstruction(new OP.Drop(new OP.Unop(
						OP.OpCode.DICT_COUNT,
						new OP.DictNew(new Map([
							[new VALUE.Symbol(0x100n, 'a'), items[0]],
							[new VALUE.Symbol(0x101n, 'b'), items[1]],
							[new VALUE.Symbol(0x102n, 'c'), items[2]],
						]), new TYPE.Dict(TYPE.ANYTHING)),
						TYPE.NAT,
					)));
					builder.pushInstruction(new OP.Drop(new OP.Unop(
						OP.OpCode.SET_COUNT,
						new OP.CollectionLinearNew(OP.TypeName.SET, items, new TYPE.Set(TYPE.ANYTHING)),
						TYPE.NAT,
					)));
					builder.pushInstruction(new OP.Drop(new OP.Unop(
						OP.OpCode.MAP_COUNT,
						new OP.MapNew(new Map([
							[new OP.Const(new VALUE.Symbol(0x100n, 'a')), items[0]],
							[new OP.Const(new VALUE.Symbol(0x101n, 'b')), items[1]],
							[new OP.Const(new VALUE.Symbol(0x102n, 'c')), items[2]],
						]), new TYPE.Map(TYPE.SYM, TYPE.ANYTHING)),
						TYPE.NAT,
					)));
					return assert.deepStrictEqual(
						builder.instructions.map((instr) => (instr instanceof OP.Drop
							? instr.value.interpret(interp)
							: instr.interpret(interp)
						)).filter((value) => !!value),
						repeat(new VALUE.Natural(3n), 4),
					);
				});
			});

			test.suite('Binop', () => {
				function interpret_binops(tested: readonly string[]): VALUE.Value[] {
					return interpret_extracted_drops(`{
						${ tested.map((expr) => `${ expr };`).join('\n') }
					}`);
				}
				test.test('integer operations.', () => {
					assert.deepStrictEqual(interpret_binops(extract_lines`
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
					]);
				});
				test.test('float operations.', () => {
					assert.deepStrictEqual(interpret_binops(extract_lines`
						3.0e1 - 201.0e-1
						3.0 * 2.1
					`), [
						new VALUE.Float(30 - 20.1),
						new VALUE.Float(3.0 * 2.1),
					]);
				});
				test.test('overflows integers properly.', () => {
					assert.deepStrictEqual(interpret_binops(extract_lines`
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
					assert.deepStrictEqual(
						interpret_binops(['+2 ^ +63  +  +2 ^ +62  +  +2 ^ +63']),
						[new VALUE.Natural(2n ** 63n + 2n ** 62n + 2n ** 63n)],
					);
				});
				test.test('does not underflow naturals.', () => {
					assert.deepStrictEqual(
						interpret_binops(['+5 - +9']),
						[VALUE.NAT_0],
					);
				});
				test.test('throws when the operation does not yield a valid number.', () => {
					assert.throws(() => interpret_binops(['42 / 0']),      RangeError);
					assert.throws(() => interpret_binops(['-4.0 ^ -0.5']), xjs.NaNError);
				});
				test.test('comparative operations.', () => {
					assert.deepStrictEqual(interpret_binops(extract_lines`
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
						assert.deepStrictEqual(interpret_binops(extract_lines`
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
							assert.deepStrictEqual(interpret_binops(extract_lines`
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
							assert.deepStrictEqual(interpret_binops(extract_lines`
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
						assert.deepStrictEqual(interpret_extracted_drops(`{
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
					});
					test.test('compound value types’ constituents are compared using same operand.', () => {
						assert.deepStrictEqual(interpret_binops(extract_lines`
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
			});
		});


		test.suite('#codegen', () => {
			test.test('Trap returns (unreachable).', () => {
				const cg = new CodeGenerator();
				return assertEqualBins(new OP.Trap().codegen(cg), cg.mod.unreachable());
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
						genConst(cg, 'hello', 'sym'),
						genConst(cg, 42n),
						genConst(cg, 4.2),
						genConst(cg, 'hello'),
					],
				);
			});

			test.test('Get returns (local.get).', () => {
				const {stmts, builder, cg, mod} = setupScript(`{
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
						mod.local.get(0, cg.vm.reftype.Value),
						mod.local.get(1, cg.vm.reftype.Value),
						mod.local.get(2, cg.vm.reftype.Value),
						mod.local.get(3, cg.vm.reftype.Value),
						mod.local.get(4, cg.vm.reftype.Value),
					],
				);
			});

			test.test('Template returns (block) containing static repetition of (array.copy).', () => {
				const {builder, cg, mod} = setupScript(`{
					val user: (name: str) = (name= "Alan");
					"""Hello, {{ user.name }}, you have {{ 2 * 3 }} new messages.""";
				}`);
				const {Value} = cg.vm;

				const strings = [
					genConst(cg, 'Hello, '),
					mod.local.get(1, cg.vm.reftype.Value),
					genConst(cg, ', you have '),
					mod.local.get(2, cg.vm.reftype.Value),
					genConst(cg, ' new messages.'),
				].map((code) => Value.stringify(code));

				const OFFSET_IDX = 9;

				const string_0_get: binaryen.ExpressionRef = mod.local.get(3, cg.vm.reftype.String);
				const string_1_get: binaryen.ExpressionRef = mod.local.get(4, cg.vm.reftype.String);
				const string_2_get: binaryen.ExpressionRef = mod.local.get(5, cg.vm.reftype.String);
				const string_3_get: binaryen.ExpressionRef = mod.local.get(6, cg.vm.reftype.String);
				const string_4_get: binaryen.ExpressionRef = mod.local.get(7, cg.vm.reftype.String);

				const string_0_len: binaryen.ExpressionRef = mod.array.len(string_0_get);
				const string_1_len: binaryen.ExpressionRef = mod.array.len(string_1_get);
				const string_2_len: binaryen.ExpressionRef = mod.array.len(string_2_get);
				const string_3_len: binaryen.ExpressionRef = mod.array.len(string_3_get);
				const string_4_len: binaryen.ExpressionRef = mod.array.len(string_4_get);

				const result_get: binaryen.ExpressionRef = mod.local.get(8, cg.vm.reftype.String);
				const offset_get: binaryen.ExpressionRef = mod.local.get(OFFSET_IDX, binaryen.i32);
				return assertEqualBins(
					builder.instructions[3].codegen(cg),
					mod.drop(Value.newComposite(mod.block(null, [
						mod.local.set(3, strings[0]),
						mod.local.set(4, strings[1]),
						mod.local.set(5, strings[2]),
						mod.local.set(6, strings[3]),
						mod.local.set(7, strings[4]),
						mod.local.set(8, mod.array.new_default(
							cg.vm.heaptype.String,
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
					const {stmts, builder, cg, mod} = setupScript(`{
						val mut x: int = 42;
						(x, 4.2, (null,));
					}`);
					const {Value} = cg.vm;
					return assertEqualBins(
						(stmts[1] as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg),
						Value.newComposite(cg.codegenTuple([
							mod.local.get(0, cg.vm.reftype.Value),
							genConst(cg, 4.2),
							mod.local.get(1, cg.vm.reftype.Value),
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
					const {stmts, builder, cg, mod} = setupScript(`{
						val mut x: int = 42;
						[x, 4.2, (null,), x/2, @e];
					}`);
					const {Value} = cg.vm;
					return assertEqualBins(
						(stmts[1] as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg),
						Value.newComposite(cg.codegenList([
							mod.local.get(0, cg.vm.reftypeNull.Value),
							genConst(cg, 4.2),
							mod.local.get(1, cg.vm.reftypeNull.Value),
							mod.local.get(2, cg.vm.reftypeNull.Value),
							genConst(cg, 'e', 'sym'),
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
					const {stmts, builder, cg, mod} = setupScript(`{
						val mut x: int = 42;
						{x, 4.2, (null,), x/2, @e};
					}`);
					const {Value} = cg.vm;
					return assert.strictEqual(
						binaryen.emitText((stmts[1] as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg)),
						binaryen.emitText(Value.newComposite(cg.codegenSet([
							mod.local.get(0, cg.vm.reftype.Value),
							genConst(cg, 4.2),
							mod.local.get(1, cg.vm.reftype.Value),
							mod.local.get(2, cg.vm.reftype.Value), // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
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
						new OP.RecordNew(new Map(), new TYPE.Record()).codegen(cg),
						cg.vm.Value.newComposite(cg.codegenRecord()),
					);
				});
				test.test('nonempty RECORD.NEW', () => {
					const {stmts, builder, cg, mod} = setupScript(`{
						val mut x: int = 42;
						(a= x, b= 4.2, c= (null,), d= x/2, e= @e);
					}`);
					const {Value} = cg.vm;
					const id_a: bigint = Validator.cookTokenIdentifier('a');
					const id_b: bigint = Validator.cookTokenIdentifier('b');
					const id_c: bigint = Validator.cookTokenIdentifier('c');
					const id_d: bigint = Validator.cookTokenIdentifier('d');
					const id_e: bigint = Validator.cookTokenIdentifier('e');
					return assertEqualBins(
						(stmts[1] as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg),
						Value.newComposite(cg.codegenRecord(new Map([
							[id_a, cg.newProperty(id_a, mod.local.get(0, cg.vm.reftype.Value))],
							[id_b, cg.newProperty(id_b, genConst(cg, 4.2))],
							[id_c, cg.newProperty(id_c, mod.local.get(1, cg.vm.reftype.Value))],
							[id_d, cg.newProperty(id_d, mod.local.get(2, cg.vm.reftype.Value))], // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
							[id_e, cg.newProperty(id_e, genConst(cg, Symbol(id_e.toString())))],
						]))),
					);
				});
				test.test('inserts keys in source order.', () => {
					const {stmts, builder, cg} = setupScript(`{
						(a= 42, aa= false, b= 4.2);
						(aa= true, c= null, a= 42);
						(b= 42, bb= 4.2, bbb= null);
					}`);
					const id_b:   bigint = Validator.cookTokenIdentifier('b');
					const id_c:   bigint = Validator.cookTokenIdentifier('c');
					const id_a:   bigint = Validator.cookTokenIdentifier('a');
					const id_bb:  bigint = Validator.cookTokenIdentifier('bb');
					const id_aa:  bigint = Validator.cookTokenIdentifier('aa');
					const id_bbb: bigint = Validator.cookTokenIdentifier('bbb');
					return assertEqualBins(
						stmts.map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg)),
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
					const {stmts, builder, cg, mod} = setupScript(`{
						val mut x: int = 42;
						[a= x, b= 4.2, c= (null,), d= x/2, e= @e];
					}`);
					const {Value} = cg.vm;
					const id_a: bigint = Validator.cookTokenIdentifier('a');
					const id_b: bigint = Validator.cookTokenIdentifier('b');
					const id_c: bigint = Validator.cookTokenIdentifier('c');
					const id_d: bigint = Validator.cookTokenIdentifier('d');
					const id_e: bigint = Validator.cookTokenIdentifier('e');
					return assertEqualBins(
						(stmts[1] as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg),
						Value.newComposite(cg.codegenDict(new Map([
							[id_a, cg.newProperty(id_a, mod.local.get(0, cg.vm.reftype.Value))],
							[id_b, cg.newProperty(id_b, genConst(cg, 4.2))],
							[id_c, cg.newProperty(id_c, mod.local.get(1, cg.vm.reftype.Value))],
							[id_d, cg.newProperty(id_d, mod.local.get(2, cg.vm.reftype.Value))],
							[id_e, cg.newProperty(id_e, genConst(cg, Symbol(id_e.toString())))],
						]))),
					);
				});
				test.test('inserts keys in source order.', () => {
					const {stmts, builder, cg} = setupScript(`{
						[a= 42, aa= false, b= 4.2];
						[aa= true, c= null, a= 42];
						[b= 42, c= 4.2, aaa= null];
					}`);
					const id_b:   bigint = Validator.cookTokenIdentifier('b');
					const id_c:   bigint = Validator.cookTokenIdentifier('c');
					const id_a:   bigint = Validator.cookTokenIdentifier('a');
					const id_aa:  bigint = Validator.cookTokenIdentifier('aa');
					const id_aaa: bigint = Validator.cookTokenIdentifier('aaa');
					return assertEqualBins(
						stmts.map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg)),
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
					const {stmts, builder, cg, mod} = setupScript(`{
						val mut x: int = 42;
						{1.1 -> x, 2.2 -> 4.2, 3.3 -> (null,), 4.4 -> x/2, 5.5 -> @e};
					}`);
					const {Value} = cg.vm;
					return assert.strictEqual(
						binaryen.emitText((stmts[1] as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg)),
						binaryen.emitText(Value.newComposite(cg.codegenMap(new Map([
							[genConst(cg, 1.1), mod.local.get(0, cg.vm.reftype.Value)],
							[genConst(cg, 2.2), genConst(cg, 4.2)],
							[genConst(cg, 3.3), mod.local.get(1, cg.vm.reftype.Value)],
							[genConst(cg, 4.4), mod.local.get(2, cg.vm.reftype.Value)], // from TAC (local.set $2 (INT.DIV (GET x) (INT.CONST 2)))
							[genConst(cg, 5.5), genConst(cg, 'e', 'sym')],
						])))).replaceAll('$4', '$3'),
					);
				});
			});

			test.test('TupleGet returns (array.get).', () => {
				const {builder, cg, mod} = setupScript(`{
					val mut x:   int                = 42;
					val mut tup: (int, int, ?: int) = (42, 43);

					(x, 43, 44).2;
					tup.0;
					tup.1;
				}`);
				const {Value} = cg.vm;
				return assertEqualBins(builder.instructions.slice(3).map((instr) => instr.codegen(cg)), [
					mod.drop(mod.array.get(
						Value.cast(mod.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.Tuple),
						mod.i32.const(2),
						cg.vm.reftype.Value,
					)),
					mod.drop(mod.array.get(
						Value.cast(mod.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Tuple),
						mod.i32.const(0),
						cg.vm.reftype.Value,
					)),
					mod.drop(mod.array.get(
						Value.cast(mod.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Tuple),
						mod.i32.const(1),
						cg.vm.reftype.Value,
					)),
				]);
			});

			test.test('RecordGet returns (call $Record.get).', () => {
				const {builder, cg, mod} = setupScript(`{
					val mut x:   int                       = 42;
					val mut rec: (a: int, b: int, c?: int) = (a= 42, b= 43);

					(a= x, b= 43, c= 44).c;
					rec.a;
					rec.b;
				}`);
				const {Value, Record: VmRecord} = cg.vm;
				return assertEqualBins(builder.instructions.slice(3).map((instr) => instr.codegen(cg)), [
					mod.drop(VmRecord.get(
						Value.cast(mod.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.Record),
						bigint_to_i64(mod, Validator.cookTokenIdentifier('c'), true),
					)),
					mod.drop(VmRecord.get(
						Value.cast(mod.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Record),
						bigint_to_i64(mod, Validator.cookTokenIdentifier('a'), true),
					)),
					mod.drop(VmRecord.get(
						Value.cast(mod.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Record),
						bigint_to_i64(mod, Validator.cookTokenIdentifier('b'), true),
					)),
				]);
			});

			test.suite('CollectionDynamicGet', () => {
				test.test('LIST.GET', () => {
					const {builder, cg, mod} = setupScript(`{
						val mut x:    int   = 42;
						val mut list: [int] = [42, 43];

						[x, 43, 44].[1 + 1];
						list.[0];
						list.[3];
						list.[-1];
					}`);
					const {Vect, Value, List} = cg.vm;
					const list_get:   binaryen.ExpressionRef = mod.local.get(1, cg.vm.reftype.Value);
					const item_0_get: binaryen.ExpressionRef = mod.local.get(4, cg.vm.reftypeNull.Value);
					const item_1_get: binaryen.ExpressionRef = mod.local.get(5, cg.vm.reftypeNull.Value);
					const item_2_get: binaryen.ExpressionRef = mod.local.get(6, cg.vm.reftypeNull.Value);
					const item_3_get: binaryen.ExpressionRef = mod.local.get(7, cg.vm.reftypeNull.Value);
					return assertEqualBins(builder.instructions.slice(4).map((instr) => instr.codegen(cg)), [
						mod.drop(mod.block(null, [
							mod.local.set(4, mod.array.get(
								List.field(Value.cast(mod.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.List)).internal,
								mod.i32.wrap(Vect.asInt(Value.field(mod.local.get(3, cg.vm.reftype.Value)).primitive)),
								cg.vm.reftypeNull.Value,
							)),
							mod.if(
								mod.ref.is_null(item_0_get),
								genConst(cg),
								mod.ref.as_non_null(item_0_get),
							),
						], cg.vm.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(5, mod.array.get(
								List.field(Value.cast(list_get, cg.vm.reftype.List)).internal,
								mod.i32.wrap(Vect.asInt(Value.field(genConst(cg, 0n)).primitive)),
								cg.vm.reftypeNull.Value,
							)),
							mod.if(
								mod.ref.is_null(item_1_get),
								genConst(cg),
								mod.ref.as_non_null(item_1_get),
							),
						], cg.vm.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(6, mod.array.get(
								List.field(Value.cast(list_get, cg.vm.reftype.List)).internal,
								mod.i32.wrap(Vect.asInt(Value.field(genConst(cg, 3n)).primitive)),
								cg.vm.reftypeNull.Value,
							)),
							mod.if(
								mod.ref.is_null(item_2_get),
								genConst(cg),
								mod.ref.as_non_null(item_2_get),
							),
						], cg.vm.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(7, mod.array.get(
								List.field(Value.cast(list_get, cg.vm.reftype.List)).internal,
								mod.i32.wrap(Vect.asInt(Value.field(genConst(cg, -1n)).primitive)),
								cg.vm.reftypeNull.Value,
							)),
							mod.if(
								mod.ref.is_null(item_3_get),
								genConst(cg),
								mod.ref.as_non_null(item_3_get),
							),
						], cg.vm.reftype.Value)),
					]);
				});
				test.test('DICT.GET', () => {
					const {builder, cg, mod} = setupScript(`{
						val mut x:    int    = 42;
						val mut dict: [:int] = [a= 42, c= 43];

						[a= x, b= 43, c= 44].[@b];
						dict.[@a];
						dict.[@c];
					}`);
					const {Vect, Value, Property, Dict} = cg.vm;
					return assertEqualBins(builder.instructions.slice(3).map((instr) => instr.codegen(cg)), [
						mod.drop(mod.block(null, [
							mod.local.set(3, mod.tuple.extract(Dict.find(
								Value.cast(mod.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.Dict),
								Vect.asNat(Value.field(genConst(cg, 'b', 'sym')).primitive),
							), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(mod.local.get(3, cg.vm.reftypeNull.Property)),
									Property.isTombstone(mod.local.get(3, cg.vm.reftypeNull.Property)),
								),
								genConst(cg),
								Property.field(mod.local.get(3, cg.vm.reftypeNull.Property)).val,
							),
						], cg.vm.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(4, mod.tuple.extract(Dict.find(
								Value.cast(mod.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Dict),
								Vect.asNat(Value.field(genConst(cg, 'a', 'sym')).primitive),
							), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(mod.local.get(4, cg.vm.reftypeNull.Property)),
									Property.isTombstone(mod.local.get(4, cg.vm.reftypeNull.Property)),
								),
								genConst(cg),
								Property.field(mod.local.get(4, cg.vm.reftypeNull.Property)).val,
							),
						], cg.vm.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(5, mod.tuple.extract(Dict.find(
								Value.cast(mod.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Dict),
								Vect.asNat(Value.field(genConst(cg, 'c', 'sym')).primitive),
							), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(mod.local.get(5, cg.vm.reftypeNull.Property)),
									Property.isTombstone(mod.local.get(5, cg.vm.reftypeNull.Property)),
								),
								genConst(cg),
								Property.field(mod.local.get(5, cg.vm.reftypeNull.Property)).val,
							),
						], cg.vm.reftype.Value)),
					]);
				});
				test.test('SET.GET', () => {
					const {builder, cg, mod} = setupScript(`{
						val 'set': {float} = {4.2, 2.4};
						'set'.[4.2];
						'set'.[3.3];
					}`);
					const {Value, Case, Map: VmMap} = cg.vm;
					const base:         binaryen.ExpressionRef = mod.local.get(1, cg.vm.reftype.Value); // index 0 = nonempty map setup (implementation of Set)
					const maybe_case_0: binaryen.ExpressionRef = mod.local.get(2, cg.vm.reftypeNull.Case);
					const maybe_case_1: binaryen.ExpressionRef = mod.local.get(3, cg.vm.reftypeNull.Case);
					return assertEqualBins(builder.instructions.slice(1).map((instr) => instr.codegen(cg)), [
						mod.drop(mod.block(null, [
							mod.local.set(2, mod.tuple.extract(VmMap.find(
								Value.cast(base, cg.vm.reftype.Map),
								genConst(cg, 4.2),
							), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(maybe_case_0),
									Case.isTombstone(maybe_case_0),
								),
								genConst(cg, false),
								genConst(cg, true),
							),
						], cg.vm.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(3, mod.tuple.extract(VmMap.find(
								Value.cast(base, cg.vm.reftype.Map),
								genConst(cg, 3.3),
							), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(maybe_case_1),
									Case.isTombstone(maybe_case_1),
								),
								genConst(cg, false),
								genConst(cg, true),
							),
						], cg.vm.reftype.Value)),
					]);
				});
				test.test('MAP.GET', () => {
					const {builder, cg, mod} = setupScript(`{
						val map: {float -> int} = {4.2 -> 42, 2.4 -> 24};
						map.[4.2];
						map.[3.3];
					}`);
					const {Value, Case, Map: VmMap} = cg.vm;
					const base:         binaryen.ExpressionRef = mod.local.get(1, cg.vm.reftype.Value); // index 0 = nonempty map setup
					const maybe_case_0: binaryen.ExpressionRef = mod.local.get(2, cg.vm.reftypeNull.Case);
					const maybe_case_1: binaryen.ExpressionRef = mod.local.get(3, cg.vm.reftypeNull.Case);
					return assertEqualBins(builder.instructions.slice(1).map((instr) => instr.codegen(cg)), [
						mod.drop(mod.block(null, [
							mod.local.set(2, mod.tuple.extract(VmMap.find(
								Value.cast(base, cg.vm.reftype.Map),
								genConst(cg, 4.2),
							), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(maybe_case_0),
									Case.isTombstone(maybe_case_0),
								),
								genConst(cg),
								Case.field(maybe_case_0).con,
							),
						], cg.vm.reftype.Value)),
						mod.drop(mod.block(null, [
							mod.local.set(3, mod.tuple.extract(VmMap.find(
								Value.cast(base, cg.vm.reftype.Map),
								genConst(cg, 3.3),
							), 1)),
							mod.if(
								mod.i32.or(
									mod.ref.is_null(maybe_case_1),
									Case.isTombstone(maybe_case_1),
								),
								genConst(cg),
								Case.field(maybe_case_1).con,
							),
						], cg.vm.reftype.Value)),
					]);
				});
			});

			test.test('Isset', () => {
				const {stmts, builder, cg} = setupScript(`{
					val mut a0?: int;
					val mut a1?: int;
					val mut a2?: int;

					val mut b: int = 42;
					val mut c0: int | null = 42;
					val mut c1: int | null = 42;
					val mut d: int | null = null;
					val e: int = 42;
					val f: int | null = 42;
					val g: int | null = null;

					set a1 = 42;
					set a2 = 42;
					delete a2;
					set c1 = null;

					isset a0;
					isset a1;
					isset a2;
					isset b;
					isset c0;
					isset c1;
					isset d;
					isset e;
					isset f;
					isset g;
				}`);
				return assertEqualBins(
					stmts.slice(14).map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg)),
					Array.from(new Array(10), (_, i) => cg.vm.Value.boolFromI32(cg.mod.i32.eqz(cg.mod.i32.eqz(cg.vm.Value.field(cg.mod.local.get(i, cg.vm.reftype.Value)).tag)))),
				);
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
				test.test('Returns custom WASM functions.', () => {
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

						Integer.(+42);
						Integer.(4.2);
						Natural.(42);
						Natural.(4.2);
						Float.(+42);
						Float.(42);

						String.(null);
						String.(42);
						String.("hello");
					}`, {codegen: false});
					const id_hello = Validator.cookTokenIdentifier('hello');
					return assertEqualBins(
						stmts.map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.build(builder).codegen(cg)),
						[
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

							cg.vm.op.toInt(genConst(cg, 42n, 'nat')),
							cg.vm.op.toInt(genConst(cg, 4.2)),
							cg.vm.op.toNat(genConst(cg, 42n)),
							cg.vm.op.toNat(genConst(cg, 4.2)),
							cg.vm.op.toFloat(genConst(cg, 42n, 'nat')),
							cg.vm.op.toFloat(genConst(cg, 42n)),

							cg.vm.Value.stringify(genConst(cg)),
							cg.vm.Value.stringify(genConst(cg, 42n)),
							cg.vm.Value.stringify(genConst(cg, 'hello')),
						],
					);
				});
				test.test('LIST.COUNT', () => {
					const {stmts, builder, cg, mod} = setupScript(`{
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
						Value.newPrimitive(Vect.newNat(mod.i64.extend_u(List.count(Value.cast(list.codegen(cg), cg.vm.reftype.List))))),
					);
				});
				test.test('DICT.COUNT', () => {
					const {stmts, builder, cg, mod} = setupScript(`{
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
						Value.newPrimitive(Vect.newNat(mod.i64.extend_u(Dict.count(Value.cast(dict.codegen(cg), cg.vm.reftype.Dict))))),
					);
				});
				test.test('SET.COUNT', () => {
					const {stmts, builder, cg, mod} = setupScript(`{
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
						Value.newPrimitive(Vect.newNat(mod.i64.extend_u(VmMap.count(Value.cast(set.codegen(cg), cg.vm.reftype.Map))))),
					);
				});
				test.test('MAP.COUNT', () => {
					const {stmts, builder, cg, mod} = setupScript(`{
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
						Value.newPrimitive(Vect.newNat(mod.i64.extend_u(VmMap.count(Value.cast(map.codegen(cg), cg.vm.reftype.Map))))),
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
				const {builder, cg, mod} = setupScript(`{
					null;
					false;
					@hello;
					42;
					4.2;
				}`, {codegen: false});
				return assertEqualBins(
					builder.instructions.map((instr) => instr.codegen(cg)),
					[
						mod.drop(genConst(cg)),
						mod.drop(genConst(cg, false)),
						mod.drop(genConst(cg, 'hello', 'sym')),
						mod.drop(genConst(cg, 42n)),
						mod.drop(genConst(cg, 4.2)),
					],
				);
			});

			test.test('Decl & Set both return (local.set).', () => {
				const {builder, cg, mod} = setupScript(`{
					val mut a: null  = null;
					val mut b: bool  = false;
					val mut c: sym   = @hello;
					val mut d: int   = 42;
					val mut e: float = 4.2;
					val mut f?: str;

					set a = null;
					set b = true;
					set c = @world;
					set d = 43;
					set e = 4.3;
					set f = "hello";
					delete f;
				}`, {codegen: false});
				return assertEqualBins(
					builder.instructions.map((instr) => instr.codegen(cg)),
					[
						mod.local.set(0, genConst(cg)),
						mod.local.set(1, genConst(cg, false)),
						mod.local.set(2, genConst(cg, 'hello', 'sym')),
						mod.local.set(3, genConst(cg, 42n)),
						mod.local.set(4, genConst(cg, 4.2)),
						mod.local.set(5, cg.vm.Value.newDefault()),

						mod.local.set(0, genConst(cg)),
						mod.local.set(1, genConst(cg, true)),
						mod.local.set(2, genConst(cg, 'world', 'sym')),
						mod.local.set(3, genConst(cg, 43n)),
						mod.local.set(4, genConst(cg, 4.3)),
						mod.local.set(5, genConst(cg, 'hello')),
						mod.local.set(5, cg.vm.Value.newDefault()),
					],
				);
			});

			test.test('uninitialized Decl returns (local.set) with (struct.new_default).', () => {
				// there exists no syntax for empty Decls, so constructing it manually
				const cg = new CodeGenerator();
				const {mod} = cg;
				assertEqualBins(
					new OP.Decl(new Builder().newTemp(TYPE.INT)).codegen(cg),
					mod.local.set(0, cg.vm.Value.newDefault()),
				);
			});

			test.suite('CollectionDynamicSet', () => {
				test.test('LIST.SET', () => {
					const {builder, cg, mod} = setupScript(`{
						val mut x:    int       = 42;
						val mut list: mut [int] = [42, 43];

						set [x, 43, 44].[1 + 1] = 45;
						set list.[0] = 46;
						set list.[2] = 47;
					}`);
					const {Vect, Value, List} = cg.vm;
					return assertEqualBins(builder.instructions.slice(4).map((instr) => instr.codegen(cg)), [
						List.set(
							Value.cast(mod.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.List),
							mod.i32.wrap(Vect.asInt(Value.field(mod.local.get(3, cg.vm.reftype.Value)).primitive)),
							genConst(cg, 45n),
						),
						List.set(
							Value.cast(mod.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.List),
							mod.i32.wrap(Vect.asInt(Value.field(genConst(cg, 0n)).primitive)),
							genConst(cg, 46n),
						),
						List.set(
							Value.cast(mod.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.List),
							mod.i32.wrap(Vect.asInt(Value.field(genConst(cg, 2n)).primitive)),
							genConst(cg, 47n),
						),
					]);
				});
				test.test('DICT.SET', () => {
					const {builder, cg, mod} = setupScript(`{
						val mut x:    int        = 42;
						val mut dict: mut [:int] = [a= 42, c= 43];

						set [a= x, b= 43, c= 44].[@b] = 45;
						set dict.[@a] = 46;
						set dict.[@c] = 47;
					}`);
					const {Vect, Value, Dict} = cg.vm;
					return assertEqualBins(builder.instructions.slice(3).map((instr) => instr.codegen(cg)), [
						Dict.set(
							Value.cast(mod.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.Dict),
							Vect.asNat(Value.field(genConst(cg, 'b', 'sym')).primitive),
							genConst(cg, 45n),
						),
						Dict.set(
							Value.cast(mod.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Dict),
							Vect.asNat(Value.field(genConst(cg, 'a', 'sym')).primitive),
							genConst(cg, 46n),
						),
						Dict.set(
							Value.cast(mod.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Dict),
							Vect.asNat(Value.field(genConst(cg, 'c', 'sym')).primitive),
							genConst(cg, 47n),
						),
					]);
				});
				test.test('SET.SET', () => {
					const {builder, cg, mod} = setupScript(`{
						val 'set': mut {float} = {4.2, 2.4};
						set 'set'.[4.2] = false;
						set 'set'.[3.3] = true;
					}`, {codegen: false});
					const {Vect, Value, Map: VmMap} = cg.vm;
					const base:           binaryen.ExpressionRef = mod.local.get(1, cg.vm.reftype.Value); // index 0 = nonempty map setup (implementation of Set)
					const base_get_0:     binaryen.ExpressionRef = mod.local.get(2, cg.vm.reftype.Map);
					const accessor_get_0: binaryen.ExpressionRef = mod.local.get(3, cg.vm.reftype.Value);
					const base_get_1:     binaryen.ExpressionRef = mod.local.get(4, cg.vm.reftype.Map);
					const accessor_get_1: binaryen.ExpressionRef = mod.local.get(5, cg.vm.reftype.Value);
					builder.instructions[0].codegen(cg);
					return assertEqualBins(builder.instructions.slice(1).map((instr) => instr.codegen(cg)), [
						mod.block(null, [
							mod.local.set(2, Value.cast(base, cg.vm.reftype.Map)),
							mod.local.set(3, genConst(cg, 4.2)),
							mod.if(
								Vect.isConst(Value.field(genConst(cg, false)).primitive, true),
								VmMap.set(base_get_0, accessor_get_0, genConst(cg)),
								mod.drop(VmMap.delete(base_get_0, accessor_get_0)),
							),
						]),
						mod.block(null, [
							mod.local.set(4, Value.cast(base, cg.vm.reftype.Map)),
							mod.local.set(5, genConst(cg, 3.3)),
							mod.if(
								Vect.isConst(Value.field(genConst(cg, true)).primitive, true),
								VmMap.set(base_get_1, accessor_get_1, genConst(cg)),
								mod.drop(VmMap.delete(base_get_1, accessor_get_1)),
							),
						]),
					]);
				});
				test.test('MAP.SET', () => {
					const {builder, cg, mod} = setupScript(`{
						val map: mut {float -> int} = {4.2 -> 42, 2.4 -> 24};
						set map.[4.2] = 21;
						set map.[3.3] = 21;
					}`);
					const {Value, Map: VmMap} = cg.vm;
					const base: binaryen.ExpressionRef = mod.local.get(1, cg.vm.reftype.Value); // index 0 = nonempty map setup
					return assertEqualBins(builder.instructions.slice(1).map((instr) => instr.codegen(cg)), [
						VmMap.set(Value.cast(base, cg.vm.reftype.Map), genConst(cg, 4.2), genConst(cg, 21n)),
						VmMap.set(Value.cast(base, cg.vm.reftype.Map), genConst(cg, 3.3), genConst(cg, 21n)),
					]);
				});
			});

			test.suite('CollectionDynamicCopy', () => {
				test.suite('LIST.COPY', () => {
					test.test('tuple argument.', () => {
						const {builder, cg, mod} = setupScript(`{
							List.<int>((2, 3, 5));
						}`, {codegen: false});
						const {Value, List} = cg.vm;
						const destlist_get: binaryen.ExpressionRef = mod.local.get(2, cg.vm.reftype.List);
						const srcref_get:   binaryen.ExpressionRef = mod.local.get(3, cg.vm.reftype.Tuple);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, Value.cast(mod.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.List)),
								mod.local.set(3, Value.cast(mod.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Tuple)),
								List.adjustCapacity(
									destlist_get,
									cg.vm.util.capacityNeeded(mod.array.len(srcref_get)),
								),
								mod.array.copy(
									List.field(destlist_get).internal,
									mod.i32.const(0),
									srcref_get,
									mod.i32.const(0),
									mod.array.len(srcref_get),
								),
							]),
						);
					});
					test.test('List argument.', () => {
						const {builder, cg, mod} = setupScript(`{
							List.<int>([2, 3, 5]);
						}`, {codegen: false});
						const {Value, List} = cg.vm;
						const destlist_get: binaryen.ExpressionRef = mod.local.get(2, cg.vm.reftype.List);
						const srcref_get:   binaryen.ExpressionRef = mod.local.get(3, cg.vm.reftype.ListInternal);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, Value.cast(mod.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.List)),
								mod.local.set(3, List.field(Value.cast(mod.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.List)).internal),
								List.adjustCapacity(
									destlist_get,
									mod.array.len(srcref_get),
								),
								mod.array.copy(
									List.field(destlist_get).internal,
									mod.i32.const(0),
									srcref_get,
									mod.i32.const(0),
									mod.array.len(srcref_get),
								),
							]),
						);
					});
					test.test('Set argument.', () => {
						const {builder, cg, mod} = setupScript(`{
							List.<int>({2, 3, 5});
						}`, {codegen: false});
						const {Value, Case, List, Map: VmMap} = cg.vm;
						const cases_get: binaryen.ExpressionRef = mod.local.get(4, cg.vm.reftype.MapInternal);
						const j_get:     binaryen.ExpressionRef = mod.local.get(5, binaryen.i32);
						const i_get:     binaryen.ExpressionRef = mod.local.get(6, binaryen.i32);
						const case_get:  binaryen.ExpressionRef = mod.local.get(7, cg.vm.reftypeNull.Case);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(5, mod.i32.const(0)),
								mod.block(null, [
									mod.local.set(3, Value.cast(mod.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.List)),
									mod.local.set(4, VmMap.field(Value.cast(mod.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.Map)).internal), // index 1 = nonempty map setup (implementation of Set)
									mod.block('exit-0', [
										mod.local.set(6, mod.i32.const(0)),
										mod.loop('repeat-0', mod.block(null, [
											mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(cases_get))),
											mod.local.set(7, mod.array.get(cases_get, i_get, cg.vm.reftypeNull.Case)),
											mod.if(
												mod.i32.eqz(mod.ref.is_null(case_get)),
												mod.block(null, [
													List.set(
														mod.local.get(3, cg.vm.reftype.List),
														j_get,
														Case.field(case_get).ant,
													),
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
						const {builder, cg, mod} = setupScript(`{
							Dict.<int>(( (@a, 2), (@b, 3), (@c, 5) ));
						}`, {codegen: false});
						const {Vect, Value, Dict} = cg.vm;
						const pairs_get: binaryen.ExpressionRef = mod.local.get(6, cg.vm.reftype.Tuple);
						const i_get:     binaryen.ExpressionRef = mod.local.get(7, binaryen.i32);
						builder.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(5, Value.cast(mod.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Dict)),
								mod.local.set(6, Value.cast(mod.local.get(4, cg.vm.reftype.Value), cg.vm.reftype.Tuple)),
								mod.block('exit-0', [
									mod.local.set(7, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(pairs_get))),
										mod.local.set(8, mod.array.get(pairs_get, i_get, cg.vm.reftype.Value)),
										Dict.set(
											mod.local.get(5, cg.vm.reftype.Dict),
											Vect.asNat(Value.field(mod.array.get(
												mod.local.tee(9, Value.cast(mod.local.get(8, cg.vm.reftype.Value), cg.vm.reftype.Tuple), cg.vm.reftype.Tuple),
												mod.i32.const(0),
												cg.vm.reftype.Value,
											)).primitive),
											mod.array.get(mod.local.get(9, cg.vm.reftype.Tuple), mod.i32.const(1), cg.vm.reftype.Value),
										),
										mod.local.set(7, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('record argument.', () => {
						const {builder, cg, mod} = setupScript(`{
							Dict.<int>((a= 2, b= 3, c= 5));
						}`, {codegen: false});
						const {Value, Dict} = cg.vm;
						const destdict_get: binaryen.ExpressionRef = mod.local.get(2, cg.vm.reftype.Dict);
						const srcref_get:   binaryen.ExpressionRef = mod.local.get(3, cg.vm.reftype.Record);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, Value.cast(mod.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Dict)),
								mod.local.set(3, Value.cast(mod.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Record)),
								Dict.adjustCapacity(
									destdict_get,
									cg.vm.util.capacityNeeded(mod.array.len(srcref_get)),
								),
								mod.array.copy(
									Dict.field(destdict_get).internal,
									mod.i32.const(0),
									srcref_get,
									mod.i32.const(0),
									mod.array.len(srcref_get),
								),
							]),
						);
					});
					test.test('List argument.', () => {
						const {builder, cg, mod} = setupScript(`{
							Dict.<int>([ (@a, 2), (@b, 3), (@c, 5) ]);
						}`, {codegen: false});
						const {Vect, Value, List, Dict} = cg.vm;
						const pairs_get: binaryen.ExpressionRef = mod.local.get(6, cg.vm.reftype.ListInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(7, binaryen.i32);
						const item_get:  binaryen.ExpressionRef = mod.local.get(8, cg.vm.reftypeNull.Value);
						builder.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(5, Value.cast(mod.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Dict)),
								mod.local.set(6, List.field(Value.cast(mod.local.get(4, cg.vm.reftype.Value), cg.vm.reftype.List)).internal),
								mod.block('exit-0', [
									mod.local.set(7, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(pairs_get))),
										mod.local.set(8, mod.array.get(pairs_get, i_get, cg.vm.reftypeNull.Value)),
										mod.if(
											mod.i32.eqz(mod.ref.is_null(item_get)),
											Dict.set(
												mod.local.get(5, cg.vm.reftype.Dict),
												Vect.asNat(Value.field(mod.array.get(
													mod.local.tee(9, Value.cast(item_get, cg.vm.reftype.Tuple), cg.vm.reftype.Tuple),
													mod.i32.const(0),
													cg.vm.reftype.Value,
												)).primitive),
												mod.array.get(mod.local.get(9, cg.vm.reftype.Tuple), mod.i32.const(1), cg.vm.reftype.Value),
											),
										),
										mod.local.set(7, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('Dict argument.', () => {
						const {builder, cg, mod} = setupScript(`{
							Dict.<int>([a= 2, b= 3, c= 5]);
						}`, {codegen: false});
						const {Value, Dict} = cg.vm;
						const destdict_get: binaryen.ExpressionRef = mod.local.get(2, cg.vm.reftype.Dict);
						const srcref_get:   binaryen.ExpressionRef = mod.local.get(3, cg.vm.reftype.DictInternal);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, Value.cast(mod.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Dict)),
								mod.local.set(3, Dict.field(Value.cast(mod.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Dict)).internal),
								Dict.adjustCapacity(
									destdict_get,
									mod.array.len(srcref_get),
								),
								mod.array.copy(
									Dict.field(destdict_get).internal,
									mod.i32.const(0),
									srcref_get,
									mod.i32.const(0),
									mod.array.len(srcref_get),
								),
							]),
						);
					});
					test.test('Set argument.', () => {
						const {builder, cg, mod} = setupScript(`{
							Dict.<int>({ (@a, 2), (@b, 3), (@c, 5) });
						}`, {codegen: false});
						const {Vect, Value, Case, Dict, Map: VmMap} = cg.vm;
						const cases_get: binaryen.ExpressionRef = mod.local.get(7, cg.vm.reftype.MapInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(8, binaryen.i32);
						const case_get:  binaryen.ExpressionRef = mod.local.get(9, cg.vm.reftypeNull.Case);
						builder.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(6, Value.cast(mod.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Dict)),
								mod.local.set(7, VmMap.field(Value.cast(mod.local.get(5, cg.vm.reftype.Value), cg.vm.reftype.Map)).internal), // index 4 = nonempty map setup (implementation of Set)
								mod.block('exit-0', [
									mod.local.set(8, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(cases_get))),
										mod.local.set(9, mod.array.get(cases_get, i_get, cg.vm.reftypeNull.Case)),
										mod.if(
											mod.i32.eqz(mod.ref.is_null(case_get)),
											Dict.set(
												mod.local.get(6, cg.vm.reftype.Dict),
												Vect.asNat(Value.field(mod.array.get(
													mod.local.tee(10, Value.cast(Case.field(case_get).ant, cg.vm.reftype.Tuple), cg.vm.reftype.Tuple),
													mod.i32.const(0),
													cg.vm.reftype.Value,
												)).primitive),
												mod.array.get(mod.local.get(10, cg.vm.reftype.Tuple), mod.i32.const(1), cg.vm.reftype.Value),
											),
										),
										mod.local.set(8, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('Map argument.', () => {
						const {builder, cg, mod} = setupScript(`{
							Dict.<int>({@a -> 2, @b -> 3, @c -> 5});
						}`, {codegen: false});
						const {Vect, Value, Case, Dict, Map: VmMap} = cg.vm;
						const cases_get: binaryen.ExpressionRef = mod.local.get(4, cg.vm.reftype.MapInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(5, binaryen.i32);
						const case_get:  binaryen.ExpressionRef = mod.local.get(6, cg.vm.reftypeNull.Case);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(3, Value.cast(mod.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Dict)),
								mod.local.set(4, VmMap.field(Value.cast(mod.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.Map)).internal), // index 1 = nonempty map setup
								mod.block('exit-0', [
									mod.local.set(5, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(cases_get))),
										mod.local.set(6, mod.array.get(cases_get, i_get, cg.vm.reftypeNull.Case)),
										mod.if(
											mod.i32.eqz(mod.ref.is_null(case_get)),
											mod.block(null, [
												Dict.set(
													mod.local.get(3, cg.vm.reftype.Dict),
													Vect.asNat(Value.field(Case.field(case_get).ant).primitive),
													Case.field(case_get).con,
												),
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
						const {builder, cg, mod} = setupScript(`{
							Set.<int>((2, 3, 5));
						}`, {codegen: false});
						const {Value, Map: VmMap} = cg.vm;
						const items_get: binaryen.ExpressionRef = mod.local.get(3, cg.vm.reftype.Tuple);
						const i_get:     binaryen.ExpressionRef = mod.local.get(4, binaryen.i32);
						const item_get:  binaryen.ExpressionRef = mod.local.get(5, cg.vm.reftype.Value);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, Value.cast(mod.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Map)),
								mod.local.set(3, Value.cast(mod.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.Tuple)),
								mod.block('exit-0', [
									mod.local.set(4, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(items_get))),
										mod.local.set(5, mod.array.get(items_get, i_get, cg.vm.reftype.Value)),
										VmMap.set(
											mod.local.get(2, cg.vm.reftype.Map),
											item_get,
											genConst(cg),
										),
										mod.local.set(4, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('List argument.', () => {
						const {builder, cg, mod} = setupScript(`{
							Set.<int>([2, 3, 5]);
						}`, {codegen: false});
						const {Value, List, Map: VmMap} = cg.vm;
						const items_get: binaryen.ExpressionRef = mod.local.get(3, cg.vm.reftype.ListInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(4, binaryen.i32);
						const item_get:  binaryen.ExpressionRef = mod.local.get(5, cg.vm.reftype.Value);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(2, Value.cast(mod.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Map)),
								mod.local.set(3, List.field(Value.cast(mod.local.get(1, cg.vm.reftype.Value), cg.vm.reftype.List)).internal),
								mod.block('exit-0', [
									mod.local.set(4, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(items_get))),
										mod.local.set(5, mod.array.get(items_get, i_get, cg.vm.reftypeNull.Value)),
										mod.if(
											mod.i32.eqz(mod.ref.is_null(item_get)),
											VmMap.set(
												mod.local.get(2, cg.vm.reftype.List),
												mod.ref.as_non_null(item_get),
												genConst(cg),
											),
										),
										mod.local.set(4, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('Set argument.', () => {
						const {builder, cg, mod} = setupScript(`{
							Set.<int>({2, 3, 5});
						}`, {codegen: false});
						const {Value, Map: VmMap} = cg.vm;
						const destset_get: binaryen.ExpressionRef = mod.local.get(3, cg.vm.reftype.Map);
						const srcref_get:  binaryen.ExpressionRef = mod.local.get(4, cg.vm.reftype.MapInternal);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(3, Value.cast(mod.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Map)),
								mod.local.set(4, VmMap.field(Value.cast(mod.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.Map)).internal), // index 1 = nonempty map setup (implementation of Set)
								VmMap.adjustCapacity(
									destset_get,
									mod.array.len(srcref_get),
								),
								mod.array.copy(
									VmMap.field(destset_get).internal,
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
						const {builder, cg, mod} = setupScript(`{
							Map.<float, int>(( (1.414, 2), (1.732, 3), (2.236, 5) ));
						}`, {codegen: false});
						const {Value, Map: VmMap} = cg.vm;
						const pairs_get: binaryen.ExpressionRef = mod.local.get(6, cg.vm.reftype.Tuple);
						const i_get:     binaryen.ExpressionRef = mod.local.get(7, binaryen.i32);
						builder.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(5, Value.cast(mod.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Map)),
								mod.local.set(6, Value.cast(mod.local.get(4, cg.vm.reftype.Value), cg.vm.reftype.Tuple)),
								mod.block('exit-0', [
									mod.local.set(7, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(pairs_get))),
										mod.local.set(8, mod.array.get(pairs_get, i_get, cg.vm.reftype.Value)),
										VmMap.set(
											mod.local.get(5, cg.vm.reftype.Map),
											mod.array.get(mod.local.tee(9, Value.cast(mod.local.get(8, cg.vm.reftype.Value), cg.vm.reftype.Tuple), cg.vm.reftype.Tuple), mod.i32.const(0), cg.vm.reftype.Value),
											mod.array.get(mod.local.get(9, cg.vm.reftype.Tuple), mod.i32.const(1), cg.vm.reftype.Value),
										),
										mod.local.set(7, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('List argument.', () => {
						const {builder, cg, mod} = setupScript(`{
							Map.<float, int>([ (1.414, 2), (1.732, 3), (2.236, 5) ]);
						}`, {codegen: false});
						const {Value, List, Map: VmMap} = cg.vm;
						const pairs_get: binaryen.ExpressionRef = mod.local.get(6, cg.vm.reftype.ListInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(7, binaryen.i32);
						const item_get:  binaryen.ExpressionRef = mod.local.get(8, cg.vm.reftypeNull.Value);
						builder.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(5, Value.cast(mod.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Map)),
								mod.local.set(6, List.field(Value.cast(mod.local.get(4, cg.vm.reftype.Value), cg.vm.reftype.List)).internal),
								mod.block('exit-0', [
									mod.local.set(7, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(pairs_get))),
										mod.local.set(8, mod.array.get(pairs_get, i_get, cg.vm.reftypeNull.Value)),
										mod.if(
											mod.i32.eqz(mod.ref.is_null(item_get)),
											VmMap.set(
												mod.local.get(5, cg.vm.reftype.Map),
												mod.array.get(mod.local.tee(9, Value.cast(item_get, cg.vm.reftype.Tuple), cg.vm.reftype.Tuple), mod.i32.const(0), cg.vm.reftype.Value),
												mod.array.get(mod.local.get(9, cg.vm.reftype.Tuple), mod.i32.const(1), cg.vm.reftype.Value),
											),
										),
										mod.local.set(7, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('Set argument.', () => {
						const {builder, cg, mod} = setupScript(`{
							Map.<float, int>({ (1.414, 2), (1.732, 3), (2.236, 5) });
						}`, {codegen: false});
						const {Value, Case, Map: VmMap} = cg.vm;
						const cases_get: binaryen.ExpressionRef = mod.local.get(7, cg.vm.reftype.MapInternal);
						const i_get:     binaryen.ExpressionRef = mod.local.get(8, binaryen.i32);
						const case_get:  binaryen.ExpressionRef = mod.local.get(9, cg.vm.reftypeNull.Case);
						builder.instructions.slice(0, 5).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[5].codegen(cg),
							mod.block(null, [
								mod.local.set(6, Value.cast(mod.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Map)),
								mod.local.set(7, VmMap.field(Value.cast(mod.local.get(5, cg.vm.reftype.Value), cg.vm.reftype.Map)).internal), // index 4 = nonempty map setup (implementation of Set)
								mod.block('exit-0', [
									mod.local.set(8, mod.i32.const(0)),
									mod.loop('repeat-0', mod.block(null, [
										mod.br_if('exit-0', mod.i32.ge_u(i_get, mod.array.len(cases_get))),
										mod.local.set(9, mod.array.get(cases_get, i_get, cg.vm.reftypeNull.Case)),
										mod.if(
											mod.i32.eqz(mod.ref.is_null(case_get)),
											VmMap.set(
												mod.local.get(6, cg.vm.reftype.Map),
												mod.array.get(mod.local.tee(10, Value.cast(Case.field(case_get).ant, cg.vm.reftype.Tuple), cg.vm.reftype.Tuple), mod.i32.const(0), cg.vm.reftype.Value),
												mod.array.get(mod.local.get(10, cg.vm.reftype.Tuple), mod.i32.const(1), cg.vm.reftype.Value),
											),
										),
										mod.local.set(8, mod.i32.add(i_get, mod.i32.const(1))),
										mod.br('repeat-0'),
									])),
								]),
							]),
						);
					});
					test.test('Map argument.', () => {
						const {builder, cg, mod} = setupScript(`{
							Map.<float, int>({1.414 -> 2, 1.732 -> 3, 2.236 -> 5});
						}`, {codegen: false});
						const {Value, Map: VmMap} = cg.vm;
						const destmap_get: binaryen.ExpressionRef = mod.local.get(3, cg.vm.reftype.Map);
						const srcref_get:  binaryen.ExpressionRef = mod.local.get(4, cg.vm.reftype.MapInternal);
						builder.instructions.slice(0, 2).forEach((instr) => instr.codegen(cg));
						return assertEqualBins(
							builder.instructions[2].codegen(cg),
							mod.block(null, [
								mod.local.set(3, Value.cast(mod.local.get(0, cg.vm.reftype.Value), cg.vm.reftype.Map)),
								mod.local.set(4, VmMap.field(Value.cast(mod.local.get(2, cg.vm.reftype.Value), cg.vm.reftype.Map)).internal), // index 1 = nonempty map setup (implementation of Set)
								VmMap.adjustCapacity(
									destmap_get,
									mod.array.len(srcref_get),
								),
								mod.array.copy(
									VmMap.field(destmap_get).internal,
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
});

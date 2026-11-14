import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	type EntryType,
	VALUE,
	TYPE,
	type ConstructorType,
	Validator,
	AST,
	TypeErrorInvalidOperation,
	TypeErrorNoEntry,
	TypeErrorNotCallable,
	TypeErrorArgCount,
} from '../../../src/index.ts';
import {
	extract_tokens,
	extract_lines,
	assertEqualTypes,
	typeUnit,
	setupScript,
} from '../../utils.ts';



test.suite('TypeVisitorTypevalue#visit', () => {
	const VISITOR = new AST.TypeVisitorTypevalue();


	test.suite('Constant', () => {
		test.test('computes the value of constant null, boolean, symbol, number, and string types.', () => {
			assertEqualTypes(extract_tokens(`
				null  false  true
				@then  @str  @false  @foobar
				42  +42  4.2e+3
				"hi"
			`).map((src) => VISITOR.visit(AST.TYPE.Constant.fromSource(src))), [
				TYPE.NULL,
				TYPE.FALSE,
				TYPE.TRUE,
				new VALUE.Symbol(0x52n, 'then').toType(),
				new VALUE.Symbol(0x46n, 'str').toType(),
				new VALUE.Symbol(0x49n, 'false').toType(),
				new VALUE.Symbol(Validator.keyId('foobar'), 'foobar').toType(),
				typeUnit(42n),
				typeUnit(42n, 'nat'),
				typeUnit(4.2e+3),
				typeUnit('hi'),
			]);
		});
		test.test('computes the value of keyword type.', () => {
			assertEqualTypes(extract_tokens(`
				nothing  bool  sym  int  float  str  anything
			`).map((src) => VISITOR.visit(AST.TYPE.Constant.fromSource(src))), [
				TYPE.NOTHING,
				TYPE.BOOL,
				TYPE.SYM,
				TYPE.INT,
				TYPE.FLOAT,
				TYPE.STR,
				TYPE.ANYTHING,
			]);
		});
	});


	test.suite('TypeAlias', () => {
		test.test('computes the value of reserved types.', () => {
			assertEqualTypes([
				'Object',
				'Exception',
			].map((src) => VISITOR.visit(AST.TYPE.TypeAlias.fromSource(src))), [
				TYPE.OBJ,
				TYPE.EXCP,
			]);
		});
		test.test('computes the value of a type alias.', () => {
			assert.strictEqual(
				VISITOR.visit(((setupScript(`{
					type T = int;
					type U = T;
				}`).stmts[1] as AST.STMT.DeclarationType).assigned as AST.TYPE.TypeAlias)),
				TYPE.INT,
			);
		});
	});


	test.suite('TypeCollectionLiteral', () => {
		test.test('AST.TYPE.Tuple', () => {
			assertEqualTypes(
				VISITOR.visit(AST.TYPE.Tuple.fromSource('(int, bool, ?:str)')),
				new TYPE.Tuple([
					{type: TYPE.INT,  optional: false},
					{type: TYPE.BOOL, optional: false},
					{type: TYPE.STR,  optional: true},
				]),
			);
		});

		test.test('AST.TYPE.Record', () => {
			const rec: AST.TYPE.Record = AST.TYPE.Record.fromSource('(x: int, y?: bool, _: str)');
			return assertEqualTypes(
				VISITOR.visit(rec),
				new TYPE.Record(new Map<bigint, EntryType>(rec.children.map((c, i) => [c.key.id, [
					{type: TYPE.INT,  optional: false},
					{type: TYPE.BOOL, optional: true},
					{type: TYPE.STR,  optional: false},
				][i]]))),
			);
		});

		test.test('AST.TYPE.{List,Dict,Set,Map}', () => {
			const INT_BOOL: TYPE.Type = TYPE.INT.union(TYPE.BOOL);
			return assertEqualTypes(
				[
					VISITOR.visit(AST.TYPE.List .fromSource('[int | bool]')),
					VISITOR.visit(AST.TYPE.Dict .fromSource('[:int | bool]')),
					VISITOR.visit(AST.TYPE.Set  .fromSource('{int | bool}')),
					VISITOR.visit(AST.TYPE.Map  .fromSource('{int -> bool}')),
				],
				[
					new TYPE.List(INT_BOOL),
					new TYPE.Dict(INT_BOOL),
					new TYPE.Set (INT_BOOL),
					new TYPE.Map (TYPE.INT, TYPE.BOOL),
				],
			);
		});

		test.test('does not throw if value type contains reference type.', () => {
			setupScript(`{
				type A = (int, [float], str);
				type C = (a: int, b: [float], c: str);
				type E = ({float}, {float}, {float});
			}`, {build: false}); // assert does not throw
		});
	});


	test.suite('AST.TYPE.Access', () => {
		/**
		 * Takes a program source text and compares it to the array of expected types.
		 * The format of the program source text must be 0 or more type declarations.
		 * (The source text must be valid!)
		 * The type evaluations are compared to the expected types via `deepStrictEqual`.
		 * If any of the expecteds are Error (or subclasses) constructors, then the expression type is expected to throw, and is tested against that.
		 * @param source    the program source text to parse and analyze
		 * @param start     the index of the first statement to begin comparing (statements before this are ignored)
		 * @param expecteds the expected evaluations of the type-expressions
		 */
		function testTypeEvals(source: string, start: number, expecteds: readonly (TYPE.Type | ConstructorType<Error>)[]): void {
			const {goal, visitors} = setupScript(source, {typeCheck: false});
			try {
				visitors.typeCheck.visit(goal);
			} catch {
				// if type-checking fails, proceed to `assert.throws` below
			}
			const statements: readonly AST.STMT.DeclarationType[] = goal.block!.children.filter((stmt) => stmt instanceof AST.STMT.DeclarationType).slice(start);
			return expecteds.some((it) => it instanceof Function)
				? (assert.strictEqual(statements.length, expecteds.length, 'Arrays are not the same length.'), xjs.Array.forEachAggregated(statements, (stmt, i) => {
					const expected: TYPE.Type | ConstructorType<Error> = expecteds[i];
					return expected instanceof Function
						? assert.throws(() => VISITOR.visit(stmt.assigned), expected)
						: assertEqualTypes(VISITOR.visit(stmt.assigned), expected);
				}))
				: assertEqualTypes(
					statements.map((stmt) => VISITOR.visit(stmt.assigned)),
					expecteds as TYPE.Type[],
				);
		}
		test.test('returns individual entry types.', () => {
			testTypeEvals(`{
				type TupC = (1,   2.0,   "three");
				type TupV = (int, float, str);

				type RecC = (a: 1,   b: 2.0,   _: "three");
				type RecV = (a: int, b: float, _: str);

				type A1 = TupC.0;  % type \`1\`
				type A2 = TupC.1;  % type \`2.0\`
				type A3 = TupC.2;  % type \`"three"\`
				type A4 = TupV.0;  % type \`int\`
				type A5 = TupV.1;  % type \`float\`
				type A6 = TupV.2;  % type \`str\`

				type C1 = RecC.a; % type \`1\`
				type C2 = RecC.b; % type \`2.0\`
				type C3 = RecC._; % type \`"three"\`
				type C4 = RecV.a; % type \`int\`
				type C5 = RecV.b; % type \`float\`
				type C6 = RecV._; % type \`str\`
			}`, 4, [
				typeUnit(1n),
				typeUnit(2.0),
				typeUnit('three'),
				TYPE.INT,
				TYPE.FLOAT,
				TYPE.STR,

				typeUnit(1n),
				typeUnit(2.0),
				typeUnit('three'),
				TYPE.INT,
				TYPE.FLOAT,
				TYPE.STR,
			]);
		});
		test.test('returns Maybe if entry is optional.', () => {
			testTypeEvals(`{
				type TupoC = (1,   2.0,   ?: "three");
				type TupoV = (int, float, ?: str);

				type RecoC = (a: 1,   b?: 2.0,   c: "three");
				type RecoV = (a: int, b?: float, c: str);

				type D1 = TupoC.2; % type \`Maybe["three"]\`
				type D2 = TupoV.2; % type \`Maybe[str]\`

				type E1 = RecoC.b; % type \`Maybe[2.0]\`
				type E2 = RecoV.b; % type \`Maybe[float]\`
			}`, 4, [
				new TYPE.Maybe(typeUnit('three')),
				new TYPE.Maybe(TYPE.STR),

				new TYPE.Maybe(typeUnit(2.0)),
				new TYPE.Maybe(TYPE.FLOAT),
			]);
		});
		test.test('throws when base object is of incorrect type.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				List.<int>.1
				Dict.<int>.b
			`, (src) => assert.throws(() => VISITOR.visit(AST.TYPE.Access.fromSource(src)), TypeErrorNoEntry, src));
		});
		test.test('throws when index is out of bounds / when key is out of range.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				(1, 2.0, "three").3
				(a: 1, b: 2.0, c: "three").d
			`, (src) => assert.throws(() => VISITOR.visit(AST.TYPE.Access.fromSource(src)), TypeErrorNoEntry));
		});
	});


	test.suite('AST.TYPE.Call', () => {
		test.test('evaluates Callable Interface Names.', () => {
			assertEqualTypes(
				[
					'List.<null>',
					'Dict.<bool>',
					'Set.<str>',
					'Map.<int, float>',
					'Maybe.<int>',
					'None.<int>',
					'Some.<int>',
					'Result.<int>',
					'Fail.<int>',
					'Ok.<int>',
					'Result.<int, Exception>',
					'Fail.<int, Exception>',
					'Ok.<int, Exception>',
				].map((src) => VISITOR.visit(AST.TYPE.Call.fromSource(src))),
				[
					new TYPE.List(TYPE.NULL),
					new TYPE.Dict(TYPE.BOOL),
					new TYPE.Set(TYPE.STR),
					new TYPE.Map(TYPE.INT, TYPE.FLOAT),
					new TYPE.Maybe(TYPE.INT),
					new TYPE.None(TYPE.INT),
					new TYPE.Some(TYPE.INT),
					new TYPE.Result(TYPE.INT),
					new TYPE.Fail(TYPE.INT),
					new TYPE.Ok(TYPE.INT),
					new TYPE.Result(TYPE.INT),
					new TYPE.Fail(TYPE.INT),
					new TYPE.Ok(TYPE.INT),
				],
			);
		});
		test.test('throws if base is not a TypeAlias.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				int.<str>
				(int | float).<bool>
			`, (src) => assert.throws(() => VISITOR.visit(AST.TYPE.Call.fromSource(src)), TypeErrorNotCallable));
		});
		test.test('throws when providing incorrect number of arguments.', () => {
			xjs.Array.forEachAggregated(extract_lines`
				List.<null, null>
				Dict.<bool, bool, bool>
				Set.<str, str, str, str>
				Map.<int, int, int, int, int>
				None.<int, int>
				Some.<int, int>
			`, (src) => assert.throws(() => VISITOR.visit(AST.TYPE.Call.fromSource(src)), TypeErrorArgCount));
		});
		test.test('None and Some are disjoint.', () => {
			assert.ok(VISITOR.visit(AST.TYPE.Call.fromSource('None.<int>')).isDisjointWith(VISITOR.visit(AST.TYPE.Call.fromSource('Some.<int>'))));
		});
	});


	test.suite('AST.TYPE.OperationUnary', () => {
		test.test('[operator=MAYBE]', () => {
			assertEqualTypes(
				VISITOR.visit(AST.TYPE.OperationUnary.fromSource('int?')),
				new TYPE.Maybe(TYPE.INT),
			);
		});
		test.test('[operator=RESULT]', () => {
			assertEqualTypes(
				VISITOR.visit(AST.TYPE.OperationUnary.fromSource('int!')),
				new TYPE.Result(TYPE.INT),
			);
		});
		test.suite('[operator=MUTABLE]', () => {
			test.test('does not throw if operating on a reference type.', () => {
				assertEqualTypes(
					VISITOR.visit(AST.TYPE.OperationUnary.fromSource('mut [int]')),
					new TYPE.List(TYPE.INT, true),
				);
				setupScript(`{
					type A = mut [[int]];
					type B = (int, int, int);
					type F = [Object];

					type E = mut Object; % equivalent to \`Object\`
					type G = mut [int] | mut [Object];
				}`, {build: false}); // assert does not throw
			});
			test.test('throws if operating on any non-reference type.', () => {
				[
					'mut (int, float, str)',
					'mut (a: int, b: float, c: str)',
					'mut (int, int, int)',
					'mut nothing',
					'mut anything',
					'mut null',
					'mut bool',
					'mut int',
					'mut float',
					'mut str',
					'mut ([int] | [Object])',
				].forEach((src) => assert.throws(() => VISITOR.visit(AST.TYPE.Operation.fromSource(src)), TypeErrorInvalidOperation));
			});
		});
	});


	test.suite('AST.TYPE.OperationBinary', () => {
		test.test('[operator=AND|OR]', () => {
			assertEqualTypes(
				VISITOR.visit(AST.TYPE.OperationBinary.fromSource('Object & 3')),
				TYPE.OBJ.intersect(typeUnit(3n)),
			);
			assertEqualTypes(
				VISITOR.visit(AST.TYPE.OperationBinary.fromSource('4.2 | int')),
				typeUnit(4.2).union(TYPE.INT),
			);
		});
	});


	test.suite('AST.TYPE.Function', () => {
		test.test('with all required parameters.', () => {
			assertEqualTypes(
				VISITOR.visit(AST.TYPE.Function.fromSource('\\(bool, int | null, alpha: str, bravo: float) => void')),
				new TYPE.Function(TYPE.Tuple.fromTypes([
					TYPE.BOOL,
					TYPE.INT.union(TYPE.NULL),
				]), TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
					[Validator.keyId('alpha'), TYPE.STR],
					[Validator.keyId('bravo'), TYPE.FLOAT],
				]))),
			);
		});
		test.test('with optional parameters.', () => {
			assertEqualTypes(
				VISITOR.visit(AST.TYPE.Function.fromSource('\\(bool, ?: int | null, alpha?: str, bravo: float) => void')),
				new TYPE.Function(new TYPE.Tuple([
					{type: TYPE.BOOL,                 optional: false},
					{type: TYPE.INT.union(TYPE.NULL), optional: true},
				]), new TYPE.Record(new Map<bigint, EntryType>([
					[Validator.keyId('alpha'), {type: TYPE.STR,   optional: true}],
					[Validator.keyId('bravo'), {type: TYPE.FLOAT, optional: false}],
				]))),
			);
		});
		test.test('with return type.', () => {
			assertEqualTypes(
				VISITOR.visit(AST.TYPE.Function.fromSource('\\() => sym')),
				new TYPE.Function(undefined, undefined, TYPE.SYM),
			);
		});
	});
});

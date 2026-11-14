import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	Validator,
	AST,
	type EntryType,
	TYPE,
	VALUE,
} from '../../src/index.ts';
import {
	extract_tokens,
	assertEqualTypes,
	typeUnit,
	setupScript,
} from '../utils.ts';



test.suite('Type', () => {
	const VISITOR = new AST.TypeVisitorTypevalue();

	test.suite('#eval', () => {
		test.suite('TypeCollectionLiteral', () => {
			test.test('TypeTuple', () => {
				assertEqualTypes(
					VISITOR.visit(AST.TYPE.Tuple.fromSource('(int, bool, ?:str)')),
					new TYPE.Tuple([
						{type: TYPE.INT,  optional: false},
						{type: TYPE.BOOL, optional: false},
						{type: TYPE.STR,  optional: true},
					]),
				);
			});

			test.test('TypeRecord', () => {
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

			test.test('Type{List,Dict,Set,Map}', () => {
				const INT_BOOL: TYPE.Type = TYPE.INT.union(TYPE.BOOL);
				assertEqualTypes(
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


		test.suite('TypeFunction', () => {
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



	test.suite('TypeConstant', () => {
		test.suite('#eval', () => {
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
	});



	test.suite('TypeAlias', () => {
		test.suite('#eval', () => {
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
	});
});

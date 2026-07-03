import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	Validator,
	AST,
	type EntryType,
	TYPE,
	VALUE,
	ReferenceErrorUndeclared,
	ReferenceErrorDeadZone,
	ReferenceErrorKind,
} from '../../src/index.ts';
import {
	extract_tokens,
	assertEqualTypes,
	typeUnit,
	setupScript,
} from '../utils.ts';



test.suite('Type', () => {
	test.suite('#eval', () => {
		test.suite('TypeCollectionLiteral', () => {
			test.test('TypeTuple', () => {
				assertEqualTypes(
					AST.TYPE.Tuple.fromSource('(int, bool, ?:str)').eval(),
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
					rec.eval(),
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
						AST.TYPE.List .fromSource('[int | bool]')  .eval(),
						AST.TYPE.Dict .fromSource('[:int | bool]') .eval(),
						AST.TYPE.Set  .fromSource('{int | bool}')  .eval(),
						AST.TYPE.Map  .fromSource('{int -> bool}') .eval(),
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
	});



	test.suite('TypeConstant', () => {
		test.suite('#eval', () => {
			test.test('computes the value of constant null, boolean, symbol, number, and string types.', () => {
				assertEqualTypes(extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
					42  +42  4.2e+3
					"hi"
				`).map((src) => AST.TYPE.Constant.fromSource(src).eval()), [
					TYPE.NULL,
					TYPE.FALSE,
					TYPE.TRUE,
					new VALUE.Symbol(0x54n, 'then').toType(),
					new VALUE.Symbol(0x46n, 'str').toType(),
					new VALUE.Symbol(0x49n, 'false').toType(),
					new VALUE.Symbol(Validator.cookTokenIdentifier('foobar'), 'foobar').toType(),
					typeUnit(42n),
					typeUnit(42n, 'nat'),
					typeUnit(4.2e+3),
					typeUnit('hi'),
				]);
			});
			test.test('computes the value of keyword type.', () => {
				assertEqualTypes(extract_tokens(`
					nothing  bool  sym  int  float  str  anything
				`).map((src) => AST.TYPE.Constant.fromSource(src).eval()), [
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
		test.suite('#varCheck', () => {
			test.test('does not throw when referencing intrinsic identifiers.', () => {
				setupScript(`{
					type T = Object;
					val obj: Object = 42;
				}`, {typeCheck: false}); // assert does not throw
			});
			test.test('throws if the validator does not contain a record for the identifier.', () => {
				setupScript(`{
					type T = int;
					type U = float | T;
				}`, {typeCheck: false}); // assert does not throw
				assert.throws(() => setupScript(`{
					type U = float | T;
				}`, {typeCheck: false}), ReferenceErrorUndeclared);
			});
			test.test('throws when declared in an inner scope.', () => {
				assert.throws(() => setupScript(`{
					if true then {
						type T = int;
					};
					type _ = float | T;
				}`, {typeCheck: false}), ReferenceErrorUndeclared);
			});
			test.test.todo('throws when there is a temporal dead zone.', () => {
				assert.throws(() => setupScript(`{
					T;
					type T = int;
				}`, {typeCheck: false}), ReferenceErrorDeadZone);
			});
			test.test('throws if was declared as a value variable.', () => {
				assert.throws(() => setupScript(`{
					val FOO: int = 42;
					type _ = FOO | float;
				}`, {typeCheck: false}), ReferenceErrorKind);
				assert.throws(() => setupScript(`{
					for FOO: int in [42] do {
						type _ = FOO | float;
					};
				}`, {typeCheck: false}), ReferenceErrorKind);
			});
		});


		test.suite('#eval', () => {
			test.test('computes the value of reserved types.', () => {
				assertEqualTypes([
					'Object',
				].map((src) => AST.TYPE.TypeAlias.fromSource(src).eval()), [
					TYPE.OBJ,
				]);
			});
			test.test('computes the value of a type alias.', () => {
				assert.strictEqual(
					((setupScript(`{
						type T = int;
						type U = T;
					}`).stmts[1] as AST.STMT.DeclarationType).assigned as AST.TYPE.TypeAlias).eval(),
					TYPE.INT,
				);
			});
		});
	});
});

import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	AST,
	type EntryType,
	TYPE,
	VALUE,
	ReferenceErrorUndeclared,
	ReferenceErrorDeadZone,
	ReferenceErrorKind,
} from '../../../src/index.ts';
import {assertEqualTypes} from '../../assert-helpers.ts';
import {
	setupScript,
	typeUnit,
} from '../../helpers.ts';
import {extract_tokens} from '../../utils.ts';



test.suite('ASTNodeType', () => {
	test.suite('#eval', () => {
		test.suite('ASTNodeTypeCollectionLiteral', () => {
			test.test('ASTNodeTypeTuple', () => {
				assertEqualTypes(
					AST.ASTNodeTypeTuple.fromSource('(int, bool, ?:str)').eval(),
					new TYPE.Tuple([
						{type: TYPE.INT,  optional: false},
						{type: TYPE.BOOL, optional: false},
						{type: TYPE.STR,  optional: true},
					]),
				);
			});

			test.test('ASTNodeTypeRecord', () => {
				const rec: AST.ASTNodeTypeRecord = AST.ASTNodeTypeRecord.fromSource('(x: int, y?: bool, _: str)');
				return assertEqualTypes(
					rec.eval(),
					new TYPE.Record(new Map<bigint, EntryType>(rec.children.map((c, i) => [c.key.id, [
						{type: TYPE.INT,  optional: false},
						{type: TYPE.BOOL, optional: true},
						{type: TYPE.STR,  optional: false},
					][i]]))),
				);
			});

			test.test('ASTNodeType{List,Dict,Set,Map}', () => {
				const INT_BOOL: TYPE.Type = TYPE.INT.union(TYPE.BOOL);
				assertEqualTypes(
					[
						AST.ASTNodeTypeList. fromSource('[int | bool]')  .eval(),
						AST.ASTNodeTypeDict .fromSource('[:int | bool]') .eval(),
						AST.ASTNodeTypeSet  .fromSource('{int | bool}')  .eval(),
						AST.ASTNodeTypeMap  .fromSource('{int -> bool}') .eval(),
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



	test.suite('ASTNodeTypeConstant', () => {
		test.suite('#eval', () => {
			test.test('computes the value of constant null, boolean, symbol, number, and string types.', () => {
				assertEqualTypes(extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
					42  +42  4.2e+3
					"hi"
				`).map((src) => AST.ASTNodeTypeConstant.fromSource(src).eval()), [
					TYPE.NULL,
					TYPE.FALSE,
					TYPE.TRUE,
					new VALUE.Symbol(0x92n,  'then').toType(),
					new VALUE.Symbol(0x86n,  'str').toType(),
					new VALUE.Symbol(0x89n,  'false').toType(),
					new VALUE.Symbol(0x100n, 'foobar').toType(),
					typeUnit(42n),
					typeUnit(42n, 'nat'),
					typeUnit(4.2e+3),
					typeUnit('hi'),
				]);
			});
			test.test('computes the value of keyword type.', () => {
				assertEqualTypes(extract_tokens(`
					nothing  bool  sym  int  float  str  anything
				`).map((src) => AST.ASTNodeTypeConstant.fromSource(src).eval()), [
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



	test.suite('ASTNodeTypeAlias', () => {
		test.suite('#varCheck', () => {
			test.test('does not throw when referencing intrinsic identifiers.', () => {
				AST.ASTNodeGoal.fromSource(`{
					type T = Object;
					val obj: Object = 42;
				}`).varCheck(); // assert does not throw
			});
			test.test('throws if the validator does not contain a record for the identifier.', () => {
				AST.ASTNodeGoal.fromSource(`{
					type T = int;
					type U = float | T;
				}`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type U = float | T;
				}`).varCheck(), ReferenceErrorUndeclared);
			});
			test.test('throws when declared in an inner scope.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					if true then {
						type T = int;
					};
					type _ = float | T;
				}`).varCheck(), ReferenceErrorUndeclared);
			});
			test.test.todo('throws when there is a temporal dead zone.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					T;
					type T = int;
				}`).varCheck(), ReferenceErrorDeadZone);
			});
			test.test('throws if was declared as a value variable.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					val FOO: int = 42;
					type _ = FOO | float;
				}`).varCheck(), ReferenceErrorKind);
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					for FOO: int in [42] do {
						type _ = FOO | float;
					};
				}`).varCheck(), ReferenceErrorKind);
			});
		});


		test.suite('#eval', () => {
			test.test('computes the value of reserved types.', () => {
				assertEqualTypes([
					'Object',
				].map((src) => AST.ASTNodeTypeAlias.fromSource(src).eval()), [
					TYPE.OBJ,
				]);
			});
			test.test('computes the value of a type alias.', () => {
				assert.strictEqual(
					((setupScript(`{
						type T = int;
						type U = T;
					}`).stmts[1] as AST.ASTNodeDeclarationType).assigned as AST.ASTNodeTypeAlias).eval(),
					TYPE.INT,
				);
			});
		});
	});
});

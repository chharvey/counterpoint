import * as assert from 'node:assert';
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
import {typeUnit} from '../../helpers.ts';
import {extract_tokens} from '../../utils.ts';



describe('ASTNodeType', () => {
	describe('#eval', () => {
		describe('ASTNodeTypeCollectionLiteral', () => {
			specify('ASTNodeTypeTuple', () => {
				assertEqualTypes(
					AST.ASTNodeTypeTuple.fromSource('(int, bool, ?:str)').eval(),
					new TYPE.Tuple([
						{type: TYPE.INT,  optional: false},
						{type: TYPE.BOOL, optional: false},
						{type: TYPE.STR,  optional: true},
					]),
				);
			});

			specify('ASTNodeTypeRecord', () => {
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

			specify('ASTNodeType{List,Dict,Set,Map}', () => {
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

			it('does not throw if value type contains reference type.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					type A = (int, List.<float>, str);
					type C = (a: int, b: List.<float>, c: str);
					type E = (Set.<float>, Set.<float>, Set.<float>);
				`);
				goal.varCheck();
				goal.typeCheck(); // assert does not throw
			});
		});
	});



	describe('ASTNodeTypeConstant', () => {
		describe('#eval', () => {
			it('computes the value of constant null, boolean, symbol, number, and string types.', () => {
				assertEqualTypes(extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
					42  4.2e+3
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
					typeUnit(4.2e+3),
					typeUnit('hi'),
				]);
			});
			it('computes the value of keyword type.', () => {
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



	describe('ASTNodeTypeAlias', () => {
		describe('#varCheck', () => {
			it('does not throw when referencing intrinsic identifiers.', () => {
				AST.ASTNodeGoal.fromSource(`
					type T = Object;
					let obj: Object = 42;
				`).varCheck(); // assert does not throw
			});
			it('throws if the validator does not contain a record for the identifier.', () => {
				AST.ASTNodeGoal.fromSource(`
					type T = int;
					type U = float | T;
				`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					type U = float | T;
				`).varCheck(), ReferenceErrorUndeclared);
			});
			it.skip('throws when there is a temporal dead zone.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					T;
					type T = int;
				`).varCheck(), ReferenceErrorDeadZone);
			});
			it('throws if was declared as a value variable.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					let FOO: int = 42;
					type T = FOO | float;
				`).varCheck(), ReferenceErrorKind);
			});
		});


		describe('#eval', () => {
			it('computes the value of reserved types.', () => {
				assertEqualTypes([
					'Object',
				].map((src) => AST.ASTNodeTypeAlias.fromSource(src).eval()), [
					TYPE.OBJ,
				]);
			});
			it('computes the value of a type alias.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					type T = int;
					type U = T;
				`);
				goal.varCheck();
				goal.typeCheck();
				return assert.strictEqual(
					((goal
						.children[1] as AST.ASTNodeDeclarationType)
						.assigned as AST.ASTNodeTypeAlias)
						.eval(),
					TYPE.INT,
				);
			});
		});
	});
});

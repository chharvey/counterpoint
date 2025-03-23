import * as assert from 'assert';
import {
	AST,
	type TypeEntry,
	TYPE,
	VALUE,
	TypeError,
	ReferenceErrorUndeclared,
	ReferenceErrorDeadZone,
	ReferenceErrorKind,
} from '../../../src/index.js';
import {typeUnit} from '../../helpers.js';
import {extract_tokens} from '../../utils.js';


describe('ASTNodeType', () => {
	describe('#eval', () => {
		describe('ASTNodeTypeCollectionLiteral', () => {
			specify('ASTNodeTypeTuple', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeTuple.fromSource('[int, bool, ?:str]').eval(),
					new TYPE.Tuple([
						{type: TYPE.INT,  optional: false},
						{type: TYPE.BOOL, optional: false},
						{type: TYPE.STR,  optional: true},
					]),
				);
			});

			specify('ASTNodeTypeRecord', () => {
				const rec: AST.ASTNodeTypeRecord = AST.ASTNodeTypeRecord.fromSource('[x: int, y?: bool, _: str]');
				return assert.deepStrictEqual(
					rec.eval(),
					new TYPE.Record(new Map<bigint, TypeEntry>(rec.children.map((c, i) => [c.key.id, [
						{type: TYPE.INT,  optional: false},
						{type: TYPE.BOOL, optional: true},
						{type: TYPE.STR,  optional: false},
					][i]]))),
				);
			});

			describe('ASTNodeTypeList', () => {
				it('returns a TYPE.List if there is no count.', () => {
					assert.deepStrictEqual(
						AST.ASTNodeTypeList.fromSource('(int | bool)[]').eval(),
						new TYPE.List(TYPE.INT.union(TYPE.BOOL)),
					);
				});
				it('returns a TYPE.Tuple if there is a count.', () => {
					const expected = [
						TYPE.INT.union(TYPE.BOOL),
						TYPE.INT.union(TYPE.BOOL),
						TYPE.INT.union(TYPE.BOOL),
					] as const;
					return assert.deepStrictEqual(
						AST.ASTNodeTypeList.fromSource('(int | bool)[3]').eval(),
						TYPE.Tuple.fromTypes(expected),
					);
				});
				it('throws if count is negative.', () => {
					assert.throws(() => AST.ASTNodeTypeList.fromSource('(int | bool)[-3]').eval(), TypeError);
				});
			});

			specify('ASTNodeType{Dict,Set,Map}', () => {
				assert.deepStrictEqual(
					[
						AST.ASTNodeTypeDict .fromSource('[:int | bool]')  .eval(),
						AST.ASTNodeTypeSet  .fromSource('(int | bool){}') .eval(),
						AST.ASTNodeTypeMap  .fromSource('{int -> bool}')  .eval(),
					],
					[
						new TYPE.Dict(TYPE.INT.union(TYPE.BOOL)),
						new TYPE.Set(TYPE.INT.union(TYPE.BOOL)),
						new TYPE.Map(TYPE.INT, TYPE.BOOL),
					],
				);
			});

			it('does not throw if value type contains reference type.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					type A =   [int, List.<float>, str];
					type C =   [a: int, b: List.<float>, c: str];
					type E = Set.<float>  [3];
				`);
				goal.varCheck();
				goal.typeCheck(); // assert does not throw
			});
		});
	});



	describe('ASTNodeTypeConstant', () => {
		describe('#eval', () => {
			it('computes the value of constant null, boolean, symbol, number, and string types.', () => {
				assert.deepStrictEqual(extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
					42  4.2e+3
					"hi"
				`).map((src) => AST.ASTNodeTypeConstant.fromSource(src).eval()), [
					TYPE.NULL,
					TYPE.FALSE,
					TYPE.TRUE,
					new VALUE.Symbol(0x8fn,  'then').toType(),
					new VALUE.Symbol(0x86n,  'str').toType(),
					new VALUE.Symbol(0x89n,  'false').toType(),
					new VALUE.Symbol(0x100n, 'foobar').toType(),
					typeUnit(42n),
					typeUnit(4.2e+3),
					typeUnit('hi'),
				]);
			});
			it('computes the value of keyword type.', () => {
				assert.deepStrictEqual(extract_tokens(`
					never  void  bool  int  float  str  unknown
				`).map((src) => AST.ASTNodeTypeConstant.fromSource(src).eval()), [
					TYPE.NEVER,
					TYPE.VOID,
					TYPE.BOOL,
					TYPE.INT,
					TYPE.FLOAT,
					TYPE.STR,
					TYPE.UNKNOWN,
				]);
				assert.throws(() => AST.ASTNodeTypeConstant.fromSource('sym').eval(), /Successfully identified the `sym` type keyword/);
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
				assert.deepStrictEqual([
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
				assert.deepStrictEqual(
					((goal
						.children[1] as AST.ASTNodeDeclarationType)
						.assigned as AST.ASTNodeTypeAlias)
						.eval(),
					TYPE.INT,
				);
			});
		});
	});



	describe('ASTNodeTypeOperation', () => {
		specify('#eval', () => {
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationUnary.fromSource('int?').eval(),
				TYPE.INT.union(TYPE.NULL),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationUnary.fromSource('mut int[]').eval(),
				new TYPE.List(TYPE.INT, true),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationBinary.fromSource('Object & 3').eval(),
				TYPE.OBJ.intersect(typeUnit(3n)),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationBinary.fromSource('4.2 | int').eval(),
				typeUnit(4.2).union(TYPE.INT),
			);
		});
	});
});

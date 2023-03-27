import * as assert from 'assert';
import {
	AST,
	type TypeEntry,
	OBJ,
	TYPE,
	TypeError,
	ReferenceError01,
	ReferenceError02,
	ReferenceError03,
	TypeErrorUnexpectedRef,
} from '../../../src/index.js';
import {
	typeUnitInt,
	typeUnitFloat,
} from '../../helpers.js';
import {assertAssignable} from '../../assert-helpers.js';


describe('ASTNodeType', () => {
	/* eslint-disable quotes */
	describe('#eval', () => {
		describe('ASTNodeTypeCollectionLiteral', () => {
			describe('ASTNodeTypeTuple', () => {
				it('returns a Type{Tuple,Vect}.', () => {
					const expected = [
						{type: TYPE.INT,  optional: false},
						{type: TYPE.BOOL, optional: false},
						{type: TYPE.STR,  optional: true},
					] as const;
					return assert.deepStrictEqual(
						[
							AST.ASTNodeTypeTuple.fromSource('  [int, bool, ?:str]').eval(),
							AST.ASTNodeTypeTuple.fromSource('\\[int, bool, ?:str]').eval(),
						],
						[
							new TYPE.TypeTuple (expected),
							new TYPE.TypeVect  (expected),
						],
					);
				});
			});

			describe('ASTNodeTypeRecord', () => {
				it('returns a Type{Record,Struct}.', () => {
					const expected = [
						{type: TYPE.INT,  optional: false},
						{type: TYPE.BOOL, optional: true},
						{type: TYPE.STR,  optional: false},
					] as const;
					const rec: AST.ASTNodeTypeRecord = AST.ASTNodeTypeRecord.fromSource('  [x: int, y?: bool, z: str]');
					const str: AST.ASTNodeTypeRecord = AST.ASTNodeTypeRecord.fromSource('\\[x: int, y?: bool, z: str]');
					return assert.deepStrictEqual(
						[
							rec.eval(),
							str.eval(),
						],
						[
							new TYPE.TypeRecord(new Map<bigint, TypeEntry>(rec.children.map((c, i) => [c.key.id, expected[i]]))),
							new TYPE.TypeStruct(new Map<bigint, TypeEntry>(str.children.map((c, i) => [c.key.id, expected[i]]))),
						],
					);
				});
			});

			describe('ASTNodeTypeList', () => {
				it('returns a TypeList if there is no count.', () => {
					assert.deepStrictEqual(
						AST.ASTNodeTypeList.fromSource(`(int | bool)[]`).eval(),
						new TYPE.TypeList(TYPE.INT.union(TYPE.BOOL)),
					);
				});
				it('returns a Type{Tuple,Vect} if there is a count.', () => {
					const expected = [
						TYPE.INT.union(TYPE.BOOL),
						TYPE.INT.union(TYPE.BOOL),
						TYPE.INT.union(TYPE.BOOL),
					] as const;
					return assert.deepStrictEqual(
						[
							AST.ASTNodeTypeList.fromSource('(int | bool)  [3]').eval(),
							AST.ASTNodeTypeList.fromSource('(int | bool)\\[3]').eval(),
						],
						[
							TYPE.TypeTuple .fromTypes(expected),
							TYPE.TypeVect  .fromTypes(expected),
						],
					);
				});
				it('throws if count is negative.', () => {
					       assert.throws(() => AST.ASTNodeTypeList.fromSource('(int | bool)  [-3]').eval(), TypeError);
					return assert.throws(() => AST.ASTNodeTypeList.fromSource('(int | bool)\\[-3]').eval(), TypeError);
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
						new TYPE.TypeDict(TYPE.INT.union(TYPE.BOOL)),
						new TYPE.TypeSet(TYPE.INT.union(TYPE.BOOL)),
						new TYPE.TypeMap(TYPE.INT, TYPE.BOOL),
					],
				);
			});

			it('throws if value type contains reference type.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					type val_type1 = \\[1.0];
					type ref_type1 =   [1.0];
					type val_type2 = \\[2.0];
					type ref_type2 =   [2.0];
					type val_type3 = \\[3.0];
					type ref_type3 =   [3.0];
					type val_type4 = \\[4.0];
					type ref_type4 =   [4.0];
					type val_type5 = \\[5.0];
					type ref_type5 =   [5.0];
					type val_type6 = \\[6.0];
					type ref_type6 =   [6.0];

					type A = \\[int, val_type1, str];
					type B =   [int, ref_type1, str];
					type C =   [int, val_type2, str];
					type D = \\[int, ref_type2, str]; %> TypeErrorUnexpectedRef

					type E = \\[a: int, b: val_type3, c: str];
					type F =   [a: int, b: ref_type3, c: str];
					type G =   [a: int, b: val_type4, c: str];
					type H = \\[a: int, b: ref_type4, c: str]; %> TypeErrorUnexpectedRef

					type I = val_type5\\[3];
					type J = ref_type5  [3];
					type K = val_type6  [3];
					type L = ref_type6\\[3]; %> TypeErrorUnexpectedRef
				`);
				goal.varCheck();
				return assert.throws(() => goal.typeCheck(), (err) => {
					assert.ok(err instanceof AggregateError);
					assertAssignable(err, {
						cons:   AggregateError,
						errors: [
							{cons: TypeErrorUnexpectedRef, message: 'Encountered reference type `[2.0]` but was expecting a value type.'},
							{cons: TypeErrorUnexpectedRef, message: 'Encountered reference type `[4.0]` but was expecting a value type.'},
							{cons: TypeErrorUnexpectedRef, message: 'Encountered reference type `[6.0]` but was expecting a value type.'},
						],
					});
					return true;
				});
			});
		});
	});



	describe('ASTNodeTypeConstant', () => {
		describe('#eval', () => {
			it('computes the value of constant null, boolean, or number types.', () => {
				assert.deepStrictEqual([
					`null`,
					`false`,
					`true`,
					`42`,
					`4.2e+3`,
				].map((src) => AST.ASTNodeTypeConstant.fromSource(src).eval()), [
					TYPE.NULL,
					OBJ.Boolean.FALSETYPE,
					OBJ.Boolean.TRUETYPE,
					typeUnitInt(42n),
					typeUnitFloat(4.2e+3),
				]);
			});
			it('computes the value of keyword type.', () => {
				assert.deepStrictEqual([
					'bool',
					'int',
					'float',
					'obj',
				].map((src) => AST.ASTNodeTypeConstant.fromSource(src).eval()), [
					TYPE.BOOL,
					TYPE.INT,
					TYPE.FLOAT,
					TYPE.OBJ,
				]);
			});
		});
	});



	describe('ASTNodeTypeAlias', () => {
		describe('#varCheck', () => {
			it('throws if the validator does not contain a record for the identifier.', () => {
				AST.ASTNodeGoal.fromSource(`
					type T = int;
					type U = float | T;
				`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					type U = float | T;
				`).varCheck(), ReferenceError01);
			});
			it.skip('throws when there is a temporal dead zone.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					T;
					type T = int;
				`).varCheck(), ReferenceError02);
			});
			it('throws if was declared as a value variable.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					let FOO: int = 42;
					type T = FOO | float;
				`).varCheck(), ReferenceError03);
			});
		});


		describe('#eval', () => {
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
	/* eslint-enable quotes */
});

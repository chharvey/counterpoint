import * as assert from 'assert';
import {
	AST,
	type TypeEntry,
	OBJ,
	TYPE,
	TypeError,
	ReferenceErrorUndeclared,
	ReferenceErrorDeadZone,
	ReferenceErrorKind,
} from '../../../src/index.js';
import {
	typeUnitInt,
	typeUnitFloat,
	typeUnitStr,
} from '../../helpers.js';


describe('ASTNodeType', () => {
	describe('#eval', () => {
		describe('ASTNodeTypeCollectionLiteral', () => {
			describe('ASTNodeTypeTuple', () => {
				it('returns a TypeTuple.', () => {
					const expected = [
						{type: TYPE.INT,  optional: false},
						{type: TYPE.BOOL, optional: false},
						{type: TYPE.STR,  optional: true},
					] as const;
					return assert.deepStrictEqual(
						AST.ASTNodeTypeTuple.fromSource('[int, bool, ?:str]').eval(),
						new TYPE.TypeTuple(expected),
					);
				});
			});

			describe('ASTNodeTypeRecord', () => {
				it('returns a TypeRecord.', () => {
					const expected = [
						{type: TYPE.INT,  optional: false},
						{type: TYPE.BOOL, optional: true},
						{type: TYPE.STR,  optional: false},
					] as const;
					const rec: AST.ASTNodeTypeRecord = AST.ASTNodeTypeRecord.fromSource('  [x: int, y?: bool, z: str]');
					return assert.deepStrictEqual(
						rec.eval(),
						new TYPE.TypeRecord(new Map<bigint, TypeEntry>(rec.children.map((c, i) => [c.key.id, expected[i]]))),
					);
				});
			});

			describe('ASTNodeTypeList', () => {
				it('returns a TypeList if there is no count.', () => {
					assert.deepStrictEqual(
						AST.ASTNodeTypeList.fromSource('(int | bool)[]').eval(),
						new TYPE.TypeList(TYPE.INT.union(TYPE.BOOL)),
					);
				});
				it('returns a TypeTuple if there is a count.', () => {
					const expected = [
						TYPE.INT.union(TYPE.BOOL),
						TYPE.INT.union(TYPE.BOOL),
						TYPE.INT.union(TYPE.BOOL),
					] as const;
					return assert.deepStrictEqual(
						AST.ASTNodeTypeList.fromSource('(int | bool)[3]').eval(),
						TYPE.TypeTuple.fromTypes(expected),
					);
				});
				it('throws if count is negative.', () => {
					       assert.throws(() => AST.ASTNodeTypeList.fromSource('(int | bool)  [-3]').eval(), TypeError);
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
			it('computes the value of constant null, boolean, or number types.', () => {
				assert.deepStrictEqual([
					'null',
					'false',
					'true',
					'42',
					'4.2e+3',
					'"hi"',
				].map((src) => AST.ASTNodeTypeConstant.fromSource(src).eval()), [
					TYPE.NULL,
					OBJ.Boolean.FALSETYPE,
					OBJ.Boolean.TRUETYPE,
					typeUnitInt(42n),
					typeUnitFloat(4.2e+3),
					typeUnitStr('hi'),
				]);
			});
			it('computes the value of keyword type.', () => {
				assert.deepStrictEqual([
					'never',
					'void',
					'bool',
					'int',
					'float',
					'str',
					'unknown',
				].map((src) => AST.ASTNodeTypeConstant.fromSource(src).eval()), [
					TYPE.NEVER,
					TYPE.VOID,
					TYPE.BOOL,
					TYPE.INT,
					TYPE.FLOAT,
					TYPE.STR,
					TYPE.UNKNOWN,
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
});

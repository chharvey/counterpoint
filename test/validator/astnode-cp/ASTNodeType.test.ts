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
} from '../../../src/index.js';
import {
	typeUnitInt,
	typeUnitFloat,
} from '../../helpers.js';


describe('ASTNodeType', () => {
	/* eslint-disable quotes */
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



	describe('ASTNodeTypeTuple', () => {
		specify('#eval', () => {
			assert.deepStrictEqual(
				AST.ASTNodeTypeTuple.fromSource(`[int, bool, ?:str]`).eval(),
				new TYPE.TypeTuple([
					{type: TYPE.INT,  optional: false},
					{type: TYPE.BOOL, optional: false},
					{type: TYPE.STR,  optional: true},
				]),
			);
		});
	});



	describe('ASTNodeTypeRecord', () => {
		// #varCheck --- see `ASTNodeRecord#varCheck` tests
		specify('#eval', () => {
			const node: AST.ASTNodeTypeRecord = AST.ASTNodeTypeRecord.fromSource(`[x: int, y?: bool, _: str]`);
			assert.deepStrictEqual(
				node.eval(),
				new TYPE.TypeRecord(new Map<bigint, TypeEntry>(node.children.map((c, i) => [
					c.key.id,
					[
						{type: TYPE.INT,  optional: false},
						{type: TYPE.BOOL, optional: true},
						{type: TYPE.STR,  optional: false},
					][i],
				]))),
			);
		});
	});



	describe('ASTNodeTypeList', () => {
		describe('#eval', () => {
			it('returns a TypeList if there is no count.', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeList.fromSource(`(int | bool)[]`).eval(),
					new TYPE.TypeList(TYPE.INT.union(TYPE.BOOL)),
				);
			});
			it('returns a TypeTuple if there is a count.', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeList.fromSource(`(int | bool)[3]`).eval(),
					TYPE.TypeTuple.fromTypes([
						TYPE.INT.union(TYPE.BOOL),
						TYPE.INT.union(TYPE.BOOL),
						TYPE.INT.union(TYPE.BOOL),
					]),
				);
			});
			it('throws if count is negative.', () => {
				assert.throws(() => AST.ASTNodeTypeList.fromSource(`(int | bool)[-3]`).eval(), TypeError);
			});
		});
	});



	describe('ASTNodeType{Dict,Set,Map}', () => {
		specify('#eval', () => {
			assert.deepStrictEqual(
				AST.ASTNodeTypeDict.fromSource(`[:int | bool]`).eval(),
				new TYPE.TypeDict(TYPE.INT.union(TYPE.BOOL)),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeSet.fromSource(`(int | bool){}`).eval(),
				new TYPE.TypeSet(TYPE.INT.union(TYPE.BOOL)),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeMap.fromSource(`{int -> bool}`).eval(),
				new TYPE.TypeMap(TYPE.INT, TYPE.BOOL),
			);
		});
	});



	describe('ASTNodeTypeOperation', () => {
		specify('#eval', () => {
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationUnary.fromSource(`int?`).eval(),
				TYPE.INT.union(TYPE.NULL),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationUnary.fromSource(`mutable int[]`).eval(),
				new TYPE.TypeList(TYPE.INT, true),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationBinary.fromSource(`obj & 3`).eval(),
				TYPE.OBJ.intersect(typeUnitInt(3n)),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationBinary.fromSource(`4.2 | int`).eval(),
				typeUnitFloat(4.2).union(TYPE.INT),
			);
		});
	});
	/* eslint-enable quotes */
});

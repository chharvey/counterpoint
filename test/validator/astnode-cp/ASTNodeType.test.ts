import * as assert from 'assert';
import {
	AST,
	TypeEntry,
	TYPE,
	SolidBoolean,
	SolidTypeError,
	ReferenceError01,
	ReferenceError02,
	ReferenceError03,
} from '../../../src/index.js';
import {
	typeConstInt,
	typeConstFloat,
} from '../../helpers.js';


describe('ASTNodeType', () => {
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
					TYPE.Type.NULL,
					SolidBoolean.FALSETYPE,
					SolidBoolean.TRUETYPE,
					typeConstInt(42n),
					typeConstFloat(4.2e+3),
				]);
			});
			it('computes the value of keyword type.', () => {
				assert.deepStrictEqual([
					'bool',
					'int',
					'float',
					'obj',
				].map((src) => AST.ASTNodeTypeConstant.fromSource(src).eval()), [
					TYPE.Type.BOOL,
					TYPE.Type.INT,
					TYPE.Type.FLOAT,
					TYPE.Type.OBJ,
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
					TYPE.Type.INT,
				);
			});
		});
	});



	specify('ASTNodeTypeTuple', () => {
		specify('#eval', () => {
			assert.deepStrictEqual(
				AST.ASTNodeTypeTuple.fromSource(`[int, bool, ?:str]`).eval(),
				new TYPE.SolidTypeTuple([
					{type: TYPE.Type.INT,  optional: false},
					{type: TYPE.Type.BOOL, optional: false},
					{type: TYPE.Type.STR,  optional: true},
				]),
			);
		});
	});



	specify('ASTNodeTypeRecord', () => {
		specify('#eval', () => {
			const node: AST.ASTNodeTypeRecord = AST.ASTNodeTypeRecord.fromSource(`[x: int, y?: bool, z: str]`);
			assert.deepStrictEqual(
				node.eval(),
				new TYPE.SolidTypeRecord(new Map<bigint, TypeEntry>(node.children.map((c, i) => [
					c.key.id,
					[
						{type: TYPE.Type.INT,  optional: false},
						{type: TYPE.Type.BOOL, optional: true},
						{type: TYPE.Type.STR,  optional: false},
					][i],
				]))),
			);
		});
	});



	describe('ASTNodeTypeList', () => {
		describe('#eval', () => {
			it('returns a SolidTypeList if there is no count.', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeList.fromSource(`(int | bool)[]`).eval(),
					new TYPE.SolidTypeList(TYPE.Type.INT.union(TYPE.Type.BOOL)),
				);
			});
			it('returns a SolidTypeTuple if there is a count.', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeList.fromSource(`(int | bool)[3]`).eval(),
					TYPE.SolidTypeTuple.fromTypes([
						TYPE.Type.INT.union(TYPE.Type.BOOL),
						TYPE.Type.INT.union(TYPE.Type.BOOL),
						TYPE.Type.INT.union(TYPE.Type.BOOL),
					]),
				);
			});
			it('throws if count is negative.', () => {
				assert.throws(() => AST.ASTNodeTypeList.fromSource(`(int | bool)[-3]`).eval(), SolidTypeError);
			});
		});
	});



	describe('ASTNodeType{Dict,Set,Map}', () => {
		specify('#eval', () => {
			assert.deepStrictEqual(
				AST.ASTNodeTypeDict.fromSource(`[:int | bool]`).eval(),
				new TYPE.SolidTypeDict(TYPE.Type.INT.union(TYPE.Type.BOOL)),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeSet.fromSource(`(int | bool){}`).eval(),
				new TYPE.SolidTypeSet(TYPE.Type.INT.union(TYPE.Type.BOOL)),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeMap.fromSource(`{int -> bool}`).eval(),
				new TYPE.SolidTypeMap(TYPE.Type.INT, TYPE.Type.BOOL),
			);
		});
	});



	describe('ASTNodeTypeOperation', () => {
		specify('#eval', () => {
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationUnary.fromSource(`int?`).eval(),
				TYPE.Type.INT.union(TYPE.Type.NULL),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationUnary.fromSource(`mutable int[]`).eval(),
				new TYPE.SolidTypeList(TYPE.Type.INT, true),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationBinary.fromSource(`obj & 3`).eval(),
				TYPE.Type.OBJ.intersect(typeConstInt(3n)),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationBinary.fromSource(`4.2 | int`).eval(),
				typeConstFloat(4.2).union(TYPE.Type.INT),
			);
		});
	});
});

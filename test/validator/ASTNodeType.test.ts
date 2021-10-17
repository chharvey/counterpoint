import * as assert from 'assert';
import {
	// {ASTNodeKey, ...} as AST,
	Validator,
	TypeEntry,
	SolidType,
	SolidTypeTuple,
	SolidTypeRecord,
	SolidTypeList,
	SolidTypeHash,
	SolidTypeSet,
	SolidTypeMap,
	SolidObject,
	SolidBoolean,
	ReferenceError01,
	ReferenceError02,
	ReferenceError03,
} from '../../src/index.js';
import * as AST from '../../src/validator/astnode/index.js'; // HACK
import {
	typeConstInt,
	typeConstFloat,
} from '../helpers.js';


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
				].map((src) => AST.ASTNodeTypeConstant.fromSource(src).eval(new Validator())), [
					SolidType.NULL,
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
				].map((src) => AST.ASTNodeTypeConstant.fromSource(src).eval(new Validator())), [
					SolidType.BOOL,
					SolidType.INT,
					SolidType.FLOAT,
					SolidObject,
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
				`).varCheck(new Validator()); // assert does not throw
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					type U = float | T;
				`).varCheck(new Validator()), ReferenceError01);
			});
			it.skip('throws when there is a temporal dead zone.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					T;
					type T = int;
				`).varCheck(new Validator()), ReferenceError02);
			});
			it('throws if was declared as a value variable.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					let FOO: int = 42;
					type T = FOO | float;
				`).varCheck(new Validator()), ReferenceError03);
			});
		});


		describe('#eval', () => {
			it('computes the value of a type alias.', () => {
				const validator: Validator = new Validator();
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					type T = int;
					type U = T;
				`);
				goal.varCheck(validator);
				goal.typeCheck(validator);
				assert.deepStrictEqual(
					((goal
						.children[1] as AST.ASTNodeDeclarationType)
						.assigned as AST.ASTNodeTypeAlias)
						.eval(validator),
					SolidType.INT,
				);
			});
		});
	});



	specify('ASTNodeTypeTuple', () => {
		specify('#eval', () => {
			assert.deepStrictEqual(
				AST.ASTNodeTypeTuple.fromSource(`[int, bool, ?:str]`).eval(new Validator()),
				new SolidTypeTuple([
					{type: SolidType.INT,  optional: false},
					{type: SolidType.BOOL, optional: false},
					{type: SolidType.STR,  optional: true},
				]),
			);
		});
	});



	specify('ASTNodeTypeRecord', () => {
		specify('#eval', () => {
			const node: AST.ASTNodeTypeRecord = AST.ASTNodeTypeRecord.fromSource(`[x: int, y?: bool, z: str]`);
			assert.deepStrictEqual(
				node.eval(new Validator()),
				new SolidTypeRecord(new Map<bigint, TypeEntry>(node.children.map((c, i) => [
					c.key.id,
					[
						{type: SolidType.INT,  optional: false},
						{type: SolidType.BOOL, optional: true},
						{type: SolidType.STR,  optional: false},
					][i],
				]))),
			);
		});
	});



	describe('ASTNodeTypeList', () => {
		describe('#eval', () => {
			it('returns a SolidTypeList if there is no count.', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeList.fromSource(`(int | bool)[]`).eval(new Validator()),
					new SolidTypeList(SolidType.INT.union(SolidType.BOOL)),
				);
			});
			it('returns a SolidTypeTuple if there is a count.', () => {
				assert.deepStrictEqual(
					AST.ASTNodeTypeList.fromSource(`(int | bool)[3]`).eval(new Validator()),
					SolidTypeTuple.fromTypes([
						SolidType.INT.union(SolidType.BOOL),
						SolidType.INT.union(SolidType.BOOL),
						SolidType.INT.union(SolidType.BOOL),
					]),
				);
			});
		});
	});



	describe('ASTNodeType{Hash,Set,Map}', () => {
		specify('#eval', () => {
			assert.deepStrictEqual(
				AST.ASTNodeTypeHash.fromSource(`[:int | bool]`).eval(new Validator()),
				new SolidTypeHash(SolidType.INT.union(SolidType.BOOL)),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeSet.fromSource(`(int | bool){}`).eval(new Validator()),
				new SolidTypeSet(SolidType.INT.union(SolidType.BOOL)),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeMap.fromSource(`{int -> bool}`).eval(new Validator()),
				new SolidTypeMap(SolidType.INT, SolidType.BOOL),
			);
		});
	});



	describe('ASTNodeTypeOperation', () => {
		specify('#eval', () => {
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationUnary.fromSource(`int?`).eval(new Validator()),
				SolidType.INT.union(SolidType.NULL),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationUnary.fromSource(`mutable int[]`).eval(new Validator()),
				new SolidTypeList(SolidType.INT).mutableOf(),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationBinary.fromSource(`obj & 3`).eval(new Validator()),
				SolidObject.intersect(typeConstInt(3n)),
			);
			assert.deepStrictEqual(
				AST.ASTNodeTypeOperationBinary.fromSource(`4.2 | int`).eval(new Validator()),
				typeConstFloat(4.2).union(SolidType.INT),
			);
		});
	});
});

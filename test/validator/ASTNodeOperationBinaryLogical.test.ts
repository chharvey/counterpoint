import * as assert from 'assert';
import {
	Operator,
	// {ASTNodeKey, ...} as AST,
	Validator,
	SolidType,
	SolidTypeConstant,
	SolidObject,
	SolidNull,
	SolidBoolean,
	Int16,
	Float64,
	SolidString,
	Builder,
	INST,
} from '../../src/index.js';
import * as AST from '../../src/validator/astnode/index.js'; // HACK
import {
	assertEqualTypes,
} from '../assert-helpers.js';
import {
	typeOperations,
	foldOperations,
	CONFIG_FOLDING_OFF,
	TYPE_CONST_NULL,
	typeConstInt,
	typeConstFloat,
	typeConstStr,
	instructionConstInt,
	instructionConstFloat,
} from '../helpers.js';



describe('ASTNodeOperationBinaryLogical', () => {
	describe('#type', () => {
		it('with constant folding on.', () => {
			typeOperations(new Map<string, SolidObject>([
				[`null  && false;`, SolidNull.NULL],
				[`false && null;`,  SolidBoolean.FALSE],
				[`true  && null;`,  SolidNull.NULL],
				[`false && 42;`,    SolidBoolean.FALSE],
				[`4.2   && true;`,  SolidBoolean.TRUE],
				[`null  || false;`, SolidBoolean.FALSE],
				[`false || null;`,  SolidNull.NULL],
				[`true  || null;`,  SolidBoolean.TRUE],
				[`false || 42;`,    new Int16(42n)],
				[`4.2   || true;`,  new Float64(4.2)],
			]));
		});
		context('with constant folding off.', () => {
			describe('[operator=AND]', () => {
				it('returns `left` if it’s a subtype of `void | null | false`.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let unfixed a: null = null;
						let unfixed b: null | false = null;
						let unfixed c: null | void = null;
						a && 42;
						b && 42;
						c && 42;
					`, CONFIG_FOLDING_OFF);
					const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
					goal.varCheck(validator);
					goal.typeCheck(validator);
					assert.deepStrictEqual(goal.children.slice(3).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type(validator)), [
						SolidNull,
						SolidNull.union(SolidBoolean.FALSETYPE),
						SolidNull.union(SolidType.VOID),
					]);
				});
				it('returns `T | right` if left is a supertype of `T narrows void | null | false`.', () => {
					const hello: SolidTypeConstant = typeConstStr('hello');
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let unfixed a: null | int = null;
						let unfixed b: null | int = 42;
						let unfixed c: bool = false;
						let unfixed d: bool | float = 4.2;
						let unfixed e: str | void = 'hello';
						a && 'hello';
						b && 'hello';
						c && 'hello';
						d && 'hello';
						e && 42;
					`, CONFIG_FOLDING_OFF);
					const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
					goal.varCheck(validator);
					goal.typeCheck(validator);
					assert.deepStrictEqual(goal.children.slice(5).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type(validator)), [
						SolidNull.union(hello),
						SolidNull.union(hello),
						SolidBoolean.FALSETYPE.union(hello),
						SolidBoolean.FALSETYPE.union(hello),
						SolidType.VOID.union(typeConstInt(42n)),
					]);
				});
				it('returns `right` if left does not contain `void` nor `null` nor `false`.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let unfixed a: int = 42;
						let unfixed b: float = 4.2;
						a && true;
						b && null;
					`, CONFIG_FOLDING_OFF);
					const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
					goal.varCheck(validator);
					goal.typeCheck(validator);
					assert.deepStrictEqual(goal.children.slice(2).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type(validator)), [
						SolidBoolean.TRUETYPE,
						TYPE_CONST_NULL,
					]);
				});
			});
			describe('[operator=OR]', () => {
				it('returns `right` if it’s a subtype of `void | null | false`.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let unfixed a: null = null;
						let unfixed b: null | false = null;
						let unfixed c: null | void = null;
						a || false;
						b || 42;
						c || 4.2;
					`, CONFIG_FOLDING_OFF);
					const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
					goal.varCheck(validator);
					goal.typeCheck(validator);
					assert.deepStrictEqual(goal.children.slice(3).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type(validator)), [
						SolidBoolean.FALSETYPE,
						typeConstInt(42n),
						typeConstFloat(4.2),
					]);
				});
				it('returns `(left - T) | right` if left is a supertype of `T narrows void | null | false`.', () => {
					const hello: SolidTypeConstant = typeConstStr('hello');
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let unfixed a: null | int = null;
						let unfixed b: null | int = 42;
						let unfixed c: bool = false;
						let unfixed d: bool | float = 4.2;
						let unfixed e: str | void = 'hello';
						a || 'hello';
						b || 'hello';
						c || 'hello';
						d || 'hello';
						e || 42;
					`, CONFIG_FOLDING_OFF);
					const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
					goal.varCheck(validator);
					goal.typeCheck(validator);
					assertEqualTypes(goal.children.slice(5).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type(validator)), [
						Int16.union(hello),
						Int16.union(hello),
						SolidBoolean.TRUETYPE.union(hello),
						SolidBoolean.TRUETYPE.union(Float64).union(hello),
						SolidString.union(typeConstInt(42n)),
					]);
				});
				it('returns `left` if it does not contain `void` nor `null` nor `false`.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let unfixed a: int = 42;
						let unfixed b: float = 4.2;
						a || true;
						b || null;
					`, CONFIG_FOLDING_OFF);
					const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
					goal.varCheck(validator);
					goal.typeCheck(validator);
					assert.deepStrictEqual(goal.children.slice(2).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type(validator)), [
						Int16,
						Float64,
					]);
				});
			});
		});
	});


	specify('#fold', () => {
		foldOperations(new Map<string, SolidObject>([
			[`null && 5;`,     SolidNull.NULL],
			[`null || 5;`,     new Int16(5n)],
			[`5 && null;`,     SolidNull.NULL],
			[`5 || null;`,     new Int16(5n)],
			[`5.1 && true;`,   SolidBoolean.TRUE],
			[`5.1 || true;`,   new Float64(5.1)],
			[`3.1 && 5;`,      new Int16(5n)],
			[`3.1 || 5;`,      new Float64(3.1)],
			[`false && null;`, SolidBoolean.FALSE],
			[`false || null;`, SolidNull.NULL],
		]));
	});


	describe('#build', () => {
		it('returns InstructionBinopLogical.', () => {
			assert.deepStrictEqual([
				`42 && 420;`,
				`4.2 || -420;`,
				`null && 201.0e-1;`,
				`true && 201.0e-1;`,
				`false || null;`,
			].map((src) => AST.ASTNodeOperationBinaryLogical.fromSource(src, CONFIG_FOLDING_OFF).build(new Builder(src, CONFIG_FOLDING_OFF))), [
				new INST.InstructionBinopLogical(
					0n,
					Operator.AND,
					instructionConstInt(42n),
					instructionConstInt(420n),
				),
				new INST.InstructionBinopLogical(
					0n,
					Operator.OR,
					instructionConstFloat(4.2),
					instructionConstFloat(-420.0),
				),
				new INST.InstructionBinopLogical(
					0n,
					Operator.AND,
					instructionConstFloat(0.0),
					instructionConstFloat(20.1),
				),
				new INST.InstructionBinopLogical(
					0n,
					Operator.AND,
					instructionConstFloat(1.0),
					instructionConstFloat(20.1),
				),
				new INST.InstructionBinopLogical(
					0n,
					Operator.OR,
					instructionConstInt(0n),
					instructionConstInt(0n),
				),
			]);
		});
		it('counts internal variables correctly.', () => {
			const src: string = `1 && 2 || 3 && 4;`
			assert.deepStrictEqual(
				AST.ASTNodeOperationBinaryLogical.fromSource(src, CONFIG_FOLDING_OFF).build(new Builder(src, CONFIG_FOLDING_OFF)),
				new INST.InstructionBinopLogical(
					0n,
					Operator.OR,
					new INST.InstructionBinopLogical(
						1n,
						Operator.AND,
						instructionConstInt(1n),
						instructionConstInt(2n),
					),
					new INST.InstructionBinopLogical(
						2n,
						Operator.AND,
						instructionConstInt(3n),
						instructionConstInt(4n),
					),
				),
			);
		});
	});
});

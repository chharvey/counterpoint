import * as assert from 'assert';
import {
	Dev,
	Operator,
	// {ASTNodeKey, ...} as AST,
	Validator,
	SolidObject,
	Int16,
	Float64,
	INST,
	TypeError01,
	NanError01,
} from '../../src/index.js';
import * as AST from '../../src/validator/astnode/index.js'; // HACK
import {
	foldOperations,
	buildOperations,
	typeOfOperationFromSource,
	CONFIG_FOLDING_OFF,
	typeConstInt,
	typeConstFloat,
	instructionConstInt,
	instructionConstFloat,
} from '../helpers.js';



describe('ASTNodeOperationBinaryArithmetic', () => {
	describe('#type', () => {
		context('with constant folding and int coersion on.', () => {
			it('returns a constant Integer type for any operation of integers.', () => {
				assert.deepStrictEqual(AST.ASTNodeOperationBinaryArithmetic.fromSource(`7 * 3 * 2;`).type(new Validator()), typeConstInt(7n * 3n * 2n));
			});
			it('returns a constant Float type for any operation of mix of integers and floats.', () => {
				assert.deepStrictEqual(AST.ASTNodeOperationBinaryArithmetic.fromSource(`3.0 * 2.7;`)   .type(new Validator()), typeConstFloat(3.0 * 2.7));
				assert.deepStrictEqual(AST.ASTNodeOperationBinaryArithmetic.fromSource(`7 * 3.0 * 2;`) .type(new Validator()), typeConstFloat(7 * 3.0 * 2));
			});
		});
		context('with folding off but int coersion on.', () => {
			const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
			it('returns Integer for integer arithmetic.', () => {
				const node: AST.ASTNodeOperationBinaryArithmetic = AST.ASTNodeOperationBinaryArithmetic.fromSource(`(7 + 3) * 2;`, CONFIG_FOLDING_OFF);
				assert.deepStrictEqual(node.type(validator), Int16);
				assert.deepStrictEqual(
					[node.operand0.type(validator), node.operand1.type(validator)],
					[Int16,                         typeConstInt(2n)],
				);
			});
			it('returns Float for float arithmetic.', () => {
				const node: AST.ASTNodeOperationBinaryArithmetic = AST.ASTNodeOperationBinaryArithmetic.fromSource(`7 * 3.0 ^ 2;`, CONFIG_FOLDING_OFF);
				assert.deepStrictEqual(node.type(validator), Float64);
				assert.deepStrictEqual(
					[node.operand0.type(validator), node.operand1.type(validator)],
					[typeConstInt(7n),              Float64],
				);
			});
		});
		context('with folding and int coersion off.', () => {
			it('returns `Integer` if both operands are ints.', () => {
				assert.deepStrictEqual(typeOfOperationFromSource(`7 * 3;`), Int16);
			})
			it('returns `Float` if both operands are floats.', () => {
				assert.deepStrictEqual(typeOfOperationFromSource(`7.0 - 3.0;`), Float64);
			})
			it('throws TypeError for invalid type operations.', () => {
				assert.throws(() => typeOfOperationFromSource(`7.0 + 3;`), TypeError01);
			});
		});
		it('throws for arithmetic operation of non-numbers.', () => {
			[
				`null + 5;`,
				`5 * null;`,
				`false - 2;`,
				`2 / true;`,
				`null ^ false;`,
				...(Dev.supports('stringConstant-assess') ? [`'hello' + 5;`] : []),
			].forEach((src) => {
				assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource(src).type(new Validator()), TypeError01);
			});
		});
	});


	describe('#fold', () => {
		it('computes the value of an integer operation of constants.', () => {
			foldOperations(new Map([
				[`42 + 420;`,           new Int16(42n + 420n)],
				[`42 - 420;`,           new Int16(42n + -420n)],
				[` 126 /  3;`,          new Int16(BigInt(Math.trunc( 126 /  3)))],
				[`-126 /  3;`,          new Int16(BigInt(Math.trunc(-126 /  3)))],
				[` 126 / -3;`,          new Int16(BigInt(Math.trunc( 126 / -3)))],
				[`-126 / -3;`,          new Int16(BigInt(Math.trunc(-126 / -3)))],
				[` 200 /  3;`,          new Int16(BigInt(Math.trunc( 200 /  3)))],
				[` 200 / -3;`,          new Int16(BigInt(Math.trunc( 200 / -3)))],
				[`-200 /  3;`,          new Int16(BigInt(Math.trunc(-200 /  3)))],
				[`-200 / -3;`,          new Int16(BigInt(Math.trunc(-200 / -3)))],
				[`42 ^ 2 * 420;`,       new Int16((42n ** 2n * 420n) % (2n ** 16n))],
				[`2 ^ 15 + 2 ^ 14;`,    new Int16(-(2n ** 14n))],
				[`-(2 ^ 14) - 2 ^ 15;`, new Int16(2n ** 14n)],
				[`-(5) ^ +(2 * 3);`,    new Int16((-5n) ** (2n * 3n))],
			]));
		});
		it('overflows integers properly.', () => {
			assert.deepStrictEqual([
				`2 ^ 15 + 2 ^ 14;`,
				`-(2 ^ 14) - 2 ^ 15;`,
			].map((src) => AST.ASTNodeOperationBinaryArithmetic.fromSource(src).fold(new Validator())), [
				new Int16(-(2n ** 14n)),
				new Int16(2n ** 14n),
			]);
		});
		it('computes the value of a float operation of constants.', () => {
			foldOperations(new Map<string, SolidObject>([
				[`3.0e1 - 201.0e-1;`, new Float64(30 - 20.1)],
				[`3 * 2.1;`,          new Float64(3 * 2.1)],
			]));
		});
		it('throws when performing an operation that does not yield a valid number.', () => {
			assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource(`-4 ^ -0.5;`).fold(new Validator()), NanError01);
		});
	});


	describe('#build', () => {
		it('returns InstructionBinopArithmetic.', () => {
			buildOperations(new Map([
				[`42 + 420;`, new INST.InstructionBinopArithmetic(Operator.ADD, instructionConstInt(42n),   instructionConstInt(420n))],
				[`3 * 2.1;`,  new INST.InstructionBinopArithmetic(Operator.MUL, instructionConstFloat(3.0), instructionConstFloat(2.1))],
			]));
			buildOperations(new Map([
				[' 126 /  3;', new INST.InstructionBinopArithmetic(Operator.DIV, instructionConstInt( 126n), instructionConstInt( 3n))],
				['-126 /  3;', new INST.InstructionBinopArithmetic(Operator.DIV, instructionConstInt(-126n), instructionConstInt( 3n))],
				[' 126 / -3;', new INST.InstructionBinopArithmetic(Operator.DIV, instructionConstInt( 126n), instructionConstInt(-3n))],
				['-126 / -3;', new INST.InstructionBinopArithmetic(Operator.DIV, instructionConstInt(-126n), instructionConstInt(-3n))],
				[' 200 /  3;', new INST.InstructionBinopArithmetic(Operator.DIV, instructionConstInt( 200n), instructionConstInt( 3n))],
				[' 200 / -3;', new INST.InstructionBinopArithmetic(Operator.DIV, instructionConstInt( 200n), instructionConstInt(-3n))],
				['-200 /  3;', new INST.InstructionBinopArithmetic(Operator.DIV, instructionConstInt(-200n), instructionConstInt( 3n))],
				['-200 / -3;', new INST.InstructionBinopArithmetic(Operator.DIV, instructionConstInt(-200n), instructionConstInt(-3n))],
			]));
		});
	});
});

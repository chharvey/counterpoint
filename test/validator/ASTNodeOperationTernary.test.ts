import * as assert from 'assert';
import {
	// {ASTNodeKey, ...} as AST,
	Validator,
	SolidObject,
	SolidNull,
	SolidBoolean,
	Int16,
	Float64,
	INST,
	TypeError01,
} from '../../src/index.js';
import * as AST from '../../src/validator/astnode/index.js'; // HACK
import {
	typeOperations,
	foldOperations,
	buildOperations,
	instructionConstInt,
	instructionConstFloat,
} from '../helpers.js';



describe('ASTNodeOperationTernary', () => {
	describe('#type', () => {
		context('with constant folding on', () => {
			it('computes type for for conditionals', () => {
				typeOperations(new Map<string, SolidObject>([
					[`if true then false else 2;`,          SolidBoolean.FALSE],
					[`if false then 3.0 else null;`,        SolidNull.NULL],
					[`if true then 2 else 3.0;`,            new Int16(2n)],
					[`if false then 2 + 3.0 else 1.0 * 2;`, new Float64(2.0)],
				]));
			});
		});
		it('throws when condition is not boolean.', () => {
			assert.throws(() => AST.ASTNodeOperationTernary.fromSource(`if 2 then true else false;`).type(new Validator()), TypeError01);
		});
	});


	specify('#fold', () => {
		foldOperations(new Map<string, SolidObject>([
			[`if true then false else 2;`,          SolidBoolean.FALSE],
			[`if false then 3.0 else null;`,        SolidNull.NULL],
			[`if true then 2 else 3.0;`,            new Int16(2n)],
			[`if false then 2 + 3.0 else 1.0 * 2;`, new Float64(2.0)],
		]));
	});


	specify('#build', () => {
		buildOperations((new Map([
			[`if true  then false else 2;`,    new INST.InstructionCond(instructionConstInt(1n), instructionConstInt(0n),    instructionConstInt(2n))],
			[`if false then 3.0   else null;`, new INST.InstructionCond(instructionConstInt(0n), instructionConstFloat(3.0), instructionConstFloat(0.0))],
			[`if true  then 2     else 3.0;`,  new INST.InstructionCond(instructionConstInt(1n), instructionConstFloat(2.0), instructionConstFloat(3.0))],
		])));
	});
});

import * as assert from 'assert';
import {
	// {ASTNodeKey, ...} as AST,
	Validator,
	SolidBoolean,
	TypeError01,
} from '../../src/index.js';
import * as AST from '../../src/validator/astnode/index.js'; // HACK
import {
	typeOperations,
	foldOperations,
	typeOfOperationFromSource,
	CONFIG_FOLDING_OFF,
} from '../helpers.js';



describe('ASTNodeOperationBinaryComparative', () => {
	describe('#type', () => {
		it('with folding and int coersion on.', () => {
			typeOperations(new Map([
				[`2 < 3;`,  SolidBoolean.TRUE],
				[`2 > 3;`,  SolidBoolean.FALSE],
				[`2 <= 3;`, SolidBoolean.TRUE],
				[`2 >= 3;`, SolidBoolean.FALSE],
				[`2 !< 3;`, SolidBoolean.FALSE],
				[`2 !> 3;`, SolidBoolean.TRUE],
			]));
		});
		context('with folding off but int coersion on.', () => {
			it('allows coercing of ints to floats if there are any floats.', () => {
				assert.deepStrictEqual(AST.ASTNodeOperationBinaryComparative.fromSource(`7.0 > 3;`).type(new Validator(CONFIG_FOLDING_OFF)), SolidBoolean);
			});
		});
		context('with folding and int coersion off.', () => {
			it('returns `Boolean` if both operands are of the same numeric type.', () => {
				assert.deepStrictEqual(typeOfOperationFromSource(`7 < 3;`), SolidBoolean);
				assert.deepStrictEqual(typeOfOperationFromSource(`7.0 >= 3.0;`), SolidBoolean);
			});
			it('throws TypeError if operands have different types.', () => {
				assert.throws(() => typeOfOperationFromSource(`7.0 <= 3;`), TypeError01);
			});
		});
		it('throws for comparative operation of non-numbers.', () => {
			assert.throws(() => AST.ASTNodeOperationBinaryComparative.fromSource(`7.0 <= null;`).type(new Validator()), TypeError01);
		});
	});


	specify('#fold', () => {
		foldOperations(new Map([
			[`3 <  3;`,     SolidBoolean.FALSE],
			[`3 >  3;`,     SolidBoolean.FALSE],
			[`3 <= 3;`,     SolidBoolean.TRUE],
			[`3 >= 3;`,     SolidBoolean.TRUE],
			[`5.2 <  7.0;`, SolidBoolean.TRUE],
			[`5.2 >  7.0;`, SolidBoolean.FALSE],
			[`5.2 <= 7.0;`, SolidBoolean.TRUE],
			[`5.2 >= 7.0;`, SolidBoolean.FALSE],
			[`5.2 <  9;`,   SolidBoolean.TRUE],
			[`5.2 >  9;`,   SolidBoolean.FALSE],
			[`5.2 <= 9;`,   SolidBoolean.TRUE],
			[`5.2 >= 9;`,   SolidBoolean.FALSE],
			[`5 <  9.2;`,   SolidBoolean.TRUE],
			[`5 >  9.2;`,   SolidBoolean.FALSE],
			[`5 <= 9.2;`,   SolidBoolean.TRUE],
			[`5 >= 9.2;`,   SolidBoolean.FALSE],
			[`3.0 <  3;`,   SolidBoolean.FALSE],
			[`3.0 >  3;`,   SolidBoolean.FALSE],
			[`3.0 <= 3;`,   SolidBoolean.TRUE],
			[`3.0 >= 3;`,   SolidBoolean.TRUE],
			[`3 <  3.0;`,   SolidBoolean.FALSE],
			[`3 >  3.0;`,   SolidBoolean.FALSE],
			[`3 <= 3.0;`,   SolidBoolean.TRUE],
			[`3 >= 3.0;`,   SolidBoolean.TRUE],
		]));
	});
});

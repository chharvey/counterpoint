import * as assert from 'assert';
import {
	ASTNODE_SOLID as AST,
	SymbolStructure,
	SymbolStructureType,
	SolidType,
	INST,
	Builder,
	AssignmentError01,
	TypeError03,
} from '../../../src/index.js';
import {
	CONFIG_COERCION_OFF,
} from '../../helpers.js';



describe('ASTNodeDeclarationType', () => {
	describe('#varCheck', () => {
		it('adds a SymbolStructure to the symbol table with a preset `type` value of `unknown`.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
				type T = int;
			}`);
			assert.ok(!goal.validator.hasSymbol(256n));
			goal.varCheck();
			assert.ok(goal.validator.hasSymbol(256n));
			const info: SymbolStructure | null = goal.validator.getSymbolInfo(256n);
			assert.ok(info instanceof SymbolStructureType);
			assert.strictEqual(info.typevalue, SolidType.UNKNOWN);
		});
		it('throws if the validator already contains a record for the symbol.', () => {
			assert.throws(() => AST.ASTNodeGoal.fromSource(`{
				type T = int;
				type T = float;
			}`).varCheck(), AssignmentError01);
			assert.throws(() => AST.ASTNodeGoal.fromSource(`{
				let FOO: int = 42;
				type FOO = float;
			}`).varCheck(), AssignmentError01);
		});
	});


	describe('#typeCheck', () => {
		it('sets `SymbolStructure#value`.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`{
				type T = int;
			}`);
			goal.varCheck();
			goal.typeCheck();
			assert.deepStrictEqual(
				(goal.validator.getSymbolInfo(256n) as SymbolStructureType).typevalue,
				SolidType.INT,
			);
		});
	});


	describe('#build', () => {
		it('always returns InstructionNone.', () => {
			const src: string = `{
				type T = int;
				type U = T | float;
			}`;
			const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(src);
			const builder: Builder = new Builder(src);
			assert.deepStrictEqual(
				[
					block.children[0].build(builder),
					block.children[1].build(builder),
				],
				[
					new INST.InstructionNone(),
					new INST.InstructionNone(),
				],
			);
		});
	});
});



describe('ASTNodeDeclarationType', () => {
	describe('#typeCheck', () => {
		it('throws when the assignee type and claimed type do not overlap.', () => {
			const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(`{
				let x: int = 3;
				claim x: str;
			}`);
			block.varCheck();
			assert.throws(() => block.typeCheck(), TypeError03);
		});
		it('with int coersion off, does not allow converting between int and float.', () => {
			[
				`{
					let x: int = 3;
					claim x: float;
				}`,
				`{
					let x: float = 3.0;
					claim x: int;
				}`,
			].forEach((src) => {
				const block_ok: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(src);
				block_ok.varCheck();
				block_ok.typeCheck(); // assert does not throw
				const block_err: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(src, CONFIG_COERCION_OFF);
				block_err.varCheck();
				assert.throws(() => block_err.typeCheck(), TypeError03);
			});
		});
	});


	describe('#build', () => {
		it('always returns InstructionNone.', () => {
			const src: string = `{
				claim x: T;
			}`;
			assert.deepStrictEqual(
				AST.ASTNodeBlock.fromSource(src).children[0].build(new Builder('')),
				new INST.InstructionNone(),
			);
		});
	});
});

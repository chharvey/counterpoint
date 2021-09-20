import * as assert from 'assert';
import {
	Dev,
	Operator,
	// {ASTNodeKey, ...} as AST,
	Validator,
	SolidBoolean,
	INST,
} from '../../src/index.js';
import * as AST from '../../src/validator/astnode/index.js'; // HACK
import {
	typeOperations,
	foldOperations,
	buildOperations,
	CONFIG_FOLDING_OFF,
	instructionConstInt,
	instructionConstFloat,
} from '../helpers.js';



describe('ASTNodeOperationUnary', () => {
	describe('#type', () => {
		context('with constant folding on.', () => {
			it('returns a constant Boolean type for boolean unary operation of anything.', () => {
				typeOperations(new Map([
					[`!false;`,  SolidBoolean.TRUE],
					[`!true;`,   SolidBoolean.FALSE],
					[`!null;`,   SolidBoolean.TRUE],
					[`!42;`,     SolidBoolean.FALSE],
					[`!4.2e+1;`, SolidBoolean.FALSE],
					[`?false;`,  SolidBoolean.TRUE],
					[`?true;`,   SolidBoolean.FALSE],
					[`?null;`,   SolidBoolean.TRUE],
					[`?42;`,     SolidBoolean.FALSE],
					[`?4.2e+1;`, SolidBoolean.FALSE],
				]));
				Dev.supports('literalCollection') && typeOperations(new Map([
					[`![];`,         SolidBoolean.FALSE],
					[`![42];`,       SolidBoolean.FALSE],
					[`![a= 42];`,    SolidBoolean.FALSE],
					[`!{};`,         SolidBoolean.FALSE],
					[`!{42};`,       SolidBoolean.FALSE],
					[`!{41 -> 42};`, SolidBoolean.FALSE],
					[`?[];`,         SolidBoolean.TRUE],
					[`?[42];`,       SolidBoolean.FALSE],
					[`?[a= 42];`,    SolidBoolean.FALSE],
					[`?{};`,         SolidBoolean.TRUE],
					[`?{42};`,       SolidBoolean.FALSE],
					[`?{41 -> 42};`, SolidBoolean.FALSE],
				]));
			});
		});

		context('with constant folding off.', () => {
			describe('[operator=NOT]', () => {
				it('returns type `true` for a subtype of `void | null | false`.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let unfixed a: null = null;
						let unfixed b: null | false = null;
						let unfixed c: null | void = null;
						!a;
						!b;
						!c;
					`, CONFIG_FOLDING_OFF);
					const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
					goal.varCheck(validator);
					goal.typeCheck(validator);
					goal.children.slice(3).forEach((stmt) => {
						assert.deepStrictEqual((stmt as AST.ASTNodeStatementExpression).expr!.type(validator), SolidBoolean.TRUETYPE);
					});
				});
				it('returns type `bool` for a supertype of `void` or a supertype of `null` or a supertype of `false`.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let unfixed a: null | int = null;
						let unfixed b: null | int = 42;
						let unfixed c: bool = false;
						let unfixed d: bool | float = 4.2;
						let unfixed e: str | void = 'hello';
						!a;
						!b;
						!c;
						!d;
						!e;
					`, CONFIG_FOLDING_OFF);
					const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
					goal.varCheck(validator);
					goal.typeCheck(validator);
					goal.children.slice(5).forEach((stmt) => {
						assert.deepStrictEqual((stmt as AST.ASTNodeStatementExpression).expr!.type(validator), SolidBoolean);
					});
				});
				it('returns type `false` for any type not a supertype of `null` or `false`.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let unfixed a: int = 42;
						let unfixed b: float = 4.2;
						!a;
						!b;
					`, CONFIG_FOLDING_OFF);
					const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
					goal.varCheck(validator);
					goal.typeCheck(validator);
					goal.children.slice(2).forEach((stmt) => {
						assert.deepStrictEqual((stmt as AST.ASTNodeStatementExpression).expr!.type(validator), SolidBoolean.FALSETYPE);
					});
				});
				Dev.supports('literalCollection') && it('[literalCollection] returns type `false` for any type not a supertype of `null` or `false`.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						![];
						![42];
						![a= 42];
						!{41 -> 42};
					`, CONFIG_FOLDING_OFF);
					const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
					goal.varCheck(validator);
					goal.typeCheck(validator);
					goal.children.forEach((stmt) => {
						assert.deepStrictEqual((stmt as AST.ASTNodeStatementExpression).expr!.type(validator), SolidBoolean.FALSETYPE);
					});
				});
			});
			describe('[operator=EMP]', () => {
				it('always returns type `bool`.', () => {
					const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
					[
						`?false;`,
						`?true;`,
						`?null;`,
						`?42;`,
						`?4.2e+1;`,
					].map((src) => AST.ASTNodeOperation.fromSource(src, CONFIG_FOLDING_OFF).type(validator)).forEach((typ) => {
						assert.deepStrictEqual(typ, SolidBoolean);
					});
					Dev.supports('literalCollection') && [
						`?[];`,
						`?[42];`,
						`?[a= 42];`,
						`?{41 -> 42};`,
					].map((src) => AST.ASTNodeOperation.fromSource(src, CONFIG_FOLDING_OFF).type(validator)).forEach((typ) => {
						assert.deepStrictEqual(typ, SolidBoolean);
					});
				});
			});
		});
	});


	describe('#fold', () => {
		specify('[operator=NOT]', () => {
			foldOperations(new Map([
				[`!false;`,  SolidBoolean.TRUE],
				[`!true;`,   SolidBoolean.FALSE],
				[`!null;`,   SolidBoolean.TRUE],
				[`!0;`,      SolidBoolean.FALSE],
				[`!42;`,     SolidBoolean.FALSE],
				[`!0.0;`,    SolidBoolean.FALSE],
				[`!-0.0;`,   SolidBoolean.FALSE],
				[`!4.2e+1;`, SolidBoolean.FALSE],
			]));
			Dev.supports('stringConstant-assess') && foldOperations(new Map([
				[`!'';`,      SolidBoolean.FALSE],
				[`!'hello';`, SolidBoolean.FALSE],
			]));
			Dev.supports('literalCollection') && foldOperations(new Map([
				[`![];`,                  SolidBoolean.FALSE],
				[`![42];`,                SolidBoolean.FALSE],
				[`![a= 42];`,             SolidBoolean.FALSE],
				[`!List.<int>([]);`,      SolidBoolean.FALSE],
				[`!List.<int>([42]);`,    SolidBoolean.FALSE],
				[`!Hash.<int>([a= 42]);`, SolidBoolean.FALSE],
				[`!{};`,                  SolidBoolean.FALSE],
				[`!{42};`,                SolidBoolean.FALSE],
				[`!{41 -> 42};`,          SolidBoolean.FALSE],
			]));
		});
		specify('[operator=EMP]', () => {
			foldOperations(new Map([
				[`?false;`,  SolidBoolean.TRUE],
				[`?true;`,   SolidBoolean.FALSE],
				[`?null;`,   SolidBoolean.TRUE],
				[`?0;`,      SolidBoolean.TRUE],
				[`?42;`,     SolidBoolean.FALSE],
				[`?0.0;`,    SolidBoolean.TRUE],
				[`?-0.0;`,   SolidBoolean.TRUE],
				[`?4.2e+1;`, SolidBoolean.FALSE],
			]));
			Dev.supports('stringConstant-assess') && foldOperations(new Map([
				[`?'';`,      SolidBoolean.TRUE],
				[`?'hello';`, SolidBoolean.FALSE],
			]));
			Dev.supports('literalCollection') && foldOperations(new Map([
				[`?[];`,                  SolidBoolean.TRUE],
				[`?[42];`,                SolidBoolean.FALSE],
				[`?[a= 42];`,             SolidBoolean.FALSE],
				[`?List.<int>([]);`,      SolidBoolean.TRUE],
				[`?List.<int>([42]);`,    SolidBoolean.FALSE],
				[`?Hash.<int>([a= 42]);`, SolidBoolean.FALSE],
				[`?{};`,                  SolidBoolean.TRUE],
				[`?{42};`,                SolidBoolean.FALSE],
				[`?{41 -> 42};`,          SolidBoolean.FALSE],
			]));
		});
	});


	describe('#build', () => {
		it('returns InstructionUnop.', () => {
			buildOperations(new Map<string, INST.InstructionUnop>([
				[`!null;`,  new INST.InstructionUnop(Operator.NOT, instructionConstInt(0n))],
				[`!false;`, new INST.InstructionUnop(Operator.NOT, instructionConstInt(0n))],
				[`!true;`,  new INST.InstructionUnop(Operator.NOT, instructionConstInt(1n))],
				[`!42;`,    new INST.InstructionUnop(Operator.NOT, instructionConstInt(42n))],
				[`!4.2;`,   new INST.InstructionUnop(Operator.NOT, instructionConstFloat(4.2))],
				[`?null;`,  new INST.InstructionUnop(Operator.EMP, instructionConstInt(0n))],
				[`?false;`, new INST.InstructionUnop(Operator.EMP, instructionConstInt(0n))],
				[`?true;`,  new INST.InstructionUnop(Operator.EMP, instructionConstInt(1n))],
				[`?42;`,    new INST.InstructionUnop(Operator.EMP, instructionConstInt(42n))],
				[`?4.2;`,   new INST.InstructionUnop(Operator.EMP, instructionConstFloat(4.2))],
				[`-(4);`,   new INST.InstructionUnop(Operator.NEG, instructionConstInt(4n))],
				[`-(4.2);`, new INST.InstructionUnop(Operator.NEG, instructionConstFloat(4.2))],
			]));
		});
	});
});

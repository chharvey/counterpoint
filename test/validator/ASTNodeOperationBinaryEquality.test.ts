import * as assert from 'assert';
import {
	Dev,
	Operator,
	// {ASTNodeKey, ...} as AST,
	Validator,
	SolidTypeConstant,
	SolidBoolean,
	Builder,
	INST,
} from '../../src/index.js';
import * as AST from '../../src/validator/astnode/index.js'; // HACK
import {
	typeOperations,
	foldOperations,
	typeOfOperationFromSource,
	CONFIG_FOLDING_OFF,
	CONFIG_FOLDING_COERCION_OFF,
	instructionConstInt,
	instructionConstFloat,
} from '../helpers.js';



describe('ASTNodeOperationBinaryEquality', () => {
	describe('#type', () => {
		context('with folding and int coersion on.', () => {
			it('for numeric literals.', () => {
				typeOperations(new Map([
					[`2 === 3;`,      SolidBoolean.FALSE],
					[`2 !== 3;`,      SolidBoolean.TRUE],
					[`2 == 3;`,       SolidBoolean.FALSE],
					[`2 != 3;`,       SolidBoolean.TRUE],
					[`0 === -0;`,     SolidBoolean.TRUE],
					[`0 == -0;`,      SolidBoolean.TRUE],
					[`0.0 === 0;`,    SolidBoolean.FALSE],
					[`0.0 == 0;`,     SolidBoolean.TRUE],
					[`0.0 === -0;`,   SolidBoolean.FALSE],
					[`0.0 == -0;`,    SolidBoolean.TRUE],
					[`-0.0 === 0;`,   SolidBoolean.FALSE],
					[`-0.0 == 0;`,    SolidBoolean.TRUE],
					[`-0.0 === 0.0;`, SolidBoolean.FALSE],
					[`-0.0 == 0.0;`,  SolidBoolean.TRUE],
				]));
			});
			Dev.supports('literalCollection') && it('returns the result of `this#fold`, wrapped in a `new SolidTypeConstant`.', () => {
				const validator: Validator = new Validator();
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let a: obj = [];
					let b: obj = [42];
					let c: obj = [x= 42];
					let d: obj = {41 -> 42};
					a !== [];
					b !== [42];
					c !== [x= 42];
					d !== {41 -> 42};
					a === a;
					b === b;
					c === c;
					d === d;
					a == [];
					b == [42];
					c == [x= 42];
					d == {41 -> 42};
					b != [42, 43];
					c != [x= 43];
					c != [y= 42];
					d != {41 -> 43};
					d != {43 -> 42};
				`);
				goal.varCheck(validator);
				goal.typeCheck(validator);
				goal.children.slice(4).forEach((stmt) => {
					const expr: AST.ASTNodeOperationBinaryEquality = (stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinaryEquality;
					assert.deepStrictEqual(
						expr.type(validator),
						new SolidTypeConstant(expr.fold(validator)!),
					);
				});
			});
		});
		context('with folding off but int coersion on.', () => {
			it('allows coercing of ints to floats if there are any floats.', () => {
				assert.deepStrictEqual(AST.ASTNodeOperationBinaryEquality.fromSource(`7 == 7.0;`).type(new Validator(CONFIG_FOLDING_OFF)), SolidBoolean);
			});
			it('returns `false` if operands are of different numeric types.', () => {
				assert.deepStrictEqual(AST.ASTNodeOperationBinaryEquality.fromSource(`7 === 7.0;`, CONFIG_FOLDING_OFF).type(new Validator(CONFIG_FOLDING_OFF)), SolidBoolean.FALSETYPE);
			});
		});
		context('with folding and int coersion off.', () => {
			it('returns `false` if operands are of different numeric types.', () => {
				assert.deepStrictEqual(typeOfOperationFromSource(`7 == 7.0;`), SolidBoolean.FALSETYPE);
			});
			it('returns `false` if operands are of disjoint types in general.', () => {
				assert.deepStrictEqual(typeOfOperationFromSource(`7 == null;`), SolidBoolean.FALSETYPE);
			});
		});
	});


	specify('#fold', () => {
		foldOperations(new Map([
			[`null === null;`, SolidBoolean.TRUE],
			[`null ==  null;`, SolidBoolean.TRUE],
			[`null === 5;`,    SolidBoolean.FALSE],
			[`null ==  5;`,    SolidBoolean.FALSE],
			[`true === 1;`,    SolidBoolean.FALSE],
			[`true ==  1;`,    SolidBoolean.FALSE],
			[`true === 1.0;`,  SolidBoolean.FALSE],
			[`true ==  1.0;`,  SolidBoolean.FALSE],
			[`true === 5.1;`,  SolidBoolean.FALSE],
			[`true ==  5.1;`,  SolidBoolean.FALSE],
			[`true === true;`, SolidBoolean.TRUE],
			[`true ==  true;`, SolidBoolean.TRUE],
			[`3.0 === 3;`,     SolidBoolean.FALSE],
			[`3.0 ==  3;`,     SolidBoolean.TRUE],
			[`3 === 3.0;`,     SolidBoolean.FALSE],
			[`3 ==  3.0;`,     SolidBoolean.TRUE],
			[`0.0 === 0.0;`,   SolidBoolean.TRUE],
			[`0.0 ==  0.0;`,   SolidBoolean.TRUE],
			[`0.0 === -0.0;`,  SolidBoolean.FALSE],
			[`0.0 ==  -0.0;`,  SolidBoolean.TRUE],
			[`0 === -0;`,      SolidBoolean.TRUE],
			[`0 ==  -0;`,      SolidBoolean.TRUE],
			[`0.0 === 0;`,     SolidBoolean.FALSE],
			[`0.0 ==  0;`,     SolidBoolean.TRUE],
			[`0.0 === -0;`,    SolidBoolean.FALSE],
			[`0.0 ==  -0;`,    SolidBoolean.TRUE],
			[`-0.0 === 0;`,    SolidBoolean.FALSE],
			[`-0.0 ==  0;`,    SolidBoolean.TRUE],
			[`-0.0 === 0.0;`,  SolidBoolean.FALSE],
			[`-0.0 ==  0.0;`,  SolidBoolean.TRUE],
		]));
		Dev.supports('stringConstant-assess') && foldOperations(new Map([
			[`'' == '';`,                               SolidBoolean.TRUE],
			[`'a' === 'a';`,                            SolidBoolean.TRUE],
			[`'a' ==  'a';`,                            SolidBoolean.TRUE],
			[`'hello\\u{20}world' === 'hello world';`,  SolidBoolean.TRUE],
			[`'hello\\u{20}world' ==  'hello world';`,  SolidBoolean.TRUE],
			[`'a' !== 'b';`,                            SolidBoolean.TRUE],
			[`'a' !=  'b';`,                            SolidBoolean.TRUE],
			[`'hello\\u{20}world' !== 'hello20world';`, SolidBoolean.TRUE],
			[`'hello\\u{20}world' !=  'hello20world';`, SolidBoolean.TRUE],
		]));
		Dev.supports('literalCollection') && (() => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				let a: obj = [];
				let b: obj = [42];
				let c: obj = [x= 42];
				let d: obj = List.<int>([]);
				let e: obj = List.<int>([42]);
				let f: obj = Hash.<int>([x= 42]);
				let g: obj = {};
				let h: obj = {42};
				let i: obj = {41 -> 42};

				let bb: obj = [[42]];
				let cc: obj = [x= [42]];
				let hh: obj = {[42]};
				let ii: obj = {[41] -> [42]};

				a !== [];
				b !== [42];
				c !== [x= 42];
				d !== List.<int>([]);
				e !== List.<int>([42]);
				f !== Hash.<int>([x= 42]);
				g !== {};
				h !== {42};
				i !== {41 -> 42};
				a === a;
				b === b;
				c === c;
				d === d;
				e === e;
				f === f;
				g === g;
				h === h;
				i === i;
				a == [];
				b == [42];
				c == [x= 42];
				d == List.<int>([]);
				e == List.<int>([42]);
				f == Hash.<int>([x= 42]);
				g == {};
				h == {42};
				i == {41 -> 42};

				bb !== [[42]];
				cc !== [x= [42]];
				hh !== {[42]};
				ii !== {[41] -> [42]};
				bb === bb;
				cc === cc;
				hh === hh;
				ii === ii;
				bb == [[42]];
				cc == [x= [42]];
				hh == {[42]};
				ii == {[41] -> [42]};

				b != [42, 43];
				c != [x= 43];
				c != [y= 42];
				i != {41 -> 43};
				i != {43 -> 42};
			`);
			const validator: Validator = new Validator();
			goal.varCheck(validator);
			goal.typeCheck(validator);
			goal.children.slice(13).forEach((stmt) => {
				assert.deepStrictEqual((stmt as AST.ASTNodeStatementExpression).expr!.fold(validator), SolidBoolean.TRUE, stmt.source);
			});
		})();
	});


	describe('#build', () => {
		it('with int coersion on, coerse ints into floats when needed.', () => {
			assert.deepStrictEqual([
				`42 == 420;`,
				`4.2 === 42;`,
				`42 === 4.2;`,
				`4.2 == 42;`,
				`true === 1;`,
				`true == 1;`,
				`null === false;`,
				`null == false;`,
				`false == 0.0;`,
			].map((src) => AST.ASTNodeOperationBinaryEquality.fromSource(src, CONFIG_FOLDING_OFF).build(new Builder(src, CONFIG_FOLDING_OFF))), [
				new INST.InstructionBinopEquality(
					Operator.EQ,
					instructionConstInt(42n),
					instructionConstInt(420n),
				),
				new INST.InstructionBinopEquality(
					Operator.ID,
					instructionConstFloat(4.2),
					instructionConstInt(42n),
				),
				new INST.InstructionBinopEquality(
					Operator.ID,
					instructionConstInt(42n),
					instructionConstFloat(4.2),
				),
				new INST.InstructionBinopEquality(
					Operator.EQ,
					instructionConstFloat(4.2),
					instructionConstFloat(42.0),
				),
				new INST.InstructionBinopEquality(
					Operator.ID,
					instructionConstInt(1n),
					instructionConstInt(1n),
				),
				new INST.InstructionBinopEquality(
					Operator.EQ,
					instructionConstInt(1n),
					instructionConstInt(1n),
				),
				new INST.InstructionBinopEquality(
					Operator.ID,
					instructionConstInt(0n),
					instructionConstInt(0n),
				),
				new INST.InstructionBinopEquality(
					Operator.EQ,
					instructionConstInt(0n),
					instructionConstInt(0n),
				),
				new INST.InstructionBinopEquality(
					Operator.EQ,
					instructionConstFloat(0.0),
					instructionConstFloat(0.0),
				),
			]);
		});
		it('with int coersion on, does not coerse ints into floats.', () => {
			assert.deepStrictEqual([
				`42 == 420;`,
				`4.2 == 42;`,
				`42 == 4.2;`,
				`null == 0.0;`,
				`false == 0.0;`,
				`true == 1.0;`,
			].map((src) => AST.ASTNodeOperationBinaryEquality.fromSource(src, CONFIG_FOLDING_COERCION_OFF).build(new Builder(src, CONFIG_FOLDING_COERCION_OFF))), [
				[instructionConstInt(42n),   instructionConstInt(420n)],
				[instructionConstFloat(4.2), instructionConstInt(42n)],
				[instructionConstInt(42n),   instructionConstFloat(4.2)],
				[instructionConstInt(0n),    instructionConstFloat(0.0)],
				[instructionConstInt(0n),    instructionConstFloat(0.0)],
				[instructionConstInt(1n),    instructionConstFloat(1.0)],
			].map(([left, right]) => new INST.InstructionBinopEquality(Operator.EQ, left, right)));
		});
	});
});

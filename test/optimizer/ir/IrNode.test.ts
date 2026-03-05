import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	AST,
	VALUE,
	Optimizer,
	IR,
	Builder,
} from '../../../src/index.ts';



describe('IrNode', () => {
	describe('#codegen', () => {
		it('is not yet supported.', () => {
			const opt = new Optimizer();
			const cg  = new Builder();
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				42;
				val mut x: int = 42;
				x;
				"""hello {{ 42 }}""";
				(42, 43, 44);
				[42, 43, 44];
				{42, 43, 44};
				(a= 42, b= 43, c= 44);
				[a= 42, b= 43, c= 44];
				{"a" -> 42, "b" -> 43, "c" -> 44};
				(42, 43, 44).0;
				(a= 42, b= 43, c= 44).a;
				[42, 43, 44].[0];
				[a= 42, b= 43, c= 44].[@a];
				{42, 43, 44}.[42];
				{"a" -> 42, "b" -> 43, "c" -> 44}.["a"];
				List.<int>((42, 43, 44));
				-42;
				42 + 43;
				if false then 42 else 43;
				x = 43;
				[42, 43, 44].[0]                        = 43;
				[a= 42, b= 43, c= 44].[@a]              = 43;
				{42, 43, 44}.[42]                       = false;
				{"a" -> 42, "b" -> 43, "c" -> 44}.["a"] = 43;
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.lower(opt);
			xjs.Array.forEachAggregated([
				new IR.Trap(),
				...opt.instructions,
				new IR.Label('label1'),
				new IR.Goto(new IR.Label('label2')),
				new IR.GotoIfFalse(new IR.Const(VALUE.NULL), new IR.Label('label2')),
			], (instr) => assert.throws(() => instr.codegen(cg), /not yet supported/, instr.toString()));
		});
	});
});

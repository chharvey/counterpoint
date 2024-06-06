import * as assert from 'assert';
import {
	PARSER_EBNF as PARSER,
	Op,
	ASTNODE_EBNF as ASTNODE,
	DECORATOR_EBNF as DECORATOR,
} from '../../src/index.js';
import {
	assert_arrayLength,
} from '../assert-helpers.js';



describe('DecoratorEbnf', () => {
	describe('#decorate', () => {
		let goal: ASTNODE.ASTNodeGoal;
		before(() => {
			goal = DECORATOR.decorate(PARSER.parse(`
				Unit ::= NUMBER | "(" OPERATOR Unit Unit ")";
				Goal ::= #x02 Unit? #x03;
			`));
		});

		specify('Goal ::= #x02 Production* #x03;', () => {
			/*
				<Goal>
					<Production source='Unit ::= NUMBER | "(" OPERATOR Unit Unit ")" ;'>...</Production>
					<Production source='Goal ::= #x02 Unit ? #x03 ;'>...</Production>
				</Goal>
			*/
			assert_arrayLength(goal.children, 2, 'goal should have 2 children');
			assert.deepStrictEqual(goal.children.map((c) => c.source), [
				'Unit ::= NUMBER | "(" OPERATOR Unit Unit ")" ;',
				'Goal ::= #x02 Unit ? #x03 ;',
			]);
		});

		specify('Production ::= NonterminalName "::=" Definition ";";', () => {
			/*
				<Production>
					<Nonterminal name='Unit'/>
					<Op source='NUMBER | "(" OPERATOR Unit Unit ")"'>...</Op>
				</Production>
			*/
			const prod: ASTNODE.ASTNodeProduction = goal.productions[0];
			assert.strictEqual(prod.nonterminal['name'], 'Unit');
			assert.strictEqual(prod.definition.source, 'NUMBER | "(" OPERATOR Unit Unit ")"');
		});

		specify('Unary ::= Unit "*"', () => {
			/*
				<Op operator=OPT source='Production*'>
					<Op operator=PLUS>
						<Ref name='Production'/>
					</Op>
				</Op>
			*/
			const outer: ASTNODE.ASTNodeExpr = (((DECORATOR.decorate(PARSER.parse(`
				Goal ::= #x02 Production* #x03;
			`)).children[0] as ASTNODE.ASTNodeProduction)
				.children[1] as ASTNODE.ASTNodeOpBin) // source='#x02 Production* #x03'
				.children[0] as ASTNODE.ASTNodeOpBin) // source='#x02 Production*'
				.children[1] as ASTNODE.ASTNodeExpr   // source='Production*'
			;
			assert.ok(outer instanceof ASTNODE.ASTNodeOpUn);
			assert.deepStrictEqual(
				[outer.operator, outer.source],
				[Op.OPT,         'Production *'],
			);
			const inner: ASTNODE.ASTNodeExpr = outer.operand;
			assert.ok(inner instanceof ASTNODE.ASTNodeOpUn);
			assert.strictEqual(inner.operator, Op.PLUS);
			const ref: ASTNODE.ASTNodeExpr = inner.operand;
			assert.ok(ref instanceof ASTNODE.ASTNodeRef);
			assert.strictEqual(ref.name, 'Production');
		});

		specify('Altern ::= Altern "|" Concat;', () => {
			/*
				<Op operator=ALTERN>
					<Ref name='NUMBER'/>
					<Op operator=ORDER source='"(" OPERATOR Unit Unit ")"'>...</Op>
				</Production>
			*/
			const altern: ASTNODE.ASTNodeExpr = goal.productions[0].definition;
			assert.ok(altern instanceof ASTNODE.ASTNodeOpBin);
			assert.strictEqual(altern.operator, Op.ALTERN);
			const left:  ASTNODE.ASTNodeExpr = altern.operand0;
			const right: ASTNODE.ASTNodeExpr = altern.operand1;
			assert.ok(left  instanceof ASTNODE.ASTNodeRef);
			assert.ok(right instanceof ASTNODE.ASTNodeOpBin);
			assert.strictEqual(left['name'], 'NUMBER');
			assert.strictEqual(right['operator'], Op.ORDER);
			assert.strictEqual(right.source, '"(" OPERATOR Unit Unit ")"');
		});
	});
});

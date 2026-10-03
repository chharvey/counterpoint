import * as assert from 'node:assert';
import type {Builder} from '../../../index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {AstNode} from '../AstNode.ts';
import type {Buildable} from '../Buildable.ts';
import {Block} from '../Block.ts';
import {
	DeclarationType,
	DeclarationVariable,
	DeclarationFunction,
	StatementExpression,
	StatementClaim,
	StatementReassignment,
	StatementConditional,
	StatementLoop,
	StatementIteration,
	StatementBreak,
	StatementReturn,
} from './index.ts';



export abstract class StmtVisitor<T> {
	/* eslint-disable @stylistic/space-before-function-paren */
	public visitDeclType           (stmt: DeclarationType):       T { return this.defaultVisit(stmt); }
	public visitDeclVariable       (stmt: DeclarationVariable):   T { return this.defaultVisit(stmt); }
	public visitDeclFunction       (stmt: DeclarationFunction):   T { return this.defaultVisit(stmt); }
	public visitStmtExpr           (stmt: StatementExpression):   T { return this.defaultVisit(stmt); }
	public visitStmtClaim          (stmt: StatementClaim):        T { return this.defaultVisit(stmt); }
	public visitStmtReassignment   (stmt: StatementReassignment): T { return this.defaultVisit(stmt); }
	public visitStmtConditional    (stmt: StatementConditional):  T { return this.defaultVisit(stmt); }
	public visitStatementLoop      (stmt: StatementLoop):         T { return this.defaultVisit(stmt); }
	public visitStatementIteration (stmt: StatementIteration):    T { return this.defaultVisit(stmt); }
	public visitStatementBreak     (stmt: StatementBreak):        T { return this.defaultVisit(stmt); }
	public visitStatementReturn    (stmt: StatementReturn):       T { return this.defaultVisit(stmt); }
	/* eslint-enable @stylistic/space-before-function-paren */

	public abstract defaultVisit(stmt: Statement): T;

	/** @final */
	public visit(stmt: Statement): T {
		switch (stmt.constructor) {
			case DeclarationType:       { return this.visitDeclType           (stmt as DeclarationType); }
			case DeclarationVariable:   { return this.visitDeclVariable       (stmt as DeclarationVariable); }
			case DeclarationFunction:   { return this.visitDeclFunction       (stmt as DeclarationFunction); }
			case StatementExpression:   { return this.visitStmtExpr           (stmt as StatementExpression); } // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
			case StatementClaim:        { return this.visitStmtClaim          (stmt as StatementClaim); }
			case StatementReassignment: { return this.visitStmtReassignment   (stmt as StatementReassignment); }
			case StatementConditional:  { return this.visitStmtConditional    (stmt as StatementConditional); }
			case StatementLoop:         { return this.visitStatementLoop      (stmt as StatementLoop); }
			case StatementIteration:    { return this.visitStatementIteration (stmt as StatementIteration); }
			case StatementBreak:        { return this.visitStatementBreak     (stmt as StatementBreak); }
			case StatementReturn:       { return this.visitStatementReturn    (stmt as StatementReturn); }

			default: { return this.defaultVisit(stmt); }
		}
	}
}



/**
 * A sematic node representing a statement.
 *
 * Known subclasses:
 * - Declaration
 * - StatementExpression
 * - StatementClaim
 * - StatementReassignment
 * - StatementConditional
 * - StatementBreakable
 * - StatementBreak
 * - StatementReturn
 */
export abstract class Statement extends AstNode implements Buildable {
	/**
	 * Construct a new Statement from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new Statement representing the given source
	 */
	public static fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Statement {
		const block: Block = Block.fromSource(`{ ${ src } }`, config);
		assert.strictEqual(block.children.length, 1, 'semantic block should have 1 child');
		return block.children[0];
	}


	/**
	 * @inheritdoc
	 * @implements Buildable
	 */
	public abstract build(builder: Builder): void;
}

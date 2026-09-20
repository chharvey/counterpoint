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
	StatementExpression,
	StatementClaim,
	StatementReassignment,
	StatementConditional,
	StatementLoop,
	StatementIteration,
	StatementBreak,
} from './index.ts';



interface StmtVisitorMethods<T> {
	visitDeclType           (stmt: DeclarationType):       T;
	visitDeclVariable       (stmt: DeclarationVariable):   T;
	visitStmtExpr           (stmt: StatementExpression):   T;
	visitStmtClaim          (stmt: StatementClaim):        T;
	visitStmtReassignment   (stmt: StatementReassignment): T;
	visitStmtConditional    (stmt: StatementConditional):  T;
	visitStatementLoop      (stmt: StatementLoop):         T;
	visitStatementIteration (stmt: StatementIteration):    T;
	visitStatementBreak     (stmt: StatementBreak):        T;

	defaultVisit(stmt: Statement): T;
}
export class StmtVisitor<T> {
	public constructor(private readonly methods: Partial<StmtVisitorMethods<T>>) {}

	/** @final */
	public visit(stmt: Statement): T {
		switch (stmt.constructor) {
			case DeclarationType:       { return this.methods.visitDeclType           ?.(stmt as DeclarationType)       ?? this.methods.defaultVisit?.(stmt) ?? assert.fail('Missing implementation.'); }
			case DeclarationVariable:   { return this.methods.visitDeclVariable       ?.(stmt as DeclarationVariable)   ?? this.methods.defaultVisit?.(stmt) ?? assert.fail('Missing implementation.'); }
			case StatementExpression:   { return this.methods.visitStmtExpr           ?.(stmt as StatementExpression)   ?? this.methods.defaultVisit?.(stmt) ?? assert.fail('Missing implementation.'); } // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
			case StatementClaim:        { return this.methods.visitStmtClaim          ?.(stmt as StatementClaim)        ?? this.methods.defaultVisit?.(stmt) ?? assert.fail('Missing implementation.'); }
			case StatementReassignment: { return this.methods.visitStmtReassignment   ?.(stmt as StatementReassignment) ?? this.methods.defaultVisit?.(stmt) ?? assert.fail('Missing implementation.'); }
			case StatementConditional:  { return this.methods.visitStmtConditional    ?.(stmt as StatementConditional)  ?? this.methods.defaultVisit?.(stmt) ?? assert.fail('Missing implementation.'); }
			case StatementLoop:         { return this.methods.visitStatementLoop      ?.(stmt as StatementLoop)         ?? this.methods.defaultVisit?.(stmt) ?? assert.fail('Missing implementation.'); }
			case StatementIteration:    { return this.methods.visitStatementIteration ?.(stmt as StatementIteration)    ?? this.methods.defaultVisit?.(stmt) ?? assert.fail('Missing implementation.'); }
			case StatementBreak:        { return this.methods.visitStatementBreak     ?.(stmt as StatementBreak)        ?? this.methods.defaultVisit?.(stmt) ?? assert.fail('Missing implementation.'); }
			default:                    { return                                                                           this.methods.defaultVisit?.(stmt) ?? assert.fail('Unexpected subclass.'); }
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


	public abstract get hasBottomType(): boolean;

	/**
	 * @inheritdoc
	 * @implements Buildable
	 */
	public abstract build(builder: Builder): void;
}

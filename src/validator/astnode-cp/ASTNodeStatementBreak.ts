import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	type Optimizer,
	IR,
} from '../../index.ts';
import {
	assert_instanceof,
	noopGetter,
	memoizeMethod,
	memoizeGetter,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeCP} from './ASTNodeCP.ts';
import {
	buildDeco,
	ASTNodeStatement,
} from './ASTNodeStatement.ts';
import {ASTNodeStatementLoop} from './ASTNodeStatementLoop.ts';



export class ASTNodeStatementBreak extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeStatementBreak {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeStatementBreak);
		return statement;
	}


	public constructor(
		start_node: SyntaxNodeType<'statement_break'>,
		private readonly skip: boolean,
	) {
		super(start_node, {}, []);
	}

	@noopGetter(memoizeGetter)
	public override get isFoldable(): boolean {
		return false; // break statements will always have side-effects
	}

	@noopGetter(memoizeGetter)
	public override get hasBottomType(): boolean {
		return false;
	}

	@memoizeMethod
	public override lower(optimizer: Optimizer): void {
		let labels: ASTNodeStatementLoop['labels'] | undefined = undefined;
		let node = this.parent as ASTNodeCP | undefined;
		while (node && labels === undefined) {
			if (node instanceof ASTNodeStatementLoop) {
				labels = node.labels;
			}
			node = node.parent as ASTNodeCP | undefined;
		}
		// we should already have labels by the time we reach the root node
		assert.ok(labels, 'Expected StatementBreak to be nested inside (directly or indirectly) a StatementLoop.');
		assert.ok(labels.while && labels.endwhile, 'Expected containing StatementLoop to have its labels already created.');
		optimizer.pushInstruction(new IR.Goto(this.skip ? labels.while : labels.endwhile));
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		let block_index: number | undefined = undefined;
		let node = this.parent as ASTNodeCP | undefined;
		while (node && block_index === undefined) {
			block_index = this.builder.getBlock(node)?.index;
			node = node.parent as ASTNodeCP | undefined;
		}
		// we should already have an index by the time we reach the root node
		assert.ok(typeof block_index === 'number', 'Expected builder to store the containing loop/iteration block of this statement.'); // better type guard than `assert.strictEqual`
		return this.builder.module.br(this.skip ? `body${ block_index }` : `exit${ block_index }`);
	}
}

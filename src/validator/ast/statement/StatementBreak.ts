import * as assert from 'node:assert';
import {
	type Builder,
	OP,
} from '../../../index.ts';
import {
	assert_instanceof,
	noopGetter,
	memoizeGetter,
	runOnceMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type {AstNode} from '../AstNode.ts';
import {Statement} from './Statement.ts';
import {StatementBreakable} from './StatementBreakable.ts';



export class StatementBreak extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementBreak {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementBreak);
		return statement;
	}


	public constructor(
		start_node: SyntaxNodeType<'statement_break'>,
		private readonly skip: boolean,
	) {
		super(start_node);
	}

	@noopGetter(memoizeGetter)
	public override get hasBottomType(): boolean {
		return false;
	}

	@runOnceMethod
	public override build(builder: Builder): void {
		let labels: StatementBreakable['labels'] | undefined = undefined;
		let node:   AstNode | undefined                      = this.parent;
		while (node && labels === undefined) {
			if (node instanceof StatementBreakable) {
				labels = node.labels;
			}
			node = node.parent;
		}
		// we should already have labels by the time we reach the root node
		assert.ok(labels, 'Expected StatementBreak to be nested inside (directly or indirectly) a StatementBreakable.');
		assert.ok(labels.while && labels.endwhile, 'Expected containing StatementBreakable to have its labels already created.');
		builder.terminateBlock(new OP.Goto(this.skip ? labels.while : labels.endwhile));
		builder.initiateBlock(builder.newLabel(true));
	}
}

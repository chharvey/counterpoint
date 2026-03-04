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
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {
	buildDeco,
	Statement,
	StatementBreakable,
} from './Statement.ts';



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
		let labels: StatementBreakable['labels'] | undefined = undefined;
		let node = this.parent;
		while (node && labels === undefined) {
			if (node instanceof StatementBreakable) {
				labels = node.labels;
			}
			node = node.parent;
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
		let node = this.parent;
		while (node && block_index === undefined) {
			block_index = this.builder.getBlock(node)?.index;
			node = node.parent;
		}
		// we should already have an index by the time we reach the root node
		assert.ok(typeof block_index === 'number', 'Expected builder to store the containing loop/iteration block of this statement.'); // better type guard than `assert.strictEqual`
		return this.builder.module.br(this.skip ? `body${ block_index }` : `exit${ block_index }`);
	}
}

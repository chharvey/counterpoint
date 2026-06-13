import * as xjs from 'extrajs';
import {
	type Builder,
	OP,
	TypeErrorNotAssignable,
} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeGetter,
	runOnceMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type {Block} from '../Block.ts';
import type * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';
import {StatementBreakable} from './StatementBreakable.ts';



export class StatementLoop extends StatementBreakable {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementLoop {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementLoop);
		return statement;
	}


	public constructor(
		start_node: SyntaxNodeType<'statement_loop'>,
		private readonly doFirst:   boolean,
		private readonly until:     boolean,
		public  readonly condition: EXPR.Expression,
		public  readonly block:     Block,
	) {
		super(start_node, {doFirst, until}, [condition, block]);
	}


	@memoizeGetter
	public override get isFoldable(): boolean {
		return !!this.condition.fold() && this.block.isFoldable;
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		return this.condition.type().isBottomType || this.block.hasBottomType;
	}

	public override varCheck(): void {
		// Do not call `super.varCheck()` as we VarCheck children in a different order.
		xjs.Array.forEachAggregated(this.doFirst ? [this.block, this.condition] : [this.condition, this.block], (c) => c.varCheck());
	}

	public override typeCheck(): void {
		super.typeCheck();
		if (!this.condition.type().isSubtypeOf(TYPE.BOOL)) {
			throw new TypeErrorNotAssignable(this.condition, TYPE.BOOL);
		}
	}

	@runOnceMethod
	public override build(builder: Builder): void {
		let condition: () => OP.Value = () => this.condition.build(builder);
		if (this.until) {
			condition = () => new OP.Unop(OP.OpCode.NOT, this.condition.build(builder).asTac(builder), TYPE.BOOL);
		}

		this.labelWhile    = builder.newLabel();
		this.labelDo       = this.doFirst ? this.labels.while! : builder.newLabel();
		this.labelEndwhile = builder.newLabel();

		if (this.doFirst) {
			builder.terminateBlock(new OP.Goto(this.labels.do!));

			builder.initiateBlock(this.labels.do!);
			this.block.build(builder);
			builder.terminateBlock(new OP.GotoConditional(condition(), this.labels.do!, this.labels.endwhile!));
		} else {
			builder.terminateBlock(new OP.Goto(this.labels.while!));

			builder.initiateBlock(this.labels.while!);
			builder.terminateBlock(new OP.GotoConditional(condition(), this.labels.do!, this.labels.endwhile!));

			builder.initiateBlock(this.labels.do!);
			this.block.build(builder);
			builder.terminateBlock(new OP.Goto(this.labels.while!));
		}

		builder.initiateBlock(this.labels.endwhile!);
	}
}

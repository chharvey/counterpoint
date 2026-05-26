import * as xjs from 'extrajs';
import {
	type Optimizer,
	IR,
	TypeErrorNotAssignable,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	memoizeGetter,
} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {TYPE} from '../../typer/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import type {Block} from './index.ts';
import type {Expression} from './Expression.ts';
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
		public  readonly condition: Expression,
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

	@memoizeMethod
	public override build(optimizer: Optimizer): void {
		let condition: () => IR.Value = () => this.condition.build(optimizer);
		if (this.until) {
			condition = () => new IR.Unop(IR.OpCode.NOT, this.condition.build(optimizer).asTac(optimizer), TYPE.BOOL);
		}

		this.labelWhile    = optimizer.newLabel();
		this.labelDo       = this.doFirst ? this.labels.while! : optimizer.newLabel();
		this.labelEndwhile = optimizer.newLabel();

		if (this.doFirst) {
			optimizer.terminateBlock(new IR.Goto(this.labels.do!));

			optimizer.initiateBlock(this.labels.do!);
			this.block.build(optimizer);
			optimizer.terminateBlock(new IR.GotoConditional(condition(), this.labels.do!, this.labels.endwhile!));
		} else {
			optimizer.terminateBlock(new IR.Goto(this.labels.while!));

			optimizer.initiateBlock(this.labels.while!);
			optimizer.terminateBlock(new IR.GotoConditional(condition(), this.labels.do!, this.labels.endwhile!));

			optimizer.initiateBlock(this.labels.do!);
			this.block.build(optimizer);
			optimizer.terminateBlock(new IR.Goto(this.labels.while!));
		}

		optimizer.initiateBlock(this.labels.endwhile!);
	}
}

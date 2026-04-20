import * as xjs from 'extrajs';
import {
	TYPE,
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
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeBlock} from './index.ts';
import type {ASTNodeExpression} from './ASTNodeExpression.ts';
import {
	ASTNodeStatement,
	StatementBreakable,
} from './ASTNodeStatement.ts';



export class ASTNodeStatementLoop extends StatementBreakable {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeStatementLoop {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeStatementLoop);
		return statement;
	}


	public constructor(
		start_node: SyntaxNodeType<'statement_loop'>,
		private readonly doFirst:   boolean,
		private readonly until:     boolean,
		public  readonly condition: ASTNodeExpression,
		public  readonly block:     ASTNodeBlock,
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
	public override lower(optimizer: Optimizer): void {
		this.labelWhile    = optimizer.newLabel();
		this.labelDo       = optimizer.newLabel();
		this.labelEndwhile = optimizer.newLabel();

		let condition: () => IR.Value = () => this.condition.lower(optimizer);
		if (this.until) {
			condition = () => new IR.Unop(IR.OpCode.NOT, this.condition.lower(optimizer), TYPE.BOOL);
		}

		optimizer.pushInstruction(this.labels.while!);
		if (this.doFirst) {
			optimizer.pushInstruction(this.labels.do!);
			this.block.lower(optimizer);
			optimizer.pushInstruction(new IR.Goto(this.labels.endwhile!, condition()));
		} else {
			optimizer.pushInstruction(new IR.Goto(this.labels.endwhile!, condition()));
			optimizer.pushInstruction(this.labels.do!);
			this.block.lower(optimizer);
		}
		optimizer.pushInstruction(new IR.Goto(this.labels.while!));
		optimizer.pushInstruction(this.labels.endwhile!);
	}
}

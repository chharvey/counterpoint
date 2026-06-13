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
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import type {Block} from '../Block.ts';
import type * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';



export class StatementConditional extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementConditional {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementConditional);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'statement_conditional', ['unless', 'break']>,
		private readonly unless:       boolean,
		public  readonly condition:    EXPR.Expression,
		public  readonly consequent:   Block,
		public  readonly alternative?: Block | StatementConditional,
	) {
		super(start_node, {unless}, alternative ? [condition, consequent, alternative] : [condition, consequent]);
	}

	@memoizeGetter
	public override get isFoldable(): boolean {
		const condition_type:   TYPE.Type = this.condition.type();
		const condition_truthy: boolean   = condition_type.isSubtypeOf(TYPE.TRUE);
		const condition_falsy:  boolean   = condition_type.isSubtypeOf(TYPE.FALSE);

		return !!this.condition.fold() && (
			/*
				- `if true…`  or `unless false…`, and consequent  is foldable                    -> sufficient
				- `if false…` or `unless true…`,  and alternative is foldable (or doesn’t exist) -> sufficient
			*/
			(!this.unless && condition_truthy || this.unless && condition_falsy)  && this.consequent.isFoldable ||
			(!this.unless && condition_falsy  || this.unless && condition_truthy) && (!this.alternative || !!this.alternative.isFoldable)
		);
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		return this.condition.type().isBottomType || this.consequent.hasBottomType || (this.alternative?.hasBottomType ?? false);
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
		if (this.unless) {
			condition = () => new OP.Unop(OP.OpCode.NOT, this.condition.build(builder).asTac(builder), TYPE.BOOL);
		}

		const label_then:  string = builder.newLabel();
		const label_else:  string = builder.newLabel();
		const label_endif: string = this.alternative ? builder.newLabel() : label_else;

		builder.terminateBlock(new OP.GotoConditional(condition(), label_then, this.alternative ? label_else : label_endif));

		builder.initiateBlock(label_then);
		this.consequent.build(builder);
		builder.terminateBlock(new OP.Goto(label_endif));

		if (this.alternative) {
			builder.initiateBlock(label_else);
			this.alternative.build(builder);
			builder.terminateBlock(new OP.Goto(label_endif));
		}

		builder.initiateBlock(label_endif);
	}
}

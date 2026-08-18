import {
	type Builder,
	OP,
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
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import type * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';



export class StatementExpression extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementExpression {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementExpression);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'statement_expression', ['break']>,
		public readonly expr?: EXPR.Expression,
	) {
		super(start_node, {}, (expr) ? [expr] : void 0);
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		return this.expr?.type().isBottomType ?? false;
	}

	@runOnceMethod
	public override build(builder: Builder): void {
		if (this.expr) {
			return builder.pushInstruction(new OP.Drop(this.expr.build(builder)));
		}
	}
}

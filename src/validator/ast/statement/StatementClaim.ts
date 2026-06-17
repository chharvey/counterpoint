import {
	type Builder,
	OP,
	TypeErrorNotNarrow,
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
import {TYPE} from '../../../typer/index.ts';
import type {SymbolSchemaVar} from '../../index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import {Index} from '../Index-.ts';
import {Key} from '../Key.ts';
import type * as AST_TYPE from '../type/index.ts';
import * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';



export class StatementClaim extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementClaim {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementClaim);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'statement_claim', ['break']>,
		private readonly assignee: EXPR.Variable | EXPR.Access,
		private readonly claimed_type: AST_TYPE.Type,
	) {
		super(start_node, {}, [assignee, claimed_type]);
	}

	@noopGetter(memoizeGetter)
	public override get hasBottomType(): boolean {
		return this.assignee.type().isBottomType;
	}

	public override typeCheck(): void {
		super.typeCheck();
		const computed_type: TYPE.Type = this.assignee.type();
		const claimed_type:  TYPE.Type = this.claimed_type.eval();
		/* Type claim statements can only narrow the expression’s type. */
		if (!claimed_type.isSubtypeOf(computed_type)) {
			throw new TypeErrorNotNarrow(claimed_type, computed_type, this.line_index, this.col_index);
		}
		if (this.assignee instanceof EXPR.Variable) {
			const symbol = this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar | undefined;
			if (symbol) {
				symbol.type = claimed_type;
			}
		} else {
			assert_instanceof(this.assignee, EXPR.Access);
			const base_type: TYPE.Type = this.assignee.base.type();
			const {accessor} = this.assignee;
			switch (true) {
				case base_type instanceof TYPE.Tuple: {
					assert_instanceof(accessor, Index);
					return base_type.set(accessor.index, claimed_type, accessor);
				}
				case base_type instanceof TYPE.Record: {
					assert_instanceof(accessor, Key);
					return base_type.set(accessor.id, claimed_type, accessor);
				}
				default: {
					assert_instanceof(accessor, EXPR.Expression);
					throw new Error('`StatementClaim[assignee: Access[accessor: Expression]]#typeCheck` not yet supported.');
				}
			}
		}
	}

	@runOnceMethod
	public override build(builder: Builder): void {
		return builder.pushInstruction(new OP.Drop(this.assignee.build(builder)));
	}
}

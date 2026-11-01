import {
	assert_instanceof,
	memoizeGetter,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {
	SyntaxNodeType,
	SyntaxNodeFamily,
} from '../../utils-private.ts';
import type {ValidAccessOperator} from '../../Operator.ts';
import {ExprVisitorType} from '../index.ts';
import type {Index} from '../Index-.ts';
import type {Key} from '../Key.ts';
import {Expression} from './Expression.ts';



export class Access extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Access {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Access);
		return expression;
	}

	#isEntryOptional?: boolean;


	public constructor(
		start_node:
			| SyntaxNodeType<'expression_compound'>
			| SyntaxNodeFamily<'assignee', ['break', 'return']>,

		public readonly kind:     ValidAccessOperator,
		public readonly base:     Expression,
		public readonly accessor: Index | Key | Expression,
	) {
		super(start_node, {kind}, [base, accessor]);
	}


	@memoizeGetter
	public get isEntryOptional(): boolean {
		if (typeof this.#isEntryOptional !== 'boolean') {
			new ExprVisitorType().visit(this);
		}
		return this.#isEntryOptional!;
	}

	public set isEntryOptional(b: boolean) {
		this.#isEntryOptional = b;
	}
}

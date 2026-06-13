import {
	type Builder,
	OP,
	TypeErrorInvalidOperation,
} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import type {Operator} from '../../Operator.ts';
import {Expression} from './Expression.ts';
import {Operation} from './Operation.ts';



export class OperationTernary extends Operation {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): OperationTernary {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, OperationTernary);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'expression_conditional', ['break']>,
		operator: Operator.COND,
		public readonly operand0: Expression,
		public readonly operand1: Expression,
		public readonly operand2: Expression,
	) {
		super(start_node, operator, [operand0, operand1, operand2]);
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		// compute types early to rethrow any errors
		const [t0, t1, t2]: TYPE.Type[] = this.children.map((operand) => operand.type());
		if (!t0.isSubtypeOf(TYPE.BOOL)) {
			throw new TypeErrorInvalidOperation(this);
		}
		return (
			t0.isBottomType       ? TYPE.NOTHING :
			t0.equals(TYPE.FALSE) ? t2 : // If `typeof a` is `false`, then `typeof (if a then b else c)` is `typeof c`.
			t0.equals(TYPE.TRUE)  ? t1 : // If `typeof a` is `true`,  then `typeof (if a then b else c)` is `typeof b`.
			t1.union(t2)
		);
	}

	@memoizeMethod
	public override build(builder: Builder): OP.Get {
		return OP.conditional_expression(
			builder,
			this.operand1.type().union(this.operand2.type()), // TODO: turn typeCheck optimization off and just use `this.type()` here
			() => this.operand0.build(builder),
			() => this.operand1.build(builder),
			() => this.operand2.build(builder),
		);
	}
}

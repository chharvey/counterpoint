import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
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
		start_node: SyntaxNodeFamily<'expression_conditional', ['break', 'return']>,
		operator: Operator.COND,
		public readonly operand0: Expression,
		public readonly operand1: Expression,
		public readonly operand2: Expression,
	) {
		super(start_node, operator, [operand0, operand1, operand2]);
	}
}

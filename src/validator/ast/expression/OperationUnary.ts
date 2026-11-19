import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeSupertype} from '../../utils-private.ts';
import type {ValidOperatorUnary} from '../../Operator.ts';
import {Expression} from './Expression.ts';
import {Operation} from './Operation.ts';



export class OperationUnary extends Operation {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): OperationUnary {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, OperationUnary);
		return expression;
	}


	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		public readonly operator: ValidOperatorUnary,
		public readonly operand:  Expression,
	) {
		super(start_node, operator, [operand]);
	}
}

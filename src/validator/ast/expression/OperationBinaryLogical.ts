import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeSupertype} from '../../utils-private.ts';
import type {ValidOperatorLogical} from '../../Operator.ts';
import {Expression} from './Expression.ts';
import {OperationBinary} from './OperationBinary.ts';



export class OperationBinaryLogical extends OperationBinary {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): OperationBinaryLogical {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, OperationBinaryLogical);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		public override readonly operator: ValidOperatorLogical,
		operand0: Expression,
		operand1: Expression,
	) {
		super(start_node, operator, operand0, operand1);
	}
}

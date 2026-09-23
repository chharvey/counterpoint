import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeSupertype} from '../../utils-private.ts';
import type {ValidOperatorBinary} from '../../Operator.ts';
import {Expression} from './Expression.ts';
import {Operation} from './Operation.ts';



/**
 * Known subclasses:
 * - OperationBinaryCast
 * - OperationBinaryArithmetic
 * - OperationBinaryComparative
 * - OperationBinaryEquality
 * - OperationBinaryLogical
 */
export abstract class OperationBinary extends Operation {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): OperationBinary {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, OperationBinary);
		return expression;
	}


	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected readonly operator: ValidOperatorBinary,
		public    readonly operand0: Expression,
		public    readonly operand1: Expression,
	) {
		super(start_node, operator, [operand0, operand1]);
	}
}

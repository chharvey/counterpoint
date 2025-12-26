import type {TYPE} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeSupertype} from '../utils-private.ts';
import type {ValidOperatorBinary} from '../Operator.ts';
import {
	ASTNodeExpression,
	typeDeco,
} from './Expression.ts';
import {ASTNodeOperation} from './Operation.ts';



/**
 * Known subclasses:
 * - ASTNodeOperationBinaryCast
 * - ASTNodeOperationBinaryArithmetic
 * - ASTNodeOperationBinaryComparative
 * - ASTNodeOperationBinaryEquality
 * - ASTNodeOperationBinaryLogical
 */
export abstract class ASTNodeOperationBinary extends ASTNodeOperation {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ASTNodeOperationBinary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeOperationBinary);
		return expression;
	}


	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected readonly operator: ValidOperatorBinary,
		public    readonly operand0: ASTNodeExpression,
		public    readonly operand1: ASTNodeExpression,
	) {
		super(start_node, operator, [operand0, operand1]);
	}

	/**
	 * @final
	 */
	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		return this.type_do(
			this.operand0.type(),
			this.operand1.type(),
		);
	}

	protected abstract type_do(t0: TYPE.Type, t1: TYPE.Type): TYPE.Type;
}

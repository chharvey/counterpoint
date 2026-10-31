import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeSupertype} from '../../utils-private.ts';
import type {ValidOperatorCast} from '../../Operator.ts';
import {validate_intrinsic_name} from '../utils-private.ts';
import {Expression} from './Expression.ts';
import {OperationBinary} from './OperationBinary.ts';



export class OperationBinaryCast extends OperationBinary {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): OperationBinaryCast {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, OperationBinaryCast);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		public override readonly operator: ValidOperatorCast,
		operand0: Expression,
		operand1: Expression,
	) {
		super(start_node, operator, operand0, operand1);
	}

	public override varCheck(): void {
		// NOTE: ignore var-checking `this.operand1` for now, as semantics is determined by syntax.
		// (`this.operand1.source` must be an `IntrinsicName`)
		this.operand0.varCheck();
		return validate_intrinsic_name(this.operand1.source);
	}

	public override typeCheck(): void {
		// NOTE: ignore type-checking `this.operand1` for now, as semantics is determined by syntax.
		// (`this.operand1.source` must be an `IntrinsicName`)
		this.operand0.typeCheck();
		this.type(); // assert does not throw
	}
}

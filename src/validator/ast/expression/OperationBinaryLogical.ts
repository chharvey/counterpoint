import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeSupertype} from '../../utils-private.ts';
import {
	Operator,
	type ValidOperatorLogical,
} from '../../Operator.ts';
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
		protected override readonly operator: ValidOperatorLogical,
		operand0: Expression,
		operand1: Expression,
	) {
		super(start_node, operator, operand0, operand1);
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		const [t0, t1]: readonly TYPE.Type[] = this.children.map((operand) => operand.type());
		if (t0.isBottomType) {
			return TYPE.NOTHING;
		}
		switch (this.operator) {
			case Operator.AND: {
				return (
					t0.isDefinitelyFalsy  ? t0 :
					t0.isDefinitelyTruthy ? t1 :
					t0.falsySide.union(t1)
				);
			}
			case Operator.OR: {
				return (
					t0.isDefinitelyFalsy  ? t1 :
					t0.isDefinitelyTruthy ? t0 :
					t0.truthySide.union(t1)
				);
			}
		}
	}
}

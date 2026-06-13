import type {
	Builder,
	OP,
} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {
	VALUE,
	TYPE,
} from '../../../typer/index.ts';
import type {SyntaxNodeSupertype} from '../../utils-private.ts';
import {
	Operator,
	type ValidOperatorCast,
} from '../../Operator.ts';
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
		protected override readonly operator: ValidOperatorCast,
		operand0: Expression,
		operand1: Expression,
	) {
		super(start_node, Operator.CAST, operand0, operand1);
	}

	protected override type_do(_t0: TYPE.Type, _t1: TYPE.Type): TYPE.Type {
		throw new Error('OperationBinaryCast#type not yet supported.');
	}

	@memoizeMethod
	public override build(_: Builder): OP.Value {
		throw new Error('`OperationBinaryCast#build` not yet supported.');
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const v0: VALUE.Value | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		const v1: VALUE.Value | null = this.operand1.fold();
		if (!v1) {
			return v1;
		}
		throw new Error('OperationBinaryCast#fold not yet supported.');
	}
}

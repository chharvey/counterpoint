import * as assert from 'node:assert';
import {TypeErrorInvalidOperation} from '../../../index.ts';
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
import type {ValidOperatorArithmetic} from '../../Operator.ts';
import {Expression} from './Expression.ts';
import {OperationBinary} from './OperationBinary.ts';



function bothInts(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return t0.isSubtypeOf(TYPE.INT) && t1.isSubtypeOf(TYPE.INT);
}

function bothNats(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return t0.isSubtypeOf(TYPE.NAT) && t1.isSubtypeOf(TYPE.NAT);
}

function bothFloats(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return t0.isSubtypeOf(TYPE.FLOAT) && t1.isSubtypeOf(TYPE.FLOAT);
}



export class OperationBinaryArithmetic extends OperationBinary {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): OperationBinaryArithmetic {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, OperationBinaryArithmetic);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected override readonly operator: ValidOperatorArithmetic,
		operand0: Expression,
		operand1: Expression,
	) {
		super(start_node, operator, operand0, operand1);
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		const [t0, t1]: readonly TYPE.Type[] = this.children.map((operand) => operand.type());
		if (t0.isBottomType || t1.isBottomType) {
			return TYPE.NOTHING;
		}
		return (
			bothInts  (t0, t1) ? TYPE.INT :
			bothNats  (t0, t1) ? TYPE.NAT :
			bothFloats(t0, t1) ? TYPE.FLOAT :
			assert.fail(new TypeErrorInvalidOperation(this))
		);
	}
}

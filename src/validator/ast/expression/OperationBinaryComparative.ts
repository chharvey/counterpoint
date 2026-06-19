import * as assert from 'node:assert';
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
import type {SyntaxNodeSupertype} from '../../utils-private.ts';
import {
	Operator,
	type ValidOperatorComparative,
} from '../../Operator.ts';
import {Expression} from './Expression.ts';
import {OperationBinary} from './OperationBinary.ts';



export function bothNumbers(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return t0.isSubtypeOf(TYPE.NUMBER) && t1.isSubtypeOf(TYPE.NUMBER);
}


export class OperationBinaryComparative extends OperationBinary {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): OperationBinaryComparative {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, OperationBinaryComparative);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected override readonly operator: ValidOperatorComparative,
		operand0: Expression,
		operand1: Expression,
	) {
		super(start_node, operator, operand0, operand1);
		if (this.operator === Operator.IS as ValidOperatorComparative) { // TODO: make a new class for comparing object instances
			throw new TypeError(`Operator ${ this.operator } not yet supported.`);
		}
	}

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type): TYPE.Type {
		if (t0.isBottomType || t1.isBottomType) {
			return TYPE.NOTHING;
		}
		return (
			bothNumbers(t0, t1) ? TYPE.BOOL :
			assert.fail(new TypeErrorInvalidOperation(this))
		);
	}

	@memoizeMethod
	public override build(builder: Builder): OP.Binop {
		return new OP.Binop(new Map<Operator, OP.OpCodeBin>([
			[Operator.LT,  OP.OpCode.LT],
			[Operator.GT,  OP.OpCode.GT],
			[Operator.LE,  OP.OpCode.LE],
			[Operator.GE,  OP.OpCode.GE],
		]).get(this.operator)!, this.operand0.build(builder).asTac(builder), this.operand1.build(builder).asTac(builder), this.type());
	}
}

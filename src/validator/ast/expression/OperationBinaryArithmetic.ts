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
	type ValidOperatorArithmetic,
} from '../../Operator.ts';
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

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type): TYPE.Type {
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

	@memoizeMethod
	public override build(builder: Builder): OP.Binop {
		const typ: TYPE.Type = this.type();
		const [t0, t1] = [this.operand0.type(),                        this.operand1.type()];
		const [v0, v1] = [this.operand0.build(builder).asTac(builder), this.operand1.build(builder).asTac(builder)];
		return (
			bothInts(t0, t1) ? new OP.Binop(new Map<Operator, OP.OpCodeBin>([
				[Operator.EXP, OP.OpCode.INT_EXP],
				[Operator.MUL, OP.OpCode.INT_MUL],
				[Operator.DIV, OP.OpCode.INT_DIV],
				[Operator.ADD, OP.OpCode.INT_ADD],
				[Operator.SUB, OP.OpCode.INT_SUB],
			]).get(this.operator)!, v0, v1, typ) :
			bothNats(t0, t1) ? new OP.Binop(new Map<Operator, OP.OpCodeBin>([
				[Operator.EXP, OP.OpCode.NAT_EXP],
				[Operator.MUL, OP.OpCode.NAT_MUL],
				[Operator.DIV, OP.OpCode.NAT_DIV],
				[Operator.ADD, OP.OpCode.NAT_ADD],
				[Operator.SUB, OP.OpCode.NAT_SUB],
			]).get(this.operator)!, v0, v1, typ) :
			(assert.ok(bothFloats(t0, t1)), new OP.Binop(new Map<Operator, OP.OpCodeBin>([
				[Operator.EXP, OP.OpCode.FLOAT_EXP],
				[Operator.MUL, OP.OpCode.FLOAT_MUL],
				[Operator.DIV, OP.OpCode.FLOAT_DIV],
				[Operator.ADD, OP.OpCode.FLOAT_ADD],
				[Operator.SUB, OP.OpCode.FLOAT_SUB],
			]).get(this.operator)!, v0, v1, typ))
		);
	}
}

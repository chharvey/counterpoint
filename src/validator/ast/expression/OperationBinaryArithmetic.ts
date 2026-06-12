import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	type Builder,
	OP,
	TypeErrorInvalidOperation,
	NanErrorInvalid,
	NanErrorDivZero,
} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {
	type VALUE,
	TYPE,
} from '../../../typer/index.ts';
import type {SyntaxNodeSupertype} from '../../utils-private.ts';
import {
	Operator,
	type ValidOperatorArithmetic,
} from '../../Operator.ts';
import {
	bothInts,
	bothNats,
	bothFloats,
} from '../utils-private.ts';
import {Expression} from './Expression.ts';
import {OperationBinary} from './OperationBinary.ts';



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

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		const v0: VALUE.Value | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		if (this.operator === Operator.MUL && (v0 as VALUE.Number).eq0()) {
			return v0;
		}
		const v1: VALUE.Value | null = this.operand1.fold();
		if (!v1) {
			return v1;
		}
		if (this.operator === Operator.MUL && (v0 as VALUE.Number).eq1() || this.operator === Operator.ADD && (v0 as VALUE.Number).eq0()) {
			return v1;
		}
		if (this.operator === Operator.DIV && (v1 as VALUE.Number).eq0()) {
			throw new NanErrorDivZero(this.operand1);
		}
		return this.foldNumeric(
			(v0 as VALUE.Number<VALUE.Integer | VALUE.Natural | VALUE.Float>),
			(v1 as VALUE.Number<VALUE.Integer | VALUE.Natural | VALUE.Float>),
		);
	}

	private foldNumeric<T extends VALUE.Number<T>>(v0: T, v1: T): T {
		try {
			return new Map<Operator, (x: T, y: T) => T>([
				[Operator.EXP, (x, y) => x.exp(y)],
				[Operator.MUL, (x, y) => x.times(y)],
				[Operator.DIV, (x, y) => x.divide(y)],
				[Operator.ADD, (x, y) => x.plus(y)],
				[Operator.SUB, (x, y) => x.minus(y)],
			]).get(this.operator)!(v0, v1);
		} catch (err) {
			throw (err instanceof xjs.NaNError) ? new NanErrorInvalid(this) : err;
		}
	}
}

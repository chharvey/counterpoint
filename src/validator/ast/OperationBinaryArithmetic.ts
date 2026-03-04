import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	type VALUE,
	TYPE,
	type Optimizer,
	IR,
	bigint_to_i64,
	type Local,
	BinVect,
	TypeErrorInvalidOperation,
	NanErrorInvalid,
	NanErrorDivZero,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeSupertype} from '../utils-private.ts';
import {
	Operator,
	type ValidOperatorArithmetic,
} from '../Operator.ts';
import {
	bothInts,
	bothNats,
	bothFloats,
} from './utils-private.ts';
import {
	buildDeco,
	Expression,
} from './Expression.ts';
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

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		const mod:          binaryen.Module          = this.builder.module;
		const [t0, t1]:     TYPE.Type[]              = this.children.map((operand) => operand.type());
		const [arg0, arg1]: binaryen.ExpressionRef[] = this.children.map((operand) => operand.build());
		const v0:           VALUE.Value | null       = this.operand0.fold();

		// short-circuit by using identity laws
		// if operand0 is foldable and using identity laws, just return operand1
		if (v0 && (this.operator === Operator.MUL && (v0 as VALUE.Number).eq1() || this.operator === Operator.ADD && (v0 as VALUE.Number).eq0())) {
			return arg1;
		}
		// if operand0 is not foldable, try short-circuiting at runtime
		if (!v0) {
			switch (this.operator) {
				case Operator.MUL: {
					const local0: Local = this.builder.addLocal(arg0);
					const teeer         = new BinVect(mod, local0.tee());
					const getter        = new BinVect(mod, local0.get());
					// if arg0 is mathematically 0, return it
					return mod.if(
						mod.i32.or(
							mod.i32.and(teeer.isInt,    mod.i64.eqz(getter.intValue)),
							mod.i32.and(getter.isFloat, mod.f64.eq(getter.floatValue, mod.f64.const(0.0))), // also takes care of the `-0.0` case
						),
						local0.get(),
						// else if arg0 is mathematically 1, return arg1
						mod.if(
							mod.i32.or(
								mod.i32.and(getter.isInt,   mod.i64.eq(getter.intValue,   bigint_to_i64(mod, 1n))),
								mod.i32.and(getter.isFloat, mod.f64.eq(getter.floatValue, mod.f64.const(1.0))),
							),
							arg1,
							// else return a wasm call
							mod.call(
								bothInts(t0, t1) || bothNats(t0, t1) ? 'vimul' : (assert.ok(bothFloats(t0, t1)), 'vfmul'),
								[local0.get(), arg1],
								binaryen.v128,
							),
						),
					);
				}
				case Operator.ADD: {
					const local0: Local = this.builder.addLocal(arg0);
					const teeer         = new BinVect(mod, local0.tee());
					const getter        = new BinVect(mod, local0.get());
					// if arg0 is mathematically 0, return arg1
					return mod.if(
						mod.i32.or(
							mod.i32.and(teeer.isInt,    mod.i64.eqz(getter.intValue)),
							mod.i32.and(getter.isFloat, mod.f64.eq(getter.floatValue, mod.f64.const(0.0))), // also takes care of the `-0.0` case
						),
						arg1,
						// else return a wasm call
						mod.call(
							bothInts(t0, t1) || bothNats(t0, t1) ? 'viadd' : (assert.ok(bothFloats(t0, t1)), 'vfadd'),
							[local0.get(), arg1],
							binaryen.v128,
						),
					);
				}
			}
		}

		// if operand0 is foldable and not using identity laws, or if operand0 is not foldable and operation is not short-circuitable, return wasm call
		switch (true) {
			case bothInts(t0, t1): {
				return mod.call(new Map<Operator, string>([
					[Operator.EXP, 'viexp'],
					[Operator.MUL, 'vimul'],
					[Operator.DIV, 'vidiv_s'],
					[Operator.ADD, 'viadd'],
					[Operator.SUB, 'visub_s'],
				]).get(this.operator)!, [arg0, arg1], binaryen.v128);
			}
			case bothNats(t0, t1): {
				return mod.call(new Map<Operator, string>([
					[Operator.EXP, 'viexp'],
					[Operator.MUL, 'vimul'],
					[Operator.DIV, 'vidiv_u'],
					[Operator.ADD, 'viadd'],
					[Operator.SUB, 'visub_u'],
				]).get(this.operator)!, [arg0, arg1], binaryen.v128);
			}
			case bothFloats(t0, t1): {
				if (this.operator === Operator.EXP) {
					return mod.unreachable();
				}
				return mod.call(new Map<Operator, string>([
					[Operator.MUL, 'vfmul'],
					[Operator.DIV, 'vfdiv'],
					[Operator.ADD, 'vfadd'],
					[Operator.SUB, 'vfsub'],
				]).get(this.operator)!, [arg0, arg1], binaryen.v128);
			}
			default: {
				return mod.unreachable();
			}
		}
	}

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type): TYPE.Type {
		if (t0.isBottomType) {
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
	public override lower(optimizer: Optimizer): IR.Binop {
		const typ: TYPE.Type = this.type();
		const [t0, t1] = [this.operand0.type(),                            this.operand1.type()];
		const [v0, v1] = [this.operand0.lower(optimizer).asTac(optimizer), this.operand1.lower(optimizer).asTac(optimizer)];
		return (
			bothInts(t0, t1) ? new IR.Binop(new Map<Operator, IR.BinOp>([
				[Operator.EXP, IR.BinOp.INT_EXP],
				[Operator.MUL, IR.BinOp.INT_MUL],
				[Operator.DIV, IR.BinOp.INT_DIV],
				[Operator.ADD, IR.BinOp.INT_ADD],
				[Operator.SUB, IR.BinOp.INT_SUB],
			]).get(this.operator)!, v0, v1, typ) :
			bothNats(t0, t1) ? new IR.Binop(new Map<Operator, IR.BinOp>([
				[Operator.EXP, IR.BinOp.NAT_EXP],
				[Operator.MUL, IR.BinOp.NAT_MUL],
				[Operator.DIV, IR.BinOp.NAT_DIV],
				[Operator.ADD, IR.BinOp.NAT_ADD],
				[Operator.SUB, IR.BinOp.NAT_SUB],
			]).get(this.operator)!, v0, v1, typ) :
			(assert.ok(bothFloats(t0, t1)), new IR.Binop(new Map<Operator, IR.BinOp>([
				[Operator.EXP, IR.BinOp.FLOAT_EXP],
				[Operator.MUL, IR.BinOp.FLOAT_MUL],
				[Operator.DIV, IR.BinOp.FLOAT_DIV],
				[Operator.ADD, IR.BinOp.FLOAT_ADD],
				[Operator.SUB, IR.BinOp.FLOAT_SUB],
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

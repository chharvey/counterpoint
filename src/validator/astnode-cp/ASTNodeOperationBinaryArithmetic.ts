import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	type VALUE,
	TYPE,
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
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeSupertype} from '../utils-private.ts';
import {
	Operator,
	type ValidOperatorArithmetic,
} from '../Operator.ts';
import {
	bothInts,
	bothFloats,
} from './utils-private.ts';
import {
	buildDeco,
	ASTNodeExpression,
} from './ASTNodeExpression.ts';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.ts';



export class ASTNodeOperationBinaryArithmetic extends ASTNodeOperationBinary {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryArithmetic {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeOperationBinaryArithmetic);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected override readonly operator: ValidOperatorArithmetic,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		const mod:          binaryen.Module          = this.builder.module;
		const [arg0, arg1]: binaryen.ExpressionRef[] = this.children.map((operand) => operand.build());
		const v0:           VALUE.Value | null       = this.operand0.fold();

		// if operand0 is not foldable, short-circuit by using identity laws
		if (!v0) {
			const local0: Local = this.builder.addLocal(arg0)[1];
			const teeer         = new BinVect(mod, local0.tee());
			const getter        = new BinVect(mod, local0.get());
			if (this.operator === Operator.MUL) {
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
						// else return a `vmul` call
						mod.call('vmul', [local0.get(), arg1], binaryen.v128),
					),
				);
			} else if (this.operator === Operator.ADD) {
				// if arg0 is mathematically 0, return arg1
				return mod.if(
					mod.i32.or(
						mod.i32.and(teeer.isInt,    mod.i64.eqz(getter.intValue)),
						mod.i32.and(getter.isFloat, mod.f64.eq(getter.floatValue, mod.f64.const(0.0))), // also takes care of the `-0.0` case
					),
					arg1,
					// else return a `vadd` call
					mod.call('vadd', [local0.get(), arg1], binaryen.v128),
				);
			}
		}

		if (v0 && (this.operator === Operator.MUL && (v0 as VALUE.Number).eq1() || this.operator === Operator.ADD && (v0 as VALUE.Number).eq0())) {
			return arg1;
		}

		return this.builder.module.call(new Map<Operator, string>([
			[Operator.EXP, 'vexp'],
			[Operator.MUL, 'vmul'],
			[Operator.DIV, 'vdiv'],
			[Operator.ADD, 'vadd'],
		]).get(this.operator)!, [arg0, arg1], binaryen.v128);
	}

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type): TYPE.Type {
		if (t0.isBottomType) {
			return TYPE.NOTHING;
		}
		return (
			bothInts  (t0, t1) ? TYPE.INT :
			bothFloats(t0, t1) ? TYPE.FLOAT :
			assert.fail(new TypeErrorInvalidOperation(this))
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
			(v0 as VALUE.Number<VALUE.Integer | VALUE.Float>),
			(v1 as VALUE.Number<VALUE.Integer | VALUE.Float>),
		);
	}

	private foldNumeric<T extends VALUE.Number<T>>(v0: T, v1: T): T {
		try {
			return new Map<Operator, (x: T, y: T) => T>([
				[Operator.EXP, (x, y) => x.exp(y)],
				[Operator.MUL, (x, y) => x.times(y)],
				[Operator.DIV, (x, y) => x.divide(y)],
				[Operator.ADD, (x, y) => x.plus(y)],
				// [Operator.SUB, (x, y) => x.minus(y)],
			]).get(this.operator)!(v0, v1);
		} catch (err) {
			throw (err instanceof xjs.NaNError) ? new NanErrorInvalid(this) : err;
		}
	}
}

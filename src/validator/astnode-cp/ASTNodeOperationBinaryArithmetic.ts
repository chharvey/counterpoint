import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	type Builder,
	TypeError01,
	NanError01,
	NanError02,
} from '../../index.js';
import {
	throw_expression,
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeSupertype} from '../utils-private.js';
import {
	Operator,
	type ValidOperatorArithmetic,
} from '../Operator.js';
import {
	bothNumeric,
	eitherFloats,
	bothInts,
	bothFloats,
} from './utils-private.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.js';



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
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): binaryen.ExpressionRef {
		const types  = [this.operand0.type(),         this.operand1.type()]         as const;
		const builds = [this.operand0.build(builder), this.operand1.build(builder)] as const;
		return ASTNodeOperationBinary.operate(builder.module, this.operator, types, builds, (args) => {
			args = ASTNodeOperation.coerceOperands(builder.module, ...args);
			const bintypes: readonly binaryen.Type[] = args.map((arg) => binaryen.getExpressionType(arg));
			bintypes.forEach((bt) => ASTNodeOperation.expectIntOrFloat(bt));
			const bintype: binaryen.Type = (bintypes.includes(binaryen.f64)) ? binaryen.f64 : binaryen.i32;
			return (
				(this.operator === Operator.EXP) ? new Map<binaryen.Type, binaryen.ExpressionRef>([
					[binaryen.i32, builder.module.call('exp', [...args], binaryen.i32)],
					[binaryen.f64, builder.module.unreachable()], // TODO: support runtime exponentiation for floats
				]).get(bintype)! :
				(this.operator === Operator.DIV) ? new Map<binaryen.Type, binaryen.ExpressionRef>([
					[binaryen.i32, builder.module.i32.div_s (...args)],
					[binaryen.f64, builder.module.f64.div   (...args)],
				]).get(bintype)! :
				builder.module[new Map<binaryen.Type, 'i32' | 'f64'>([
					[binaryen.i32, 'i32'],
					[binaryen.f64, 'f64'],
				]).get(bintype)!][new Map<Operator, 'mul' | 'add' | 'sub'>([
					[Operator.MUL, 'mul'],
					[Operator.ADD, 'add'],
					[Operator.SUB, 'sub'],
				]).get(this.operator)!](...args)
			);
		});
	}

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type, int_coercion: boolean): TYPE.Type {
		return (bothNumeric(t0, t1))
			? (
				(bothInts(t0, t1))   ? TYPE.INT                                           :
				(bothFloats(t0, t1)) ? TYPE.FLOAT                                         :
				(int_coercion)       ? (eitherFloats(t0, t1)) ? TYPE.FLOAT : t0.union(t1) :
				throw_expression(new TypeError01(this))
			)
			: throw_expression(new TypeError01(this));
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const v0: OBJ.Object | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		const v1: OBJ.Object | null = this.operand1.fold();
		if (!v1) {
			return v1;
		}
		if (this.operator === Operator.DIV && v1 instanceof OBJ.Number && v1.eq0()) {
			throw new NanError02(this.operand1);
		}
		return (v0 instanceof OBJ.Integer && v1 instanceof OBJ.Integer)
			? this.foldNumeric(v0, v1)
			: this.foldNumeric(
				(v0 as OBJ.Number).toFloat(),
				(v1 as OBJ.Number).toFloat(),
			);
	}

	private foldNumeric<T extends OBJ.Number<T>>(v0: T, v1: T): T {
		try {
			return new Map<Operator, (x: T, y: T) => T>([
				[Operator.EXP, (x, y) => x.exp(y)],
				[Operator.MUL, (x, y) => x.times(y)],
				[Operator.DIV, (x, y) => x.divide(y)],
				[Operator.ADD, (x, y) => x.plus(y)],
				// [Operator.SUB, (x, y) => x.minus(y)],
			]).get(this.operator)!(v0, v1);
		} catch (err) {
			throw (err instanceof xjs.NaNError) ? new NanError01(this) : err;
		}
	}
}

import * as assert from 'assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs'
import {
	SolidType,
	SolidTypeUnion,
	SolidObject,
	SolidNumber,
	Int16,
	Builder,
	TypeError01,
	NanError01,
	NanError02,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	Operator,
	ValidOperatorArithmetic,
} from './package.js';
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
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryArithmetic {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinaryArithmetic);
		return expression;
	}

	/**
	 * Return an instruction performing an operation on arguments.
	 * @param mod   the binaryen module
	 * @param op    the binary operator
	 * @param types the compile-time types of the operands
	 * @param args  the operands
	 * @return      an instruction that performs the operation at runtime
	 */
	private static operate(
		mod:   binaryen.Module,
		op:    ValidOperatorArithmetic,
		types: readonly [SolidType, SolidType],
		args:  readonly [binaryen.ExpressionRef, binaryen.ExpressionRef],
	): binaryen.ExpressionRef {
		if (types[0] instanceof SolidTypeUnion) {
			// assert: `args[0]` is equivalent to a result of `Builder.createBinEither()`
			return Builder.createBinEither(mod, mod.tuple.extract(args[0], 1), [
				ASTNodeOperationBinaryArithmetic.operate(mod, op, [types[0].left,  types[1]], [mod.tuple.extract(args[0], 2), args[1]]),
				ASTNodeOperationBinaryArithmetic.operate(mod, op, [types[0].right, types[1]], [mod.tuple.extract(args[0], 3), args[1]]),
			]);
		} else if (types[1] instanceof SolidTypeUnion) {
			// assert: `args[1]` is equivalent to a result of `Builder.createBinEither()`
			return Builder.createBinEither(mod, mod.tuple.extract(args[1], 1), [
				ASTNodeOperationBinaryArithmetic.operate(mod, op, [types[0], types[1].left],  [args[0], mod.tuple.extract(args[1], 2)]),
				ASTNodeOperationBinaryArithmetic.operate(mod, op, [types[0], types[1].right], [args[0], mod.tuple.extract(args[1], 3)]),
			]);
		} else {
			args = ASTNodeOperation.coerceOperands(mod, ...args);
			const bintypes: readonly [binaryen.Type, binaryen.Type] = [
				binaryen.getExpressionType(args[0]),
				binaryen.getExpressionType(args[1]),
			];
			bintypes.forEach((bt) => ASTNodeOperation.expectIntOrFloat(bt));
			const bintype: binaryen.Type = (bintypes.includes(binaryen.f64)) ? binaryen.f64 : binaryen.i32;
			return (
				(op === Operator.EXP) ? new Map<binaryen.Type, binaryen.ExpressionRef>([
					[binaryen.i32, mod.call('exp', [...args], binaryen.i32)],
					[binaryen.f64, mod.unreachable()], // TODO: support runtime exponentiation for floats
				]).get(bintype)! :
				(op === Operator.DIV) ? new Map<binaryen.Type, binaryen.ExpressionRef>([
					[binaryen.i32, mod.i32.div_s (...args)],
					[binaryen.f64, mod.f64.div   (...args)],
				]).get(bintype)! :
				mod[new Map<binaryen.Type, 'i32' | 'f64'>([
					[binaryen.i32, 'i32'],
					[binaryen.f64, 'f64'],
				]).get(bintype)!][new Map<Operator, 'mul' | 'add' | 'sub'>([
					[Operator.MUL, 'mul'],
					[Operator.ADD, 'add'],
					[Operator.SUB, 'sub'],
				]).get(op)!](...args)
			);
		}
	}


	constructor (
		start_node: ParseNode,
		override readonly operator: ValidOperatorArithmetic,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
	}

	protected override build_do(builder: Builder): binaryen.ExpressionRef {
		return ASTNodeOperationBinaryArithmetic.operate(
			builder.module,
			this.operator,
			[this.operand0.type(),         this.operand1.type()],
			[this.operand0.build(builder), this.operand1.build(builder)],
		);
	}

	protected override type_do_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType {
		if (bothNumeric(t0, t1)) {
			if (bothInts(t0, t1)) {
				return SolidType.INT;
			}
			if (bothFloats(t0, t1)) {
				return SolidType.FLOAT;
			}
			if (int_coercion) {
				return (eitherFloats(t0, t1)) ? SolidType.FLOAT : SolidType.INT.union(SolidType.FLOAT);
			}
		}
		throw new TypeError01(this)
	}

	protected override fold_do(): SolidObject | null {
		const v0: SolidObject | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		const v1: SolidObject | null = this.operand1.fold();
		if (!v1) {
			return v1;
		}
		if (this.operator === Operator.DIV && v1 instanceof SolidNumber && v1.eq0()) {
			throw new NanError02(this.operand1);
		}
		return (v0 instanceof Int16 && v1 instanceof Int16)
			? this.foldNumeric(v0, v1)
			: this.foldNumeric(
				(v0 as SolidNumber).toFloat(),
				(v1 as SolidNumber).toFloat(),
			);
	}
	private foldNumeric<T extends SolidNumber<T>>(x: T, y: T): T {
		try {
			return new Map<Operator, (x: T, y: T) => T>([
				[Operator.EXP, (x, y) => x.exp(y)],
				[Operator.MUL, (x, y) => x.times(y)],
				[Operator.DIV, (x, y) => x.divide(y)],
				[Operator.ADD, (x, y) => x.plus(y)],
				// [Operator.SUB, (x, y) => x.minus(y)],
			]).get(this.operator)!(x, y)
		} catch (err) {
			throw (err instanceof xjs.NaNError) ? new NanError01(this) : err;
		}
	}
}

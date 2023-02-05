import * as assert from 'assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs'
import {
	SolidType,
	SolidObject,
	SolidNumber,
	Int16,
	INST,
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
	bothFloats,
	neitherFloats,
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
	constructor (
		start_node: ParseNode,
		override readonly operator: ValidOperatorArithmetic,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
	}

	protected override build_do(builder: Builder): INST.InstructionBinopArithmetic {
		return new INST.InstructionBinopArithmetic(
			this.operator,
			this.operand0.build(builder),
			this.operand1.build(builder),
		);
	}
	protected override type_do_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType {
		if (bothNumeric(t0, t1)) {
			if (int_coercion) {
				return (eitherFloats(t0, t1)) ? SolidType.FLOAT : SolidType.INT;
			}
			if (bothFloats   (t0, t1)) { return SolidType.FLOAT; }
			if (neitherFloats(t0, t1)) { return SolidType.INT; }
		}
		throw new TypeError01(this)
	}

	protected override build_bin_do(builder: Builder): binaryen.ExpressionRef {
		const {exprs: [arg0, arg1]} = ASTNodeOperation.coerceOperands(builder, this.operand0, this.operand1);
		const this_bintype: binaryen.Type = this.type().binType();
		return (
			(this.operator === Operator.EXP) ? new Map<binaryen.Type, binaryen.ExpressionRef>([
				[binaryen.i32, builder.module.call('exp', [arg0, arg1], binaryen.i32)],
				[binaryen.f64, builder.module.unreachable()], // TODO: support runtime exponentiation for floats
			]).get(this_bintype)! :
			(this.operator === Operator.DIV) ? new Map<binaryen.Type, binaryen.ExpressionRef>([
				[binaryen.i32, builder.module.i32.div_s (arg0, arg1)],
				[binaryen.f64, builder.module.f64.div   (arg0, arg1)],
			]).get(this_bintype)! :
			builder.module[new Map<binaryen.Type, 'i32' | 'f64'>([
				[binaryen.i32, 'i32'],
				[binaryen.f64, 'f64'],
			]).get(this_bintype)!][new Map<Operator, 'mul' | 'add' | 'sub'>([
				[Operator.MUL, 'mul'],
				[Operator.ADD, 'add'],
				[Operator.SUB, 'sub'],
			]).get(this.operator)!](arg0, arg1)
		);
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

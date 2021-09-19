import type {
	ParseNode,
} from '@chharvey/parser';
import * as assert from 'assert';
import * as xjs from 'extrajs'
import {
	TypeError01,
	NanError01,
	NanError02,
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	SolidObject,
	SolidNumber,
	Int16,
	Float64,
	INST,
	Builder,
	Operator,
	ValidOperatorArithmetic,
	Validator,
} from './package.js';
import {
	bothNumeric,
	eitherFloats,
	bothFloats,
	neitherFloats,
} from './utils-private.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
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
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionBinopArithmetic {
		const tofloat: boolean = to_float || this.shouldFloat(builder.validator);
		return new INST.InstructionBinopArithmetic(
			this.operator,
			this.operand0.build(builder, tofloat),
			this.operand1.build(builder, tofloat),
		)
	}
	protected override type_do_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType {
		if (bothNumeric(t0, t1)) {
			if (int_coercion) {
				return (eitherFloats(t0, t1)) ? Float64 : Int16
			}
			if (bothFloats   (t0, t1)) { return Float64 }
			if (neitherFloats(t0, t1)) { return Int16 }
		}
		throw new TypeError01(this)
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const assess0: SolidObject | null = this.operand0.fold(validator);
		if (!assess0) {
			return assess0
		}
		const assess1: SolidObject | null = this.operand1.fold(validator);
		if (!assess1) {
			return assess1
		}
		if (this.operator === Operator.DIV && assess1 instanceof SolidNumber && assess1.eq0()) {
			throw new NanError02(this.operand1);
		}
		return (assess0 instanceof Int16 && assess1 instanceof Int16)
			? this.foldNumeric(assess0, assess1)
			: this.foldNumeric(
				(assess0 as SolidNumber).toFloat(),
				(assess1 as SolidNumber).toFloat(),
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

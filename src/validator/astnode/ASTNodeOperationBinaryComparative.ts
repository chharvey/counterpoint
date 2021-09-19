import type {
	ParseNode,
} from '@chharvey/parser';
import * as assert from 'assert';
import {
	TypeError01,
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	SolidObject,
	SolidBoolean,
	SolidNumber,
	Int16,
	INST,
	Builder,
	Operator,
	ValidOperatorComparative,
	Validator,
} from './package.js';
import {
	bothNumeric,
	bothFloats,
	neitherFloats,
} from './utils-private.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.js';



export class ASTNodeOperationBinaryComparative extends ASTNodeOperationBinary {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryComparative {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinaryComparative);
		return expression;
	}
	constructor (
		start_node: ParseNode,
		override readonly operator: ValidOperatorComparative,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
		if ([Operator.IS, Operator.ISNT].includes(this.operator)) {
			throw new TypeError(`Operator ${ this.operator } not yet supported.`);
		}
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionBinopComparative {
		const tofloat: boolean = to_float || this.shouldFloat(builder.validator);
		return new INST.InstructionBinopComparative(
			this.operator,
			this.operand0.build(builder, tofloat),
			this.operand1.build(builder, tofloat),
		)
	}
	protected override type_do_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType {
		if (bothNumeric(t0, t1) && (int_coercion || (
			bothFloats(t0, t1) || neitherFloats(t0, t1)
		))) {
			return SolidBoolean
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
		return (assess0 instanceof Int16 && assess1 instanceof Int16)
			? this.foldComparative(assess0, assess1)
			: this.foldComparative(
				(assess0 as SolidNumber).toFloat(),
				(assess1 as SolidNumber).toFloat(),
			);
	}
	private foldComparative<T extends SolidNumber<T>>(x: T, y: T): SolidBoolean {
		return SolidBoolean.fromBoolean(new Map<Operator, (x: T, y: T) => boolean>([
			[Operator.LT, (x, y) => x.lt(y)],
			[Operator.GT, (x, y) => y.lt(x)],
			[Operator.LE, (x, y) => x.equal(y) || x.lt(y)],
			[Operator.GE, (x, y) => x.equal(y) || y.lt(x)],
			// [Operator.NLT, (x, y) => !x.lt(y)],
			// [Operator.NGT, (x, y) => !y.lt(x)],
		]).get(this.operator)!(x, y))
	}
}

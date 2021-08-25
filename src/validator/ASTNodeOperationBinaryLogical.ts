import type {
	ParseNode,
} from '@chharvey/parser';
import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	SolidObject,
	SolidNull,
	SolidBoolean,
	INST,
	Builder,
} from './package.js';
import {
	Operator,
	ValidOperatorLogical,
} from './Operator.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.js';
import type {Validator} from './Validator.js';



export class ASTNodeOperationBinaryLogical extends ASTNodeOperationBinary {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryLogical {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinaryLogical);
		return expression;
	}
	constructor (
		start_node: ParseNode,
		override readonly operator: ValidOperatorLogical,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionBinopLogical {
		const tofloat: boolean = to_float || this.shouldFloat(builder.validator);
		return new INST.InstructionBinopLogical(
			builder.varCount,
			this.operator,
			this.operand0.build(builder, tofloat),
			this.operand1.build(builder, tofloat),
		)
	}
	protected override type_do_do(t0: SolidType, t1: SolidType, _int_coercion: boolean): SolidType {
		const falsytypes: SolidType = SolidType.VOID.union(SolidNull).union(SolidBoolean.FALSETYPE);
		return (this.operator === Operator.AND)
			? (t0.isSubtypeOf(falsytypes))
				? t0
				: t0.intersect(falsytypes).union(t1)
			: (t0.isSubtypeOf(falsytypes))
				? t1
				: (SolidType.VOID.isSubtypeOf(t0) || SolidNull.isSubtypeOf(t0) || SolidBoolean.FALSETYPE.isSubtypeOf(t0))
					? t0.subtract(falsytypes).union(t1)
					: t0
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const assess0: SolidObject | null = this.operand0.assess(validator);
		if (!assess0) {
			return assess0
		}
		if (
			this.operator === Operator.AND && !assess0.isTruthy
			|| this.operator === Operator.OR && assess0.isTruthy
		) {
			return assess0;
		}
		return this.operand1.assess(validator);
	}
}

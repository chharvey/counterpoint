import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	SolidType,
	SolidObject,
	SolidBoolean,
	INST,
	Builder,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	Operator,
	ValidOperatorLogical,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.js';



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

	protected override build_do(builder: Builder): INST.InstructionBinopLogical {
		const [inst0, inst1]: INST.InstructionExpression[] = [this.operand0, this.operand1].map((expr) => expr.build(builder));
		/** A temporary variable id used for optimizing short-circuited operations. */
		const temp_id: bigint = builder.varCount;
		return new INST.InstructionBinopLogical(
			builder.addLocal(temp_id, this.operand0.type().binType())[0].getLocalInfo(temp_id)!.index,
			this.operator,
			inst0,
			inst1,
		)
	}

	protected override build_bin_do(builder: Builder): binaryen.ExpressionRef {
		const [inst0, inst1]: INST.InstructionExpression[] = [this.operand0, this.operand1].map((expr) => expr.build(builder));

		/** A temporary variable id used for optimizing short-circuited operations. */
		const temp_id: bigint = builder.varCount;
		const local           = builder.addLocal(temp_id, this.operand0.type().binType())[0].getLocalInfo(temp_id)!;

		const condition = new INST.InstructionUnop(
			Operator.NOT,
			new INST.InstructionUnop(
				Operator.NOT,
				new INST.InstructionLocalTee(local.index, inst0),
			),
		)
		const left                              = new INST.InstructionLocalGet(local.index, local.type);
		const right: INST.InstructionExpression = inst1;

		return ((this.operator === Operator.AND)
			? new INST.InstructionCond(condition, right, left)
			: new INST.InstructionCond(condition, left, right)).buildBin(builder.module);
	}

	protected override type_do_do(t0: SolidType, t1: SolidType, _int_coercion: boolean): SolidType {
		const falsytypes: SolidType = SolidType.VOID.union(SolidType.NULL).union(SolidBoolean.FALSETYPE);
		return (this.operator === Operator.AND)
			? (t0.isSubtypeOf(falsytypes))
				? t0
				: t0.intersect(falsytypes).union(t1)
			: (t0.isSubtypeOf(falsytypes))
				? t1
				: (SolidType.VOID.isSubtypeOf(t0) || SolidType.NULL.isSubtypeOf(t0) || SolidBoolean.FALSETYPE.isSubtypeOf(t0))
					? t0.subtract(falsytypes).union(t1)
					: t0
	}
	protected override fold_do(): SolidObject | null {
		const v0: SolidObject | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		if (
			   this.operator === Operator.AND && !v0.isTruthy
			|| this.operator === Operator.OR  &&  v0.isTruthy
		) {
			return v0;
		}
		return this.operand1.fold();
	}
}

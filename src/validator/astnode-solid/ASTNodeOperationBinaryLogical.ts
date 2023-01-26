import * as assert from 'assert';
import binaryen from 'binaryen';
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
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionBinopLogical {
		const tofloat: boolean = to_float || this.shouldFloat();
		/** A temporary variable id used for optimizing short-circuited operations. */
		const temp_id: bigint = builder.varCount;
		return new INST.InstructionBinopLogical(
			builder.addLocal(temp_id, tofloat)[0].getLocalInfo(temp_id)!.index,
			this.operator,
			this.operand0.build(builder, tofloat),
			this.operand1.build(builder, tofloat),
		)
	}
	public build__temp(builder: Builder, to_float: boolean = false): binaryen.ExpressionRef {
		const tofloat: boolean = to_float || this.shouldFloat();
		/** A temporary variable id used for optimizing short-circuited operations. */
		const temp_id: bigint = builder.varCount;
		const var_index: number = builder.addLocal(temp_id, tofloat)[0].getLocalInfo(temp_id)!.index;
		const arg0: binaryen.ExpressionRef = this.operand0.build(builder, tofloat).buildBin(builder.module);
		const arg1: binaryen.ExpressionRef = this.operand1.build(builder, tofloat).buildBin(builder.module);
		const arg0_type: binaryen.Type = (!tofloat) ? binaryen.i32 : binaryen.f64;
		const condition: binaryen.ExpressionRef = builder.module.call(
			'inot',
			[builder.module.call(
				(!tofloat) ? 'inot' : 'fnot',
				[builder.module.local.tee(var_index, arg0, arg0_type)],
				binaryen.i32,
			)],
			binaryen.i32,
		);
		const left:  binaryen.ExpressionRef = builder.module.local.get(var_index, arg0_type);
		const right: binaryen.ExpressionRef = arg1;
		return (this.operator === Operator.AND)
			? builder.module.if(condition, right, left)
			: builder.module.if(condition, left,  right);
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

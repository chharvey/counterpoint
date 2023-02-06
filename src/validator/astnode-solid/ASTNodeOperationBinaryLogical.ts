import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	SolidType,
	SolidObject,
	SolidBoolean,
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

	protected override build_do(builder: Builder): binaryen.ExpressionRef {
		const [type0, type1]: binaryen.Type[] =          [this.operand0, this.operand1].map((expr) => expr.type().binType());
		let   [arg0,  arg1]:  binaryen.ExpressionRef[] = [this.operand0, this.operand1].map((expr) => expr.build(builder));

		/** A temporary variable id used for optimizing short-circuited operations. */
		const temp_id: bigint = builder.varCount;
		const local           = builder.addLocal(temp_id, type0)[0].getLocalInfo(temp_id)!;

		const condition = builder.module.call('inot', [builder.module.call(
			(type0 === binaryen.i32) ? 'inot' : 'fnot',
			[builder.module.local.tee(local.index, arg0, type0)],
			binaryen.i32,
		)], binaryen.i32);
		arg0 = builder.module.local.get(local.index, local.type);

		// int-coercion copied from `ASTNodeOperation.coerceOperands`
		if ([type0, type1].includes(binaryen.f64)) {
			if (type0 === binaryen.i32) {
				arg0 = builder.module.f64.convert_u.i32(arg0);
			}
			if (type1 === binaryen.i32) {
				arg1 = builder.module.f64.convert_u.i32(arg1);
			}
		}

		const [if_true, if_false] = (this.operator === Operator.AND) ? [arg1, arg0] : [arg0, arg1];
		return builder.module.if(condition, if_true, if_false);
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

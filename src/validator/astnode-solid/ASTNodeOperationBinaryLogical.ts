import * as assert from 'assert';
import binaryen from 'binaryen';
import {BinEither} from '../../index.js';
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
import {ASTNodeOperationUnary} from './ASTNodeOperationUnary.js';
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
		let   [arg0,  arg1]:  binaryen.ExpressionRef[] = [this.operand0, this.operand1].map((expr) => expr.build(builder));
		const [type0, type1]: binaryen.Type[]          = [arg0, arg1].map((arg) => binaryen.getExpressionType(arg));

		/** A temporary variable id used for optimizing short-circuited operations. */
		const temp_id: bigint = builder.varCount;
		const local           = builder.addLocal(temp_id, type0)[0].getLocalInfo(temp_id)!;

		const condition = ASTNodeOperationUnary.operate(
			builder.module,
			Operator.NOT,
			null,
			ASTNodeOperationUnary.operate(
				builder.module,
				Operator.NOT,
				null,
				builder.module.local.tee(local.index, arg0, local.type),
			),
		);
		arg0 = builder.module.local.get(local.index, local.type);

		if (type0 !== type1) {
			[arg0, arg1] = [
				new BinEither(builder.module, 0n, arg0, arg1).make(),
				new BinEither(builder.module, 1n, arg0, arg1).make(),
			];
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

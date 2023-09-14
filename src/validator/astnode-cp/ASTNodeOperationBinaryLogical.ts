import binaryen from 'binaryen';
import {BinEither} from '../../index.js';
import {
	OBJ,
	TYPE,
	type Builder,
} from '../../index.js';
import {
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
	type ValidOperatorLogical,
} from '../Operator.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperationUnary} from './ASTNodeOperationUnary.js';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.js';



export class ASTNodeOperationBinaryLogical extends ASTNodeOperationBinary {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryLogical {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeOperationBinaryLogical);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected override readonly operator: ValidOperatorLogical,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
	}

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): binaryen.ExpressionRef {
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

	protected override type_do(t0: TYPE.Type, t1: TYPE.Type, _int_coercion: boolean): TYPE.Type {
		const falsytypes: TYPE.Type = TYPE.VOID.union(TYPE.NULL).union(OBJ.Boolean.FALSETYPE);
		return (this.operator === Operator.AND)
			? (t0.isSubtypeOf(falsytypes))
				? t0
				: t0.intersect(falsytypes).union(t1)
			: (t0.isSubtypeOf(falsytypes))
				? t1
				: (TYPE.VOID.isSubtypeOf(t0) || TYPE.NULL.isSubtypeOf(t0) || OBJ.Boolean.FALSETYPE.isSubtypeOf(t0))
					? t0.subtract(falsytypes).union(t1)
					: t0;
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const v0: OBJ.Object | null = this.operand0.fold();
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

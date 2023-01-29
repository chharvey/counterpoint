import * as assert from 'assert';
import {
	TYPE,
	OBJ,
	INST,
	Builder,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeSupertype,
	Operator,
	ValidOperatorLogical,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.js';



export class ASTNodeOperationBinaryLogical extends ASTNodeOperationBinary {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryLogical {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinaryLogical);
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

	protected override build_do(builder: Builder): INST.InstructionBinopLogical {
		const [inst0, inst1]: [INST.InstructionExpression, INST.InstructionExpression] = this.buildOps(builder);
		/** A temporary variable id used for optimizing short-circuited operations. */
		const temp_id: bigint = builder.varCount;
		return new INST.InstructionBinopLogical(
			builder.addLocal(temp_id, inst0.binType)[0].getLocalInfo(temp_id)!.index,
			this.operator,
			inst0,
			inst1,
		);
	}

	protected override type_do_do(t0: TYPE.Type, t1: TYPE.Type, _int_coercion: boolean): TYPE.Type {
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

	protected override fold_do(): OBJ.Object | null {
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

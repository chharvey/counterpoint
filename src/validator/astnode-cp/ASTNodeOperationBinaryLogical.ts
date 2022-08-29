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
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryLogical {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinaryLogical);
		return expression;
	}

	constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		override readonly operator: ValidOperatorLogical,
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
	}

	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionBinopLogical {
		const tofloat: boolean = to_float || this.shouldFloat();
		return new INST.InstructionBinopLogical(
			builder.varCount,
			this.operator,
			this.operand0.build(builder, tofloat),
			this.operand1.build(builder, tofloat),
		);
	}

	protected override type_do_do(t0: TYPE.Type, t1: TYPE.Type, _int_coercion: boolean): TYPE.Type {
		const falsytypes: TYPE.Type = TYPE.Type.VOID.union(TYPE.Type.NULL).union(OBJ.Boolean.FALSETYPE);
		return (this.operator === Operator.AND)
			? (t0.isSubtypeOf(falsytypes))
				? t0
				: t0.intersect(falsytypes).union(t1)
			: (t0.isSubtypeOf(falsytypes))
				? t1
				: (TYPE.Type.VOID.isSubtypeOf(t0) || TYPE.Type.NULL.isSubtypeOf(t0) || OBJ.Boolean.FALSETYPE.isSubtypeOf(t0))
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

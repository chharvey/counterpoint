import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	SolidType,
	SolidTypeUnit,
	SolidObject,
	SolidBoolean,
	INST,
	Builder,
	TypeError01,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	Operator,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';



export class ASTNodeOperationTernary extends ASTNodeOperation {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationTernary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationTernary);
		return expression;
	}
	constructor(
		start_node: ParseNode,
		readonly operator: Operator.COND,
		readonly operand0: ASTNodeExpression,
		readonly operand1: ASTNodeExpression,
		readonly operand2: ASTNodeExpression,
	) {
		super(start_node, operator, [operand0, operand1, operand2]);
	}

	protected override build_do(builder: Builder): INST.InstructionCond {
		return new INST.InstructionCond(
			this.operand0.build(builder),
			this.operand1.build(builder),
			this.operand2.build(builder),
		);
	}

	protected override build_bin_do(builder: Builder): binaryen.ExpressionRef {
		return builder.module.if(
			this.operand0.build(builder).buildBin(builder.module),
			...ASTNodeOperation.coerceOperands(builder, this.operand1, this.operand2).exprs,
		);
	}

	protected override type_do(): SolidType {
		const t0: SolidType = this.operand0.type();
		const t1: SolidType = this.operand1.type();
		const t2: SolidType = this.operand2.type();
		return (t0.isSubtypeOf(SolidType.BOOL))
			? (t0 instanceof SolidTypeUnit)
				? (t0.value === SolidBoolean.FALSE)
					? t2 // If `a` is of type `false`, then `typeof (if a then b else c)` is `typeof c`.
					: t1 // If `a` is of type `true`,  then `typeof (if a then b else c)` is `typeof b`.
				: t1.union(t2)
			: (() => { throw new TypeError01(this) })()
	}
	protected override fold_do(): SolidObject | null {
		const v0: SolidObject | null = this.operand0.fold();
		if (!v0) {
			return v0;
		}
		return (v0 === SolidBoolean.TRUE)
			? this.operand1.fold()
			: this.operand2.fold();
	}
}

import * as assert from 'assert';
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
	override shouldFloat(): boolean {
		return this.operand1.shouldFloat() || this.operand2.shouldFloat();
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionCond {
		const tofloat: boolean = to_float || this.shouldFloat();
		return new INST.InstructionCond(
			this.operand0.build(builder, false),
			this.operand1.build(builder, tofloat),
			this.operand2.build(builder, tofloat),
		)
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

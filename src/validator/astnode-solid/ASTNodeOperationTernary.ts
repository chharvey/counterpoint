import * as assert from 'assert';
import binaryen from 'binaryen';
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
import {
	ASTNodeExpression,
	BuildType,
} from './ASTNodeExpression.js';
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

	protected override build_do(builder: Builder): INST.InstructionCond {
		let [inst0, inst1, inst2]: INST.InstructionExpression[] = [this.operand0, this.operand1, this.operand2].map((expr) => expr.build(builder));
		if (this.shouldFloat()) {
			if (!this.operand1.shouldFloat()) {
				inst1 = new INST.InstructionConvert(inst1);
			}
			if (!this.operand2.shouldFloat()) {
				inst2 = new INST.InstructionConvert(inst2);
			}
		}
		return new INST.InstructionCond(inst0, inst1, inst2);
	}
	public build__temp(builder: Builder): BuildType {
		let [inst0, inst1, inst2]: INST.InstructionExpression[] = [this.operand0, this.operand1, this.operand2].map((expr) => expr.build(builder));
		let resulttype = binaryen.i32;
		if (this.shouldFloat()) {
			resulttype = binaryen.f64;
			if (!this.operand1.shouldFloat()) {
				inst1 = new INST.InstructionConvert(inst1);
			}
			if (!this.operand2.shouldFloat()) {
				inst2 = new INST.InstructionConvert(inst2);
			}
		}
		return {
			bin: builder.module.if(
				inst0.buildBin(builder.module),
				inst1.buildBin(builder.module),
				inst2.buildBin(builder.module),
			),
			type: resulttype,
		};
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

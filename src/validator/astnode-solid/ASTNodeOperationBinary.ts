import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	SolidType,
	INST,
	Builder,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	ValidOperatorBinary,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';



/**
 * Known subclasses:
 * - ASNodeOperationBinaryArithmetic
 * - ASNodeOperationBinaryComparative
 * - ASNodeOperationBinaryEquality
 * - ASNodeOperationBinaryLogical
 */
export abstract class ASTNodeOperationBinary extends ASTNodeOperation {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationBinary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinary);
		return expression;
	}
	constructor(
		start_node: ParseNode,
		readonly operator: ValidOperatorBinary,
		readonly operand0: ASTNodeExpression,
		readonly operand1: ASTNodeExpression,
	) {
		super(start_node, operator, [operand0, operand1]);
	}
	override shouldFloat(): boolean {
		return this.operand0.shouldFloat() || this.operand1.shouldFloat();
	}
	/**
	 * @final
	 */
	protected override type_do(): SolidType {
		return this.type_do_do(
			this.operand0.type(),
			this.operand1.type(),
			this.validator.config.compilerOptions.intCoercion,
		)
	}
	protected abstract type_do_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType;

	/** @final */
	protected buildOps(builder: Builder): [INST.InstructionExpression, INST.InstructionExpression] {
		let [inst0, inst1]: INST.InstructionExpression[] = [this.operand0, this.operand1].map((expr) => expr.build(builder));
		if (this.shouldFloat()) {
			if (inst0.binType === binaryen.i32) {
				inst0 = new INST.InstructionConvert(inst0);
			}
			if (inst1.binType === binaryen.i32) {
				inst1 = new INST.InstructionConvert(inst1);
			}
		}
		return [inst0, inst1];
	}
}

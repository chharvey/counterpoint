import * as assert from 'assert';
import {
	TYPE,
	INST,
	Builder,
	memoizeMethod,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeSupertype,
	ValidOperatorBinary,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';



/**
 * Known subclasses:
 * - ASTNodeOperationBinaryArithmetic
 * - ASTNodeOperationBinaryComparative
 * - ASTNodeOperationBinaryEquality
 * - ASTNodeOperationBinaryLogical
 */
export abstract class ASTNodeOperationBinary extends ASTNodeOperation {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperationBinary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinary);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		protected readonly operator: ValidOperatorBinary,
		public    readonly operand0: ASTNodeExpression,
		public    readonly operand1: ASTNodeExpression,
	) {
		super(start_node, operator, [operand0, operand1]);
	}

	public override shouldFloat(): boolean {
		return this.operand0.shouldFloat() || this.operand1.shouldFloat();
	}

	/**
	 * @final
	 */
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		return this.type_do(
			this.operand0.type(),
			this.operand1.type(),
			this.validator.config.compilerOptions.intCoercion,
		);
	}

	protected abstract type_do(t0: TYPE.Type, t1: TYPE.Type, int_coercion: boolean): TYPE.Type;

	/** @final */
	protected buildOps(builder: Builder): [INST.InstructionExpression, INST.InstructionExpression] {
		let [inst0, inst1]: INST.InstructionExpression[] = [this.operand0, this.operand1].map((expr) => expr.build(builder));
		if (this.shouldFloat()) {
			if (!this.operand0.shouldFloat()) {
				inst0 = new INST.InstructionConvert(inst0);
			}
			if (!this.operand1.shouldFloat()) {
				inst1 = new INST.InstructionConvert(inst1);
			}
		}
		return [inst0, inst1];
	}
}

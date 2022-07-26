import * as assert from 'assert';
import {
	SolidType,
	memoizeMethod,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	ValidOperatorBinary,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';



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
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	override type(): SolidType {
		return this.type_do(
			this.operand0.type(),
			this.operand1.type(),
			this.validator.config.compilerOptions.intCoercion,
		)
	}
	protected abstract type_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType;
}

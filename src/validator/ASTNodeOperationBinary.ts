import type {ParseNode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
} from '../core/index.js';
import type {SolidType} from '../typer/index.js';
import type {ValidOperatorBinary} from './Operator.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';
import type {Validator} from './Validator.js';



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
	override shouldFloat(validator: Validator): boolean {
		return this.operand0.shouldFloat(validator) || this.operand1.shouldFloat(validator);
	}
	/**
	 * @final
	 */
	protected override type_do(validator: Validator): SolidType {
		return this.type_do_do(
			this.operand0.type(validator),
			this.operand1.type(validator),
			validator.config.compilerOptions.intCoercion,
		)
	}
	protected abstract type_do_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType;
}

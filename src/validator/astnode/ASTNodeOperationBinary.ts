import type {ParseNode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	memoizeMethod,
} from '../../decorators.js';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	ValidOperatorBinary,
	Validator,
} from './package.js';
import {forEachAggregated} from './utils-private.js';
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
	override shouldFloat(validator: Validator): boolean {
		return this.operand0.shouldFloat(validator) || this.operand1.shouldFloat(validator);
	}
	/**
	 * @final
	 */
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	override type(validator: Validator): SolidType {
		forEachAggregated([this.operand0, this.operand1], (c) => c.typeCheck(validator));
		return this.type_do(
			this.operand0.type(validator),
			this.operand1.type(validator),
			validator.config.compilerOptions.intCoercion,
		)
	}
	protected abstract type_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType;
}

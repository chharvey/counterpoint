import type {ParseNode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	memoizeMethod,
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	Validator,
	Operator,
	ValidTypeOperator,
} from './package.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeTypeOperation} from './ASTNodeTypeOperation.js';



export class ASTNodeTypeOperationBinary extends ASTNodeTypeOperation {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeOperationBinary {
		const typ: ASTNodeTypeOperation = ASTNodeTypeOperation.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeOperationBinary);
		return typ;
	}
	constructor (
		start_node: ParseNode,
		operator: ValidTypeOperator,
		readonly operand0: ASTNodeType,
		readonly operand1: ASTNodeType,
	) {
		super(start_node, operator, [operand0, operand1]);
	}
	@memoizeMethod
	override assess(validator: Validator): SolidType {
		return (
			(this.operator === Operator.AND) ? this.operand0.assess(validator).intersect(this.operand1.assess(validator)) :
			(this.operator === Operator.OR)  ? this.operand0.assess(validator).union    (this.operand1.assess(validator)) :
			(() => { throw new Error(`Operator ${ Operator[this.operator] } not found.`) })()
		)
	}
}

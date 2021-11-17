import * as assert from 'assert';
import {
	SolidType,
	memoizeMethod,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
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
	override eval(validator: Validator): SolidType {
		return (
			(this.operator === Operator.AND) ? this.operand0.eval(validator).intersect(this.operand1.eval(validator)) :
			(this.operator === Operator.OR)  ? this.operand0.eval(validator).union    (this.operand1.eval(validator)) :
			(() => { throw new Error(`Operator ${ Operator[this.operator] } not found.`) })()
		)
	}
}

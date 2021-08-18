import type {ParseNode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
} from '../core/index.js';
import type {SolidType} from '../typer/index.js';
import {
	Operator,
	ValidTypeOperator,
} from './Operator.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeTypeOperation} from './ASTNodeTypeOperation.js';
import type {Validator} from './Validator.js';



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
	protected override assess_do(validator: Validator): SolidType {
		return (
			(this.operator === Operator.AND) ? this.operand0.assess(validator).intersect(this.operand1.assess(validator)) :
			(this.operator === Operator.OR)  ? this.operand0.assess(validator).union    (this.operand1.assess(validator)) :
			(() => { throw new Error(`Operator ${ Operator[this.operator] } not found.`) })()
		)
	}
}

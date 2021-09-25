import type {ParseNode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	SolidNull,
	Operator,
	ValidTypeOperator,
	Validator,
} from './package.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeTypeOperation} from './ASTNodeTypeOperation.js';



export class ASTNodeTypeOperationUnary extends ASTNodeTypeOperation {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeOperationUnary {
		const typ: ASTNodeTypeOperation = ASTNodeTypeOperation.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeOperationUnary);
		return typ;
	}
	constructor (
		start_node: ParseNode,
		operator: ValidTypeOperator,
		readonly operand: ASTNodeType,
	) {
		super(start_node, operator, [operand]);
		if ([Operator.OREXCP].includes(this.operator)) {
			throw new TypeError(`Operator ${ this.operator } not yet supported.`);
		}
	}
	protected override eval_do(validator: Validator): SolidType {
		return (this.operator === Operator.ORNULL)
			? this.operand.eval(validator).union(SolidNull)
			: (() => { throw new Error(`Operator ${ Operator[this.operator] } not found.`) })()
	}
}

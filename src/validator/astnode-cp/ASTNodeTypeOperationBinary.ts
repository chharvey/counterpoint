import * as assert from 'assert';
import {
	TYPE,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
	Operator,
	ValidTypeOperator,
} from './package.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeTypeOperation} from './ASTNodeTypeOperation.js';



export class ASTNodeTypeOperationBinary extends ASTNodeTypeOperation {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeOperationBinary {
		const typ: ASTNodeTypeOperation = ASTNodeTypeOperation.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeOperationBinary);
		return typ;
	}
	constructor (
		start_node:
			| SyntaxNodeType<'type_intersection'>
			| SyntaxNodeType<'type_union'>
		,
		operator: ValidTypeOperator,
		readonly operand0: ASTNodeType,
		readonly operand1: ASTNodeType,
	) {
		super(start_node, operator, [operand0, operand1]);
	}
	protected override eval_do(): TYPE.Type {
		return (
			(this.operator === Operator.AND) ? this.operand0.eval().intersect(this.operand1.eval()) :
			(this.operator === Operator.OR)  ? this.operand0.eval().union    (this.operand1.eval()) :
			(() => { throw new Error(`Operator ${ Operator[this.operator] } not found.`) })()
		)
	}
}

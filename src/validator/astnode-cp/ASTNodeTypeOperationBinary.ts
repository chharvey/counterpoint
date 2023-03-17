import * as assert from 'assert';
import type {TYPE} from '../../index.js';
import {
	throw_expression,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {
	Operator,
	type ValidTypeOperator,
} from '../Operator.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeTypeOperation} from './ASTNodeTypeOperation.js';



export class ASTNodeTypeOperationBinary extends ASTNodeTypeOperation {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeOperationBinary {
		const typ: ASTNodeTypeOperation = ASTNodeTypeOperation.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeOperationBinary);
		return typ;
	}

	public constructor(
		start_node:
			| SyntaxNodeType<'type_intersection'>
			| SyntaxNodeType<'type_union'>
		,
		operator: ValidTypeOperator,
		private readonly operand0: ASTNodeType,
		private readonly operand1: ASTNodeType,
	) {
		super(start_node, operator, [operand0, operand1]);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		return (
			(this.operator === Operator.AND) ? this.operand0.eval().intersect(this.operand1.eval()) :
			(this.operator === Operator.OR)  ? this.operand0.eval().union    (this.operand1.eval()) :
			throw_expression(new Error(`Operator ${ Operator[this.operator] } not found.`))
		);
	}
}

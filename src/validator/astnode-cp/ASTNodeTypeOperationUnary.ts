import * as assert from 'assert';
import {
	TYPE,
	throw_expression,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
	Operator,
	ValidTypeOperator,
} from './package.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeTypeOperation} from './ASTNodeTypeOperation.js';



export class ASTNodeTypeOperationUnary extends ASTNodeTypeOperation {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeOperationUnary {
		const typ: ASTNodeTypeOperation = ASTNodeTypeOperation.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeOperationUnary);
		return typ;
	}

	public constructor(
		start_node:
			| SyntaxNodeType<'type_unary_symbol'>
			| SyntaxNodeType<'type_unary_keyword'>
		,
		operator: ValidTypeOperator,
		private readonly operand: ASTNodeType,
	) {
		super(start_node, operator, [operand]);
		if ([Operator.OREXCP].includes(this.operator)) {
			throw new TypeError(`Operator ${ this.operator } not yet supported.`);
		}
	}

	protected override eval_do(): TYPE.Type {
		return (
			(this.operator === Operator.ORNULL)  ? this.operand.eval().union(TYPE.NULL) :
			(this.operator === Operator.MUTABLE) ? this.operand.eval().mutableOf() :
			throw_expression(new Error(`Operator ${ Operator[this.operator] } not found.`))
		);
	}
}
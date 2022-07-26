import * as assert from 'assert';
import {
	SolidType,
	memoizeMethod,
	SolidConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
	Operator,
	ValidTypeOperator,
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
		start_node:
			| SyntaxNodeType<'type_unary_symbol'>
			| SyntaxNodeType<'type_unary_keyword'>
		,
		operator: ValidTypeOperator,
		readonly operand: ASTNodeType,
	) {
		super(start_node, operator, [operand]);
		if ([Operator.OREXCP].includes(this.operator)) {
			throw new TypeError(`Operator ${ this.operator } not yet supported.`);
		}
	}
	@memoizeMethod
	override eval(): SolidType {
		return (
			(this.operator === Operator.ORNULL)  ? this.operand.eval().union(SolidType.NULL) :
			(this.operator === Operator.MUTABLE) ? this.operand.eval().mutableOf() :
			(() => { throw new Error(`Operator ${ Operator[this.operator] } not found.`); })()
		);
	}
}

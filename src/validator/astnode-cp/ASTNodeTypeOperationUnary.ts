import * as assert from 'assert';
import {
	TYPE,
	TypeErrorInvalidOperation,
} from '../../index.js';
import {
	throw_expression,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeFamily} from '../utils-private.js';
import {
	Operator,
	type ValidTypeOperator,
} from '../Operator.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeTypeCollectionLiteral} from './ASTNodeTypeCollectionLiteral.js';
import {ASTNodeTypeOperation} from './ASTNodeTypeOperation.js';



export class ASTNodeTypeOperationUnary extends ASTNodeTypeOperation {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeOperationUnary {
		const typ: ASTNodeTypeOperation = ASTNodeTypeOperation.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeOperationUnary);
		return typ;
	}

	public constructor(
		start_node:
			| SyntaxNodeFamily<'type_unary_symbol',  ['variable']>
			| SyntaxNodeFamily<'type_unary_keyword', ['variable']>
		,
		operator: ValidTypeOperator,
		private readonly operand: ASTNodeType,
	) {
		super(start_node, operator, [operand]);
		if ([Operator.OREXCP].includes(this.operator)) {
			throw new TypeError(`Operator ${ this.operator } not yet supported.`);
		}
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		return (
			(this.operator === Operator.ORNULL)  ? this.operand.eval().union(TYPE.NULL) :
			(this.operator === Operator.MUTABLE) ? ((this.operand instanceof ASTNodeTypeCollectionLiteral && !this.operand.isRef)
				? throw_expression(new TypeErrorInvalidOperation(this))
				: this.operand.eval().mutableOf()
			) :
			throw_expression(new Error(`Operator ${ Operator[this.operator] } not found.`))
		);
	}
}

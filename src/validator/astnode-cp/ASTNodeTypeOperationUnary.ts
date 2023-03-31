import {
	TYPE,
	TypeErrorInvalidOperation,
} from '../../index.js';
import {
	throw_expression,
	assert_instanceof,
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
import {ASTNodeTypeOperation} from './ASTNodeTypeOperation.js';



export class ASTNodeTypeOperationUnary extends ASTNodeTypeOperation {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeOperationUnary {
		const typ: ASTNodeTypeOperation = ASTNodeTypeOperation.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeOperationUnary);
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
		const t: TYPE.Type = this.operand.eval();
		if (this.operator === Operator.MUTABLE && !t.isReference) {
			throw new TypeErrorInvalidOperation(this);
		}
		return (
			(this.operator === Operator.ORNULL)  ? t.union(TYPE.NULL) :
			(this.operator === Operator.MUTABLE) ? t.mutableOf()      :
			throw_expression(new Error(`Operator ${ Operator[this.operator] } not found.`))
		);
	}
}

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
import type {SyntaxNodeFamily} from '../utils-private.js';
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
			| SyntaxNodeFamily<'type_intersection', ['variable']>
			| SyntaxNodeFamily<'type_union',        ['variable']>
		,
		operator: ValidTypeOperator,
		private readonly operand0: ASTNodeType,
		private readonly operand1: ASTNodeType,
	) {
		super(start_node, operator, [operand0, operand1]);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		const t0: TYPE.Type = this.operand0.eval();
		const t1: TYPE.Type = this.operand1.eval();
		return (
			(this.operator === Operator.AND) ? t0.intersect(t1) :
			(this.operator === Operator.OR)  ? t0.union    (t1) :
			throw_expression(new Error(`Operator ${ Operator[this.operator] } not found.`))
		);
	}
}

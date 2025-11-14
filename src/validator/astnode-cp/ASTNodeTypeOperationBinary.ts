import * as assert from 'node:assert';
import type {TYPE} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {
	Operator,
	type ValidTypeOperator,
} from '../Operator.ts';
import type {ASTNodeType} from './ASTNodeType.ts';
import {ASTNodeTypeOperation} from './ASTNodeTypeOperation.ts';



export class ASTNodeTypeOperationBinary extends ASTNodeTypeOperation {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeOperationBinary {
		const typ: ASTNodeTypeOperation = ASTNodeTypeOperation.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeOperationBinary);
		return typ;
	}

	public constructor(
		start_node:
			| SyntaxNodeType<'type_intersection'>
			| SyntaxNodeType<'type_union'>,

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
			assert.fail(`ASTNodeTypeOperationBinary#eval did not expect the operator \`${ Operator[this.operator] }\`.`)
		);
	}
}

import {
	type NonemptyArray,
	assert_instanceof,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeSupertype} from '../../utils-private.ts';
import type {Operator} from '../../Operator.ts';
import {Expression} from './Expression.ts';



/**
 * Known subclasses:
 * - OperationUnary
 * - OperationBinary
 * - OperationTernary
 */
export abstract class Operation extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Operation {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Operation);
		return expression;
	}


	public override readonly tagname: string = 'Operation'; // TODO remove after refactoring tests using `#serialize`
	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		operator: Operator,
		public override readonly children: Readonly<NonemptyArray<Expression>>,
	) {
		super(start_node, {operator}, children);
	}
}

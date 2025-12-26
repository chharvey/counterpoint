import {
	type NonemptyArray,
	assert_instanceof,
} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeSupertype} from '../utils-private.ts';
import type {Operator} from '../Operator.ts';
import {ASTNodeExpression} from './ASTNodeExpression.ts';



/**
 * Known subclasses:
 * - ASTNodeOperationUnary
 * - ASTNodeOperationBinary
 * - ASTNodeOperationTernary
 */
export abstract class ASTNodeOperation extends ASTNodeExpression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ASTNodeOperation {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeOperation);
		return expression;
	}


	public override readonly tagname: string = 'Operation'; // TODO remove after refactoring tests using `#serialize`
	public constructor(
		start_node: SyntaxNodeSupertype<'expression'>,
		operator: Operator,
		public override readonly children: Readonly<NonemptyArray<ASTNodeExpression>>,
	) {
		super(start_node, {operator}, children);
	}
}

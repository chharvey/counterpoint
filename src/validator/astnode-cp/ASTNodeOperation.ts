import * as assert from 'assert';
import {
	NonemptyArray,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeSupertype,
	Operator,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



/**
 * Known subclasses:
 * - ASTNodeOperationUnary
 * - ASTNodeOperationBinary
 * - ASTNodeOperationTernary
 */
export abstract class ASTNodeOperation extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeOperation {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperation);
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

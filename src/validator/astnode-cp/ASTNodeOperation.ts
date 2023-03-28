import * as assert from 'assert';
import type {NonemptyArray} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeSupertype} from '../utils-private.js';
import type {Operator} from '../Operator.js';
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

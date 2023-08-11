import type binaryen from 'binaryen';
import type {Builder} from '../../index.js';
import {memoizeMethod} from '../../lib/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import type {ASTNodeCP} from './ASTNodeCP.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



/**
 * Known subclasses:
 * - ASTNodeTuple
 * - ASTNodeRecord
 * - ASTNodeCollectionLiteralMutable
 */
export abstract class ASTNodeCollectionLiteral extends ASTNodeExpression {
	protected constructor(
		start_node:
			| SyntaxNodeType<'tuple_literal'>
			| SyntaxNodeType<'record_literal'>
			| SyntaxNodeType<'set_literal'>
			| SyntaxNodeType<'map_literal'>
		,
		public override readonly children: readonly ASTNodeCP[],
		/** Does this node represent a reference object (versus a value object)? */
	) {
		super(start_node, {}, children);
	}

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): binaryen.ExpressionRef {
		builder;
		throw '`ASTNodeCollectionLiteral#build_do` not yet supported.';
	}
}

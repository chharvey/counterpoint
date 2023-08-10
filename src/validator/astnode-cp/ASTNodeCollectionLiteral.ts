import type {
	SyntaxNodeType,
	SyntaxNodeFamily,
} from '../utils-private.js';
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
			| SyntaxNodeFamily<'tuple_literal',  ['variable']>
			| SyntaxNodeFamily<'record_literal', ['variable']>
			| SyntaxNodeType<'set_literal'>
			| SyntaxNodeType<'map_literal'>
		,
		public override readonly children: readonly ASTNodeCP[],
		/** Does this node represent a reference object (versus a value object)? */
	) {
		super(start_node, {}, children);
	}

	public override shouldFloat(): boolean {
		throw 'ASTNodeCollectionLiteral#shouldFloat not yet supported.';
	}
}

import type {
	SyntaxNodeType,
} from './package.js';
import type {ASTNodeSolid} from './ASTNodeSolid.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



/**
 * Known subclasses:
 * - ASTNodeTuple
 * - ASTNodeRecord
 * - ASTNodeSet
 * - ASTNodeMap
 */
export abstract class ASTNodeCollectionLiteral extends ASTNodeExpression {
	constructor (
		start_node:
			| SyntaxNodeType<'tuple_literal'>
			| SyntaxNodeType<'record_literal'>
			| SyntaxNodeType<'set_literal'>
			| SyntaxNodeType<'map_literal'>
		,
		override readonly children: readonly ASTNodeSolid[],
	) {
		super(start_node, {}, children);
	}
	override shouldFloat(): boolean {
		throw 'ASTNodeCollectionLiteral#shouldFloat not yet supported.';
	}
}

import {ASTNodeExpression} from './ASTNodeExpression.js';



/**
 * Known subclasses:
 * - ASTNodeTuple
 * - ASTNodeRecord
 * - ASTNodeSet
 * - ASTNodeMap
 */
export abstract class ASTNodeCollectionLiteral extends ASTNodeExpression {
	override shouldFloat(): boolean {
		throw 'ASTNodeCollectionLiteral#shouldFloat not yet supported.';
	}
}

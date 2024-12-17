import type {
	TYPE,
	TypeErrorNotAssignable,
} from '../../index.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



/**
 * Known subclasses:
 * - ASTNodeSet
 * - ASTNodeMap
 */
export abstract class ASTNodeCollectionLiteralMutable extends ASTNodeCollectionLiteral {
	/**
	 * Determine whether this node may be assigned to the given type.
	 * Note that it’s not sufficient to check whether this node’s `.type()` is a subtype of the assignee:
	 * When we assign mutable collection literals, we want to check entry by entry.
	 * @param  assignee                 the type to assign to
	 * @param  err                      the original error, to be thrown if any further assignment fails
	 * @throws {TypeErrorNotAssignable} if this node is not assignable to the assignee
	 */
	public abstract assignTo(assignee: TYPE.Type, err: TypeErrorNotAssignable): void;
}

import type binaryen from 'binaryen';
import type {TYPE} from '../../index.js';
import {memoizeMethod} from '../../lib/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {buildDeco} from './decorators.js';
import type {ASTNodeCP} from './ASTNodeCP.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



/**
 * Known subclasses:
 * - ASTNodeTuple
 * - ASTNodeRecord
 * - ASTNodeSet
 * - ASTNodeMap
 */
export abstract class ASTNodeCollectionLiteral extends ASTNodeExpression {
	protected constructor(
		start_node:
			| SyntaxNodeType<'tuple_literal'>
			| SyntaxNodeType<'record_literal'>
			| SyntaxNodeType<'set_literal'>
			| SyntaxNodeType<'map_literal'>
		,
		children: readonly ASTNodeCP[],
	) {
		super(start_node, {}, children);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		throw '`ASTNodeCollectionLiteral#build_do` not yet supported.';
	}

	/**
	 * Determine whether this node may be assigned to the given type.
	 * Note that it’s not sufficient to check whether this node’s `.type()` is a subtype of the assignee:
	 * When we assign collection literals, we want to check entry by entry if typechecking fails.
	 * @param  assignee                 the type to assign to
	 * @throws {TypeErrorNotAssignable} if this node is not assignable to the assignee
	 */
	public abstract assignTo(assignee: TYPE.Type): void;
}

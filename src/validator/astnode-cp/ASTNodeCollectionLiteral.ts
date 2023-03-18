import {TYPE} from '../../index.js';
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
 * - ASTNodeSet
 * - ASTNodeMap
 */
export abstract class ASTNodeCollectionLiteral extends ASTNodeExpression {
	/**
	 * Decorator for {@link ASTNodeCollectionLiteral#assignTo} method and any overrides.
	 * Simplifies assignments by handling type operations.
	 * @implements MethodDecorator<ASTNodeCollectionLiteral, (this: ASTNodeCollectionLiteral, assignee: TYPE.Type) => boolean>
	 */
	protected static assignToDeco(
		method:   (this: ASTNodeCollectionLiteral, assignee: TYPE.Type) => boolean,
		_context: ClassMethodDecoratorContext<ASTNodeCollectionLiteral, typeof method>,
	): typeof method {
		return function (assignee: TYPE.Type) {
			if (assignee instanceof TYPE.TypeIntersection) {
				/* A value is assignable to a type intersection if and only if
					it is assignable to both operands of that intersection. */
				return this.assignTo(assignee.left) && this.assignTo(assignee.right);
			} else if (assignee instanceof TYPE.TypeUnion) {
				/* A value is assignable to a type union if and only if
					it is assignable to either operand of that union. */
				return this.assignTo(assignee.left) || this.assignTo(assignee.right);
			} else {
				return method.call(this, assignee);
			}
		};
	}


	protected constructor(
		start_node:
			| SyntaxNodeFamily<'tuple_literal',  ['variable']>
			| SyntaxNodeFamily<'record_literal', ['variable']>
			| SyntaxNodeType<'set_literal'>
			| SyntaxNodeType<'map_literal'>
		,
		public override readonly children: readonly ASTNodeCP[],
		/** Does this node represent a reference object (versus a value object)? */
		public readonly isRef: boolean = true,
	) {
		super(start_node, {isRef}, children);
	}

	public override shouldFloat(): boolean {
		throw 'ASTNodeCollectionLiteral#shouldFloat not yet supported.';
	}

	/**
	 * Determine whether this node may be assigned to the given type.
	 * Note that it’s not sufficient to check whether this node’s `.type()` is a subtype of the assignee:
	 * When we assign collection literals, we want to check entry by entry.
	 * @param  assignee the type to assign to
	 * @return          Is this node assignable to the assignee?
	 */
	public abstract assignTo(assignee: TYPE.Type): boolean;
}

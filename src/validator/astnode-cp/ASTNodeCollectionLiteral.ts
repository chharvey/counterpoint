import {
	TYPE,
	INST,
	Builder,
	SyntaxNodeType,
} from './package.js';
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
	public constructor(
		start_node:
			| SyntaxNodeType<'tuple_literal'>
			| SyntaxNodeType<'record_literal'>
			| SyntaxNodeType<'set_literal'>
			| SyntaxNodeType<'map_literal'>
		,
		public override readonly children: readonly ASTNodeCP[],
	) {
		super(start_node, {}, children);
	}

	protected override build_do(builder: Builder): INST.InstructionExpression {
		builder;
		throw '`ASTNodeCollectionLiteral#build_do` not yet supported.';
	}

	/**
	 * Determine whether this node may be assigned to the given type.
	 * Note that it’s not sufficient to check whether this node’s `.type()` is a subtype of the assignee:
	 * When we assign collection literals, we want to check entry by entry.
	 * @param  assignee the type to assign to
	 * @return          Is this node assignable to the assignee?
	 * @final
	 */
	public assignTo(assignee: TYPE.Type): boolean {
		if (assignee instanceof TYPE.TypeIntersection || assignee instanceof TYPE.TypeUnion) {
			assignee = assignee.combineTuplesOrRecords();
		}
		if (assignee instanceof TYPE.TypeIntersection) {
			/* A value is assignable to a type intersection if and only if
				it is assignable to both operands of that intersection. */
			return this.assignTo(assignee.left) && this.assignTo(assignee.right);
		} else if (assignee instanceof TYPE.TypeUnion) {
			/* A value is assignable to a type union if and only if
				it is assignable to either operand of that union. */
			return this.assignTo(assignee.left) || this.assignTo(assignee.right);
		} else {
			return this.assignTo_do(assignee);
		}
	}
	protected abstract assignTo_do(assignee: TYPE.Type): boolean; // TODO: use decorators
}

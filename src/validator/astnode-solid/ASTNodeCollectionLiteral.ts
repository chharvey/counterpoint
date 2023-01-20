import {
	SolidType,
	SolidTypeIntersection,
	SolidTypeUnion,
	INST,
	Builder,
} from './package.js';
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

	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && '`ASTNodeCollectionLiteral#build_do` not yet supported.';
	}

	/**
	 * Determine whether this node may be assigned to the given type.
	 * Note that it’s not sufficient to check whether this node’s `.type()` is a subtype of the assignee:
	 * When we assign collection literals, we want to check entry by entry.
	 * @param  assignee the type to assign to
	 * @return          Is this node assignable to the assignee?
	 * @final
	 */
	assignTo(assignee: SolidType): boolean {
		if (assignee instanceof SolidTypeIntersection || assignee instanceof SolidTypeUnion) {
			assignee = assignee.combineTuplesOrRecords();
		}
		if (assignee instanceof SolidTypeIntersection) {
			/* A value is assignable to a type intersection if and only if
				it is assignable to both operands of that intersection. */
			return this.assignTo(assignee.left) && this.assignTo(assignee.right);
		} else if (assignee instanceof SolidTypeUnion) {
			/* A value is assignable to a type union if and only if
				it is assignable to either operand of that union. */
			return this.assignTo(assignee.left) || this.assignTo(assignee.right);
		} else {
			return this.assignTo_do(assignee);
		}
	}
	protected abstract assignTo_do(assignee: SolidType): boolean; // TODO: use decorators
}

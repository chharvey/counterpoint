import {
	TYPE,
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
	/**
	 * Decorator for {@link ASTNodeCollectionLiteral#assignTo} method and any overrides.
	 * Simplifies assignments by handling type operations.
	 * @param   _prototype    the prototype that has the method to be decorated
	 * @param   _property_key the name of the method to be decorated
	 * @param   descriptor    the Property Descriptor of the prototype’s method
	 * @returns               `descriptor`, with a new value that is the decorated method
	 */
	protected static assignToDeco(
		_prototype: ASTNodeCollectionLiteral,
		_property_key: string,
		descriptor: TypedPropertyDescriptor<(this: ASTNodeCollectionLiteral, assignee: TYPE.Type) => boolean>,
	): typeof descriptor {
		const method = descriptor.value!;
		descriptor.value = function (assignee: TYPE.Type) {
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
				return method.call(this, assignee);
			}
		};
		return descriptor;
	}


	constructor (
		start_node:
			| SyntaxNodeType<'tuple_literal'>
			| SyntaxNodeType<'record_literal'>
			| SyntaxNodeType<'set_literal'>
			| SyntaxNodeType<'map_literal'>
		,
		override readonly children: readonly ASTNodeCP[],
	) {
		super(start_node, {}, children);
	}
	override shouldFloat(): boolean {
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

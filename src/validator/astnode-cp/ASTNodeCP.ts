import * as xjs from 'extrajs';
import type {SyntaxNode} from 'tree-sitter';
import {
	TYPE,
	TypeError03,
} from '../../index.js';
import {to_serializable} from '../../parser/index.js';
import type {Validator} from '../index.js';
import {ASTNode} from '../ASTNode.js';
import {
	type ASTNodeExpression,
	ASTNodeCollectionLiteral,
} from './index.js';



/**
 * Known subclasses:
 * - ASTNodeKey
 * - ASTNodeIndexType
 * - ASTNodeItemType
 * - ASTNodePropertyType
 * - ASTNodeIndex
 * - ASTNodeProperty
 * - ASTNodeCase
 * - ASTNodeType
 * - ASTNodeExpression
 * - ASTNodeStatement
 * - ASTNodeGoal
 */
export abstract class ASTNodeCP extends ASTNode {
	/**
	 * Type-check an assignment.
	 * @final
	 * @param assigned_type the type of the expression assigned
	 * @param assignee_type the type of the assignee (the variable, bound property, or parameter being (re)assigned)
	 * @param node          the node where the assignment took place
	 * @throws {TypeError03} if the assigned expression is not assignable to the assignee
	 */
	public static typeCheckAssignment(
		assigned_type: TYPE.Type,
		assignee_type: TYPE.Type,
		node:          ASTNodeCP,
	): void {
		if (
			   !assigned_type.isSubtypeOf(assignee_type)
			&& !(
				   // is int treated as a subtype of float?
				   node.validator.config.compilerOptions.intCoercion
				&& assigned_type.isSubtypeOf(TYPE.INT)
				&& TYPE.FLOAT.isSubtypeOf(assignee_type)
			)
		) {
			throw new TypeError03(assigned_type, assignee_type, node);
		}
	}

	/**
	 * Type-check an expression to an assignee type.
	 * Attempts to call {@link ASTNodeCP.typeCheckAssignment} first,
	 * but if catching an error, attempts to assign entry-by-entry
	 * if the assigned expression is a variable collection literal.
	 *
	 * We want to be able to assign collection literals to wider mutable types
	 * so that we can mutate them with different values:
	 * ```
	 * let my_ints: mutable int{} = {42}; % <-- assignment should not fail
	 * set my_ints[43] = true;
	 * ```
	 * However, we want this to not be the case for constant collections,
	 * because they aren’t mutable:
	 * ```
	 * let vec: mutable [int] = \[42]; % <-- assignment should fail
	 * ```
	 *
	 * @final
	 * @param  assigned      the expression assigned
	 * @param  assignee_type the type of the assignee (the variable, bound property, or parameter being (re)assigned)
	 * @param  node          the node where the assignment took place
	 * @throws {TypeError03} if {@link ASTNodeCP.typeCheckAssignment} throws, and:
	 *                       if the assigned expression is not a collection literal,
	 *                       is not a reference object,
	 *                       or is not entry-wise assignable
	 */
	public static assignExpression(
		assigned:      ASTNodeExpression,
		assignee_type: TYPE.Type,
		node:          ASTNodeCP,
	): void {
		try {
			return ASTNodeCP.typeCheckAssignment(assigned.type(), assignee_type, node);
		} catch (err) {
			if (!(assigned instanceof ASTNodeCollectionLiteral && assigned.assignTo(assignee_type))) {
				throw err;
			}
		}
	}


	/**
	 * Construct a new ASTNodeCP object.
	 *
	 * @param start_node - The initial node in the parse tree to which this ASTNode corresponds.
	 * @param children   - The set of child inputs that creates this ASTNode.
	 * @param attributes - Any other attributes to attach.
	 */
	public constructor(
		protected readonly start_node: SyntaxNode,
		attributes: Record<string, unknown> = {},
		public override readonly children: readonly ASTNodeCP[] = [],
	) {
		super(to_serializable(start_node), attributes, children);
	}

	public get validator(): Validator {
		return (this.parent as ASTNodeCP).validator;
	}

	/**
	 * Perform definite assignment phase of semantic analysis:
	 * - Check that all variables have been assigned before being used.
	 * - Check that no varaible is declared more than once.
	 * - Check that fixed variables are not reassigned.
	 */
	public varCheck(): void {
		return xjs.Array.forEachAggregated(this.children, (c) => c.varCheck());
	}

	/**
	 * Type-check the node as part of semantic analysis.
	 */
	public typeCheck(): void {
		return xjs.Array.forEachAggregated(this.children, (c) => c.typeCheck());
	}
}

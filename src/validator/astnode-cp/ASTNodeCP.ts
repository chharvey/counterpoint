import * as xjs from 'extrajs';
import type {SyntaxNode} from 'tree-sitter';
import {
	TYPE,
	TypeErrorNotAssignable,
} from '../../index.js';
import {to_serializable} from '../../parser/index.js';
import type {Validator} from '../Validator.js';
import {ASTNode} from '../ASTNode.js';



export abstract class ASTNodeCP extends ASTNode {
	/**
	 * Type-check an assignment.
	 * @final
	 * @param assigned_type the type of the expression assigned
	 * @param assignee_type the type of the assignee (the variable, bound property, or parameter being (re)assigned)
	 * @param node          the node where the assignment took place
	 * @param validator     a validator for type-checking purposes
	 * @throws {TypeErrorNotAssignable} if the assigned expression is not assignable to the assignee
	 */
	public static typeCheckAssignment(
		assigned_type: TYPE.Type,
		assignee_type: TYPE.Type,
		node:          ASTNodeCP,
		validator:     Validator,
	): void {
		if (
			   !assigned_type.isSubtypeOf(assignee_type)
			&& !(
				   // is int treated as a subtype of float?
				   validator.config.compilerOptions.intCoercion
				&& assigned_type.isSubtypeOf(TYPE.INT)
				&& TYPE.FLOAT.isSubtypeOf(assignee_type)
			)
		) {
			throw new TypeErrorNotAssignable(assigned_type, assignee_type, node);
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

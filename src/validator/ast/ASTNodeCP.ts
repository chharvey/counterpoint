import {
	type TYPE,
	TypeErrorNotAssignable,
} from '../../index.ts';
import {
	type Expression,
	CollectionLiteral,
} from './index.ts';
import type {AstNode} from './AstNode.ts';



// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export abstract class ASTNodeCP {
	/**
	 * Type-check an expression to an assignee type.
	 * Attempts to check subtyping rules first, but if failing, attempts to assign entry-by-entry
	 * if the assigned expression is a variable collection literal.
	 *
	 * We want to be able to assign mutable collection literals to wider mutable types
	 * so that we can mutate them with different values:
	 * ```
	 * val my_ints: mut {int} = {42}; % <-- assignment should not fail
	 * set my_ints.[43] = true;
	 * ```
	 *
	 * Normally, mutable Set types are invariant — that is, if `A` is a subtype of `B`,
	 * then `mut Set.<A>` would be unassignable to `mut Set.<B>`.
	 * However, when a Set *literal* such as `{a1, a2}` is assigned to a wider mutable type `mut B{}`,
	 * it’s too conservative to infer too narrow a type `mut A{}`,
	 * since we can predict it will be mutated later with elements of type `B`.
	 * Therefore we want to allow the assignment, bypassing invariance.
	 *
	 * @final
	 * @param  assigned      the expression assigned
	 * @param  assignee_type the type of the assignee (the variable, bound property, or parameter being (re)assigned)
	 * @param  node          the node where the assignment took place
	 * @throws {TypeErrorNotAssignable} if the assigned expression’s type is not a subtype of the assignee’s type, and:
	 *                       if the assigned expression is not a collection literal,
	 *                       is not a reference object,
	 *                       or is not entry-wise assignable
	 */
	public static typeCheckAssign(
		assigned:      Expression,
		assignee_type: TYPE.Type,
		node:          AstNode,
	): void {
		if (!assigned.type().isSubtypeOf(assignee_type)) {
			if (assigned instanceof CollectionLiteral) {
				return assigned.assignTo(assignee_type);
			}
			throw new TypeErrorNotAssignable(assigned, assignee_type, node);
		}
	}
}

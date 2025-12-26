import * as xjs from 'extrajs';
import type {SyntaxNode} from 'tree-sitter';
import {
	type TYPE,
	type Builder,
	TypeErrorNotAssignable,
} from '../../index.ts';
import {memoizeGetter} from '../../lib/index.ts';
import {to_serializable} from '../../parser/index.ts';
import type {Validator} from '../Validator.ts';
import {
	type Expression,
	CollectionLiteral,
} from './index.ts';
import {AstNode} from './AstNode.ts';



/**
 * Known subclasses:
 * - Index
 * - Key
 * - ItemType
 * - PropertyType
 * - Property
 * - Case
 * - Type
 * - Expression
 * - Statement
 * - Block
 * - Goal
 */
export abstract class ASTNodeCP extends AstNode {
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
		node:          ASTNodeCP,
	): void {
		if (!assigned.type().isSubtypeOf(assignee_type)) {
			if (assigned instanceof CollectionLiteral) {
				return assigned.assignTo(assignee_type);
			}
			throw new TypeErrorNotAssignable(assigned, assignee_type, node);
		}
	}


	/**
	 * Construct a new ASTNodeCP object.
	 *
	 * @param start_node - The initial node in the parse tree to which this ASTNodeCP corresponds.
	 * @param children   - The set of child inputs that creates this ASTNodeCP.
	 * @param attributes - Any other attributes to attach.
	 */
	public constructor(
		protected readonly start_node: SyntaxNode,
		attributes: Record<string, unknown> = {},
		public override readonly children: readonly ASTNodeCP[] = [],
	) {
		super(to_serializable(start_node), attributes, children);
	}

	@memoizeGetter
	public get validator(): Validator {
		return (this.parent as ASTNodeCP).validator;
	}

	@memoizeGetter
	public get builder(): Builder {
		return (this.parent as ASTNodeCP).builder;
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

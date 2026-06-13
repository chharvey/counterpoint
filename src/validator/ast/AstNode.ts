import * as xjs from 'extrajs';
import type {SyntaxNode} from 'tree-sitter';
import {TypeErrorNotAssignable} from '../../index.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {TYPE} from '../../typer/index.ts';
import {
	stringifyAttributes,
	type Serializable,
	to_serializable,
} from '../../parser/index.ts';
import type {Validator} from '../Validator.ts';
import {EXPR} from './index.ts';



/**
 * Type-check an expression to an assignee type.
 * Attempts to check subtyping rules first, but if failing, attempts to assign entry-by-entry
 * if the assigned expression is a variable collection literal.
 *
 * We want to be able to assign mutable collection literals to wider mutable types
 * so that we can mutate them with different values:
 * ```
 * val my_ints: mut Set.<int> = {42}; % <-- assignment should not fail
 * my_ints.put(43);
 * ```
 *
 * Normally, mutable Set types are invariant — that is, if `A` is a subtype of `B`,
 * then `mut Set.<A>` would be unassignable to `mut Set.<B>`.
 * However, when a Set *literal* such as `{a1, a2}` is assigned to a wider mutable type `mut Set.<B>`,
 * it’s too conservative to infer too narrow a type `mut Set.<A>`,
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
export function typecheck_assign(
	assigned:      EXPR.Expression,
	assignee_type: TYPE.Type,
	node:          AstNode,
): void {
	if (!assigned.type().isSubtypeOf(assignee_type)) {
		if (assigned instanceof EXPR.Collection) {
			return assigned.assignTo(assignee_type);
		}
		throw new TypeErrorNotAssignable(assigned, assignee_type, node);
	}
}



/**
 * An AstNode is a node in the Abstract Syntax Tree
 * and holds only the semantics of a parse node.
 *
 * An AstNode is an abstraction of a ParseNode, without syntactic details.
 * For example, the expression `5 + 2 * 3` can be represented by the following abstract tree:
 * ```xml
 * <Operation operator="+">
 * 	<Constant value="5"/>
 * 	<Operation operator="*">
 * 		<Constant value="2"/>
 * 		<Constant value="3"/>
 * 	</Operation>
 * </Operation>
 * ```
 *
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
 *
 * Known subinterfaces:
 * - Foldable
 * - Buildable
 */
export class AstNode implements Serializable {
	/** @implements Serializable */
	public readonly tagname:      string = this.constructor.name;
	/** @implements Serializable */
	public readonly source:       string;
	/** @implements Serializable */
	public readonly source_index: number;
	/** @implements Serializable */
	public readonly line_index:   number;
	/** @implements Serializable */
	public readonly col_index:    number;

	#parent?: AstNode;

	/**
	 * Construct a new AstNode object.
	 *
	 * @param start      The node in the parse tree to which this AstNode corresponds.
	 * @param attributes Any other attributes to attach.
	 * @param children   The set of child inputs that creates this AstNode.
	 */
	public constructor(
		protected readonly start_node: SyntaxNode,
		private   readonly attributes: Record<string, unknown> = {},
		public    readonly children:   readonly AstNode[] = [],
	) {
		const start: Serializable = to_serializable(start_node);

		this.source       = start.source;
		this.source_index = start.source_index;
		this.line_index   = start.line_index;
		this.col_index    = start.col_index;

		children.forEach((c) => {
			c.#parent = this;
		});
	}

	/** The unique parent node containing this node. */
	public get parent(): AstNode | undefined {
		return this.#parent;
	}

	@memoizeGetter
	public get validator(): Validator {
		return this.parent!.validator;
	}

	/** @implements Serializable */
	public serialize(): string {
		const attributes = new Map<string, string>([
			['line',   (this.line_index + 1).toString()],
			['col',    (this.col_index  + 1).toString()],
			['source', this.source],
		]);
		Object.entries(this.attributes).forEach(([key, value]) => {
			attributes.set(key, `${ value }`);
		});
		const contents: string = this.children.map((child) => child.serialize()).join('');
		return `<${ this.tagname } ${ stringifyAttributes(attributes) }${ (contents) ? `>${ contents }</${ this.tagname }>` : '/>' }`;
	}

	/**
	 * Perform definite assignment phase of semantic analysis:
	 * - Check that all variables have been assigned before being used.
	 * - Check that no varaible is declared more than once.
	 * - Check that read-only variables are not reassigned.
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

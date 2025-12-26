import * as xjs from 'extrajs';
import type {SyntaxNode} from 'tree-sitter';
import type {Builder} from '../../index.ts';
import {memoizeGetter} from '../../lib/index.ts';
import {
	stringifyAttributes,
	type Serializable,
	to_serializable,
} from '../../parser/index.ts';
import type {Validator} from '../Validator.ts';



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
	public readonly tagname:      string = this.constructor.name.slice('AstNode'.length);
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

	@memoizeGetter
	public get builder(): Builder {
		return this.parent!.builder;
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

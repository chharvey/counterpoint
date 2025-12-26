import {
	stringifyAttributes,
	type Serializable,
} from '../parser/index.ts';



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
		private readonly start: Serializable,
		private readonly attributes: Record<string, unknown> = {},
		public readonly children: readonly AstNode[] = [],
	) {
		this.source       = this.start.source;
		this.source_index = this.start.source_index;
		this.line_index   = this.start.line_index;
		this.col_index    = this.start.col_index;
		children.forEach((c) => {
			c.#parent = this;
		});
	}

	/** The unique parent node containing this node. */
	public get parent(): AstNode | undefined {
		return this.#parent;
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
}

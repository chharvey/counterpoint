import {
	Serializable,
	stringifyAttributes,
} from './package.js';



/**
 * An ASTNode is a node in the Abstract Syntax Tree
 * and holds only the semantics of a parse node.
 *
 * An ASTNode is an abstraction of a ParseNode, without syntactic details.
 * For example, the expression `5 + 2 * 3` can be represented by the following abstract tree:
 * ```xml
 * <ASTNodeOperation operator="+">
 * 	<ASTNodeConstant value="5"/>
 * 	<ASTNodeOperation operator="*">
 * 		<ASTNodeConstant value="2"/>
 * 		<ASTNodeConstant value="3"/>
 * 	</ASTNodeOperation>
 * </ASTNodeOperation>
 * ```
 */
export class ASTNode implements Serializable {
	/** @implements Serializable */
	readonly tagname: string = this.constructor.name.slice('ASTNode'.length);
	/** @implements Serializable */
	readonly source: string = this.start.source;
	/** @implements Serializable */
	readonly source_index: number = this.start.source_index;
	/** @implements Serializable */
	readonly line_index: number = this.start.line_index;
	/** @implements Serializable */
	readonly col_index: number = this.start.col_index;

	private _parent: ASTNode | null = null;

	/**
	 * Construct a new ASTNode object.
	 *
	 * @param start      The node in the parse tree to which this ASTNode corresponds.
	 * @param attributes Any other attributes to attach.
	 * @param children   The set of child inputs that creates this ASTNode.
	 */
	constructor (
		private readonly start: Serializable,
		private readonly attributes: {[key: string]: unknown} = {},
		readonly children: readonly ASTNode[] = [],
	) {
		children.forEach((c) => { c._parent = this; });
	}

	/** The unique parent node containing this node. */
	get parent(): ASTNode | null {
		return this._parent;
	}

	/** @implements Serializable */
	serialize(): string {
		const attributes: Map<string, string> = new Map<string, string>([
			['line',   (this.line_index + 1).toString()],
			['col',    (this.col_index  + 1).toString()],
			['source', this.source],
		]);
		Object.entries(this.attributes).forEach(([key, value]) => {
			attributes.set(key, `${ value }`);
		});
		const contents: string = this.children.map((child) => child.serialize()).join('');
		return `<${ this.tagname } ${ stringifyAttributes(attributes) }${ (contents) ? `>${ contents }</${ this.tagname }>` : `/>` }`;
	}
}

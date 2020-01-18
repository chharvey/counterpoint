import Serializable from '../iface/Serializable.iface'

import {STX, ETX} from './Scanner.class'

import ParseNode from './ParseNode.class'



/**
 * A SemanticNode holds only the semantics of a {@link ParseNode}.
 */
export default class SemanticNode implements Serializable {
	/** The name of the type of this SemanticNode. */
	private readonly tagname: string;
	/** The concatenation of the source text of all children. */
	private readonly source: string;
	/** Zero-based line number of the first token (first line is line 0). */
	readonly line_index: number;
	/** Zero-based column number of the first token (first col is col 0). */
	readonly col_index: number;

	/**
	 * Construct a new SemanticNode object.
	 *
	 * @param start_node - The initial node in the parse tree to which this SemanticNode corresponds.
	 * @param children   - The set of child inputs that creates this SemanticNode.
	 * @param attributes - Any other attributes to attach.
	 */
	constructor(
		start_node: ParseNode,
		private readonly attributes: { [key: string]: string|number|boolean|null } = {},
		private readonly children: readonly SemanticNode[] = [],
	) {
		this.tagname    = this.constructor.name.slice('SemanticNode'.length) || 'Unknown'
		this.source     = start_node.source
		this.line_index = start_node.line_index
		this. col_index = start_node. col_index
	}

	/**
	 * @implements Serializable
	 */
	serialize(): string {
		const attributes: string = ' ' + [
			!(this instanceof SemanticNodeGoal) ? `line="${this.line_index + 1}"` : '',
			!(this instanceof SemanticNodeGoal) ?  `col="${this.col_index  + 1}"` : '',
			`source="${
				this.source
					.replace(STX, '\u2402') /* SYMBOL FOR START OF TEXT */
					.replace(ETX, '\u2403') /* SYMBOL FOR START OF TEXT */
			}"`,
			...Object.entries<string|number|boolean|null>(this.attributes).map(([key, value]) => `${key}="${value}"`),
		].join(' ').trim()
		const contents: string = this.children.map((child) => child.serialize()).join('')
		return `<${this.tagname}${attributes}>${contents}</${this.tagname}>`
	}
}



export class SemanticNodeNull extends SemanticNode {
	constructor(start_node: ParseNode) {
		super(start_node)
	}
}
export class SemanticNodeGoal extends SemanticNode {
	constructor(start_node: ParseNode, children: readonly [SemanticNodeExpression]) {
		super(start_node, {}, children)
	}
}
export class SemanticNodeExpression extends SemanticNode {
	constructor(start_node: ParseNode, operator: string, children: readonly SemanticNode[]) {
		super(start_node, {operator}, children)
	}
}
export class SemanticNodeConstant extends SemanticNode {
	constructor(start_node: ParseNode, value: number) {
		super(start_node, {value})
	}
}

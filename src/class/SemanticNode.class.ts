import Serializable from '../iface/Serializable.iface'

import {STX, ETX} from './Scanner.class'

import ParseNode from './ParseNode.class'


/**
 * A SemanticNode holds only the semantics of a {@link ParseNode}.
 */
export default class SemanticNode implements Serializable {
	/** The concatenation of the source text of all children. */
	private readonly source: string;
	/** Zero-based line number of the first token (first line is line 0). */
	readonly line_index: number;
	/** Zero-based column number of the first token (first col is col 0). */
	readonly col_index: number;
	/**
	 * Construct a new SemanticNode object.
	 *
	 * @param canonical  - The canonical node in the parse tree to which this SemanticNode corresponds.
	 * @param tagname    - The name of the type of this SemanticNode.
	 * @param children   - The set of child inputs that creates this SemanticNode.
	 * @param attributes - Any other attributes to attach.
	 */
	constructor(
		private readonly tagname: string,
		canonical: ParseNode,
		private readonly attributes: { [key: string]: string|number|boolean|null } = {},
		private readonly children: readonly SemanticNode[] = [],
	) {
		this.source     = canonical.source
		this.line_index = canonical.line_index
		this. col_index = canonical. col_index
	}
	/**
	 * @implements Serializable
	 */
	serialize(): string {
		const attributes: string = ' ' + [
			(this.tagname !== 'SemanticGoal') ? `line="${this.line_index + 1}"` : '',
			(this.tagname !== 'SemanticGoal') ?  `col="${this.col_index  + 1}"` : '',
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
	constructor(canonical: ParseNode) {
		super('Null', canonical)
	}
}
export class SemanticNodeGoal extends SemanticNode {
	constructor(canonical: ParseNode, children: readonly SemanticNode[]) {
		super('Goal', canonical, {}, children)
	}
}
export class SemanticNodeExpression extends SemanticNode {
	constructor(canonical: ParseNode, operator: string, children: readonly SemanticNode[]) {
		super('Expression', canonical, {operator}, children)
	}
}
export class SemanticNodeConstant extends SemanticNode {
	constructor(canonical: ParseNode, value: number) {
		super('Constant', canonical, {value})
	}
}

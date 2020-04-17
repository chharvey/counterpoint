import type Serializable from '../iface/Serializable.iface'
import {STX, ETX} from './Char.class'
import type ParseNode from './ParseNode.class'
import type {
	ParseNodeExpressionUnit,
} from './ParseNode.class'



/**
 * A SemanticNode holds only the semantics of a {@link ParseNode}.
 */
export default class SemanticNode implements Serializable {
	/** The name of the type of this SemanticNode. */
	private readonly tagname: string;
	/** The concatenation of the source text of all children. */
	private readonly source: string;
	/** The index of the first token in source text. */
	readonly source_index: number;
	/** Zero-based line number of the first token (first line is line 0). */
	readonly line_index: number;
	/** Zero-based column number of the first token (first col is col 0). */
	readonly col_index: number;
	/** An identifier for this node in compiled output. */
	readonly identifier: string; // COMBAK `protected` NB <https://github.com/microsoft/TypeScript/issues/35989>

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
		protected readonly children: readonly SemanticNode[] = [],
	) {
		this.tagname      = this.constructor.name.slice('SemanticNode'.length) || 'Unknown'
		this.source       = start_node.source
		this.source_index = start_node.source_index
		this.line_index   = start_node.line_index
		this.col_index    = start_node.col_index
		this.identifier   = `__${this.source_index.toString(36)}`
	}

	/**
	 * Generate code for the runtime.
	 * @returns a string of code to execute
	 */
	compile(): string {
		return `
export default void 0
		`.trim()
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
		return (contents) ? `<${this.tagname}${attributes}>${contents}</${this.tagname}>` : `<${this.tagname}${attributes}/>`
	}
}



export class SemanticNodeNull extends SemanticNode {
	constructor(start_node: ParseNode) {
		super(start_node)
	}
	compile(): string {
		return `
export default null
		`.trim()
	}
}
export class SemanticNodeGoal extends SemanticNode {
	constructor(
		start_node: ParseNode,
		protected readonly children:
			readonly [SemanticNodeConstant|SemanticNodeExpression],
	) {
		super(start_node, {}, children)
	}
	compile(): string {
		return this.children[0] instanceof SemanticNodeConstant ? `
export default ${this.children[0].compile()}
		`.trim() : `
${this.children[0].compile()}
export default ${this.children[0].identifier}
		`.trim()
	}
}
export class SemanticNodeExpression extends SemanticNode {
	constructor(
		start_node: ParseNode,
		private readonly operator: string,
		protected readonly children:
			readonly [SemanticNodeConstant|SemanticNodeExpression] |
			readonly [SemanticNodeConstant|SemanticNodeExpression, SemanticNodeConstant|SemanticNodeExpression],
	) {
		super(start_node, {operator}, children)
	}
	compile(): string {
		const child0 : string = this.children[0].compile()
		const child1 : string = this.children.length === 2 ? this.children[1].compile() : ''
		const idthis : string = this.identifier
		const id0    : string = this.children[0].identifier
		const id1    : string = this.children.length === 2 ? this.children[1].identifier : '__'
		return `
${this.children[0] instanceof SemanticNodeConstant ? `let ${id0}: number = ${child0}` : child0}
${this.children[1] instanceof SemanticNodeConstant ? `let ${id1}: number = ${child1}` : child1}
${idthis === id0 ? idthis : `let ${idthis}: number`} = ${this.children.length === 2 ? `${id0} ${this.operator.replace('^', '**')} ${id1}` : `${this.operator} ${id0}`}
		`.trim()
	}
}
export class SemanticNodeConstant extends SemanticNode {
	constructor(
		start_node: ParseNodeExpressionUnit,
		private readonly value: number,
	) {
		super(start_node, {value})
	}
	compile(): string {
		return `${this.value}`
	}
}

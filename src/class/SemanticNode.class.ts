import Util from './Util.class'
import type Serializable from '../iface/Serializable.iface'
import {STX, ETX} from './Char.class'
import type Token from './Token.class'
import type {CookValueType} from './Token.class'
import type ParseNode from './ParseNode.class'



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
		start_node: Token|ParseNode,
		private readonly attributes: { [key: string]: CookValueType } = {},
		readonly children: readonly SemanticNode[] = [],
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
		const attributes: Map<string, string> = new Map<string, string>()
		if (!(this instanceof SemanticNodeGoal)) {
			attributes.set('line', `${this.line_index + 1}`)
			attributes.set('col' , `${this.col_index  + 1}`)
		}
		attributes.set('source', this.source
			.replace(/\&/g, '&amp;' )
			.replace(/\</g, '&lt;'  )
			.replace(/\>/g, '&gt;'  )
			.replace(/\'/g, '&apos;')
			.replace(/\"/g, '&quot;')
			.replace(/\\/g, '&#x5c;')
			.replace(/\t/g, '&#x09;')
			.replace(/\n/g, '&#x0a;')
			.replace(/\r/g, '&#x0d;')
			.replace(/\u0000/g, '&#x00;')
			.replace(STX, '\u2402') /* SYMBOL FOR START OF TEXT */
			.replace(ETX, '\u2403') /* SYMBOL FOR START OF TEXT */
		)
		Object.entries<CookValueType>(this.attributes).forEach(([key, value]) => {
			attributes.set(key, `${value}`)
		})
		const contents: string = this.children.map((child) => child.serialize()).join('')
		return (contents) ? `<${this.tagname} ${Util.stringifyAttributes(attributes)}>${contents}</${this.tagname}>` : `<${this.tagname} ${Util.stringifyAttributes(attributes)}/>`
	}
}



export class SemanticNodeNull extends SemanticNode {
	constructor(start_node: Token|ParseNode) {
		super(start_node)
	}
	compile(): string {
		return `
export default null
		`.trim()
	}
}
export class SemanticNodeGoal extends SemanticNode {
	constructor(start_node: ParseNode, children: readonly [SemanticNodeStatementList]) {
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
export class SemanticNodeStatementList extends SemanticNode {
	constructor(canonical: ParseNode, children: readonly SemanticNode[]) {
		super(canonical, {}, children)
	}
}
export class SemanticNodeStatement extends SemanticNode {
	constructor(canonical: ParseNode, type: string, children: readonly SemanticNode[]) {
		super(canonical, {type}, children)
	}
}
export class SemanticNodeDeclaration extends SemanticNode {
	constructor(canonical: ParseNode, type: string, unfixed: boolean, children: readonly SemanticNode[]) {
		super(canonical, {type, unfixed}, children)
	}
}
export class SemanticNodeAssignment extends SemanticNode {
	constructor(canonical: ParseNode, children: readonly SemanticNode[]) {
		super(canonical, {}, children)
	}
}
export class SemanticNodeAssignee extends SemanticNode {
	constructor(canonical: Token, children: readonly SemanticNode[]) {
		super(canonical, {}, children)
	}
}
export class SemanticNodeAssigned extends SemanticNode {
	constructor(canonical: ParseNode, children: readonly SemanticNode[]) {
		super(canonical, {}, children)
	}
}
export class SemanticNodeExpression extends SemanticNode {
	constructor(start_node: ParseNode, private readonly operator: string, children: readonly SemanticNode[]) {
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
export class SemanticNodeTemplate extends SemanticNode {
	constructor(canonical: ParseNode, children: readonly SemanticNode[]) {
		super(canonical, {}, children)
	}
}
export class SemanticNodeIdentifier extends SemanticNode {
	constructor(canonical: Token, id: bigint|null) {
		super(canonical, {id})
	}
}
export class SemanticNodeConstant extends SemanticNode {
	constructor(start_node: Token, private readonly value: string|number) {
		super(start_node, {value})
	}
	compile(): string {
		return `${this.value}`
	}
}

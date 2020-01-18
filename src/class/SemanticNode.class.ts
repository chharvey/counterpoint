import Serializable from '../iface/Serializable.iface'

import {STX, ETX} from './Scanner.class'

import Token from './Token.class'
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
		canonical: Token|ParseNode,
		private readonly attributes: { [key: string]: string|number|boolean|null } = {},
		readonly children: readonly SemanticNode[] = [],
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
			`source="${this.source
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
			}"`,
			...Object.entries<string|number|boolean|null>(this.attributes).map(([key, value]) => `${key}="${value}"`),
		].join(' ').trim()
		const contents: string = this.children.map((child) => child.serialize()).join('')
		return `<${this.tagname}${attributes}>${contents}</${this.tagname}>`
	}
}
export class SemanticNodeNull extends SemanticNode {
	constructor(canonical: Token|ParseNode) {
		super('Null', canonical)
	}
}
export class SemanticNodeGoal extends SemanticNode {
	constructor(canonical: ParseNode, children: readonly SemanticNode[]) {
		super('Goal', canonical, {}, children)
	}
}
export class SemanticNodeStatementList extends SemanticNode {
	constructor(canonical: ParseNode, children: readonly SemanticNode[]) {
		super('StatementList', canonical, {}, children)
	}
}
export class SemanticNodeStatement extends SemanticNode {
	constructor(canonical: ParseNode, type: string, children: readonly SemanticNode[]) {
		super('Statement', canonical, {type}, children)
	}
}
export class SemanticNodeDeclaration extends SemanticNode {
	constructor(canonical: ParseNode, type: string, children: readonly SemanticNode[]) {
		super('Declaration', canonical, {type}, children)
	}
}
export class SemanticNodeAssignment extends SemanticNode {
	constructor(canonical: ParseNode, children: readonly SemanticNode[]) {
		super('Assignment', canonical, {}, children)
	}
}
export class SemanticNodeAssignee extends SemanticNode {
	constructor(canonical: Token, unfixed: boolean /* FIXME */, children: readonly SemanticNode[]) {
		super('Assignee', canonical, {unfixed}, children)
	}
}
export class SemanticNodeAssigned extends SemanticNode {
	constructor(canonical: ParseNode, children: readonly SemanticNode[]) {
		super('Assigned', canonical, {}, children)
	}
}
export class SemanticNodeExpression extends SemanticNode {
	constructor(canonical: ParseNode, operator: string, children: readonly SemanticNode[]) {
		super('Expression', canonical, {operator}, children)
	}
}
export class SemanticNodeTemplate extends SemanticNode {
	constructor(canonical: ParseNode, children: readonly SemanticNode[]) {
		super('Expression', canonical, {}, children)
	}
}
export class SemanticNodeIdentifier extends SemanticNode {
	constructor(canonical: Token, id: string|number) {
		super('Identifier', canonical, {id})
	}
}
export class SemanticNodeConstant extends SemanticNode {
	constructor(canonical: Token, value: string|number) {
		super('Constant', canonical, {value})
	}
}

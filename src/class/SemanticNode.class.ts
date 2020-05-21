import Util from './Util.class'
import type Serializable from '../iface/Serializable.iface'
import CodeGenerator from './CodeGenerator.class'
import Token, {
	Filebound,
	Punctuator,
} from './Token.class'
import type {CookValueType} from './Token.class'
import type ParseNode from './ParseNode.class'
import type {
	ParseNodeExpressionUnit,
} from './ParseNode.class'



export type SemanticStatementType = SemanticNodeDeclaration | SemanticNodeAssignment | SemanticNodeStatementExpression | SemanticNodeStatementEmpty
export type SemanticExpressionType = SemanticNodeConstant|SemanticNodeIdentifier|SemanticNodeTemplate|SemanticNodeExpression



/**
 * A SemanticNode holds only the semantics of a {@link ParseNode}.
 */
export default class SemanticNode implements Serializable {
	/** The name of the type of this SemanticNode. */
	readonly tagname: string = this.constructor.name.slice('SemanticNode'.length) || 'Unknown'
	/** The concatenation of the source text of all children. */
	private readonly source: string;
	/** The index of the first token in source text. */
	readonly source_index: number;
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
		start_node: Token|ParseNode,
		private readonly attributes: { [key: string]: CookValueType } = {},
		readonly children: readonly SemanticNode[] = [],
	) {
		this.source       = start_node.source
		this.source_index = start_node.source_index
		this.line_index   = start_node.line_index
		this.col_index    = start_node.col_index
	}

	/**
	 * Give directions to the runtime code generator.
	 * @param generator the generator to direct
	 */
	compile(generator: CodeGenerator): CodeGenerator {
		return generator.unreachable() // TODO make `ParseNode` and `SemanticNode` abstract classes
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
			.replace(Filebound.SOT, '\u2402') // SYMBOL FOR START OF TEXT
			.replace(Filebound.EOT, '\u2403') // SYMBOL FOR END   OF TEXT
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
	compile(): CodeGenerator {
		return new CodeGenerator()
	}
}
export class SemanticNodeConstant extends SemanticNode {
	constructor(
		start_node: Token|ParseNodeExpressionUnit,
		private readonly value: string|number,
	) {
		super(start_node, {value})
	}
	compile(generator: CodeGenerator): CodeGenerator {
		return (typeof this.value === 'number')
			? generator.const(this.value)
			: generator // TODO strings
	}
}
export class SemanticNodeIdentifier extends SemanticNode {
	constructor(canonical: Token, id: bigint|null) {
		super(canonical, {id})
	}
}
export class SemanticNodeTemplate extends SemanticNode {
	constructor(
		canonical: ParseNode,
		readonly children:
			readonly SemanticExpressionType[],
	) {
		super(canonical, {}, children)
	}
}
export class SemanticNodeExpression extends SemanticNode {
	constructor(
		start_node: ParseNode,
		private readonly operator: Punctuator,
		readonly children:
			readonly [SemanticExpressionType                        ] |
			readonly [SemanticExpressionType, SemanticExpressionType],
	) {
		super(start_node, {operator}, children)
	}
	compile(generator: CodeGenerator): CodeGenerator {
		return (this.children.length === 1)
			? generator.unop (this.operator, ...this.children)
			: generator.binop(this.operator, ...this.children)
	}
}
export class SemanticNodeDeclaration extends SemanticNode {
	constructor(canonical: ParseNode, type: string, unfixed: boolean, children: readonly [SemanticNodeAssignee, SemanticNodeAssigned]) {
		super(canonical, {type, unfixed}, children)
	}
}
export class SemanticNodeAssignment extends SemanticNode {
	constructor(canonical: ParseNode, children: readonly [SemanticNodeAssignee, SemanticNodeAssigned]) {
		super(canonical, {}, children)
	}
}
export class SemanticNodeAssignee extends SemanticNode {
	constructor(canonical: Token, children: readonly [SemanticNodeIdentifier]) {
		super(canonical, {}, children)
	}
}
export class SemanticNodeAssigned extends SemanticNode {
	constructor(canonical: ParseNode, children: readonly [SemanticExpressionType]) {
		super(canonical, {}, children)
	}
}
export class SemanticNodeStatementEmpty extends SemanticNode {
	constructor(canonical: ParseNode) {
		super(canonical)
	}
	compile(generator: CodeGenerator): CodeGenerator {
		return generator.nop()
	}
}
export class SemanticNodeStatementExpression extends SemanticNode {
	constructor(canonical: ParseNode, children: readonly [SemanticExpressionType]) {
		super(canonical, {}, children)
	}
	compile(generator: CodeGenerator): CodeGenerator {
		return this.children[0].compile(generator)
	}
}
export class SemanticNodeStatementList extends SemanticNode {
	constructor(
		canonical: ParseNode,
		readonly children:
			readonly SemanticStatementType[],
	) {
		super(canonical, {}, children)
	}
	compile(generator: CodeGenerator): CodeGenerator {
		this.children.forEach((child) => {
			child.compile(generator)
		})
		return generator
	}
}
export class SemanticNodeGoal extends SemanticNode {
	constructor(
		start_node: ParseNode,
		readonly children:
			readonly [SemanticNodeStatementList],
	) {
		super(start_node, {}, children)
	}
	compile(): CodeGenerator {
		return this.children[0].compile(new CodeGenerator())
	}
}

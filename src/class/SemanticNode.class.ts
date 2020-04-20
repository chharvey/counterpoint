import Util from './Util.class'
import type Serializable from '../iface/Serializable.iface'
import {STX, ETX} from './Char.class'
import type Token from './Token.class'
import type {CookValueType} from './Token.class'
import type ParseNode from './ParseNode.class'
import type {
	ParseNodeExpressionUnit,
} from './ParseNode.class'



export type SemanticStatementType  = SemanticNodeDeclaration|SemanticNodeAssignment|SemanticNodeStatementExpression|SemanticNodeStatementEmpty
export type SemanticExpressionType = SemanticNodeConstant|SemanticNodeIdentifier|SemanticNodeTemplate|SemanticNodeExpression

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
	}

	/**
	 * Generate code for the runtime.
	 * @returns a string of code to execute
	 */
	compile(): string {
		return Util.dedent(`
			export default void 0
		`)
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
		return Util.dedent(`
			export default null
		`)
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
	compile(): string {
		return Util.dedent(`
			type RuntimeInt = number
			type Stack = StackItem[]
			type StackItem = RuntimeInt|StackFunction
			type StackFunction = (x: RuntimeInt, y?: RuntimeInt) => RuntimeInt
			const evalStack = (stack: Stack): RuntimeInt => {
				if (!stack.length) throw new Error('empty stack')
				const it: StackItem = stack.pop()!
				return (it instanceof Function) ?
					it(...[...new Array(it.length)].map(() => evalStack(stack)).reverse() as Parameters<StackFunction>) :
					it
			}
			const AFF: StackFunction = (a) => +a
			const NEG: StackFunction = (a) => -a
			const ADD: StackFunction = (a, b) => a  + b!
			const MUL: StackFunction = (a, b) => a  * b!
			const DIV: StackFunction = (a, b) => a  / b!
			const EXP: StackFunction = (a, b) => a ** b!
			const STACK: Stack = []
			${this.children[0].compile()}
			export default evalStack(STACK)
		`)
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
export class SemanticNodeStatementExpression extends SemanticNode {
	constructor(canonical: ParseNode, children: readonly []|[SemanticExpressionType]) {
		super(canonical, {}, children)
	}
}
export class SemanticNodeStatementEmpty extends SemanticNode {
	constructor(canonical: ParseNode) {
		super(canonical)
	}
}
export class SemanticNodeExpression extends SemanticNode {
	constructor(
		start_node: ParseNode,
		private readonly operator: string,
		readonly children:
			readonly [SemanticExpressionType] |
			readonly [SemanticExpressionType, SemanticExpressionType],
	) {
		super(start_node, {operator}, children)
	}
	compile(): string {
		return Util.dedent(`
			${this.children[0].compile()}
			${Util.dedent((this.children.length === 2) ? `
				${this.children[1].compile()}
				STACK.push(${new Map<string, string>([
					['+', 'ADD'],
					['*', 'MUL'],
					['/', 'DIV'],
					['^', 'EXP'],
				]).get(this.operator || '+') || 'ADD'})
			` : `
				STACK.push(${new Map<string, string>([
					['+', 'AFF'],
					['-', 'NEG'],
				]).get(this.operator || '+') || 'AFF'})
			`)}
		`)
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
export class SemanticNodeIdentifier extends SemanticNode {
	constructor(canonical: Token, id: bigint|null) {
		super(canonical, {id})
	}
}
export class SemanticNodeConstant extends SemanticNode {
	constructor(
		start_node: Token|ParseNodeExpressionUnit,
		private readonly value: string|number,
	) {
		super(start_node, {value})
	}
	compile(): string {
		return Util.dedent(`
			STACK.push(${this.value})
		`)
	}
}

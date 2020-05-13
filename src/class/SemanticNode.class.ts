import Util from './Util.class'
import type Serializable from '../iface/Serializable.iface'
import {STX, ETX} from './Char.class'
import type ParseNode from './ParseNode.class'
import {
	ParseNodeExpressionUnit,
	Operator,
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
		return Util.dedent(`
			export default null
		`)
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
		return Util.dedent(`
			type RuntimeInt = number
			type Stack = RuntimeInt[]
			const ${Operator[Operator.ADD]} = (stack: Stack): void => { const arg2: RuntimeInt = stack.pop() !; const arg1: RuntimeInt = stack.pop() !; stack.push(arg1 +  arg2) }
			const ${Operator[Operator.MUL]} = (stack: Stack): void => { const arg2: RuntimeInt = stack.pop() !; const arg1: RuntimeInt = stack.pop() !; stack.push(arg1 *  arg2) }
			const ${Operator[Operator.DIV]} = (stack: Stack): void => { const arg2: RuntimeInt = stack.pop() !; const arg1: RuntimeInt = stack.pop() !; stack.push(arg1 /  arg2) }
			const ${Operator[Operator.EXP]} = (stack: Stack): void => { const arg2: RuntimeInt = stack.pop() !; const arg1: RuntimeInt = stack.pop() !; stack.push(arg1 ** arg2) }
			const ${Operator[Operator.NEG]} = (stack: Stack): void => { stack.push(-stack.pop() !) }
			const STACK: Stack = []
			${this.children[0].compile()}
			export default STACK.pop()
		`)
	}
}
export class SemanticNodeExpression extends SemanticNode {
	constructor(
		start_node: ParseNode,
		private readonly operator: Operator,
		protected readonly children:
			readonly [SemanticNodeConstant|SemanticNodeExpression] |
			readonly [SemanticNodeConstant|SemanticNodeExpression, SemanticNodeConstant|SemanticNodeExpression],
	) {
		super(start_node, {operator: Operator[operator]}, children)
	}
	compile(): string {
		return Util.dedent(`
			${this.children[0].compile()}
			${(this.children.length === 2) ? this.children[1].compile() : ''}
			${Operator[this.operator]}(STACK)
		`)
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
		return Util.dedent(`
			STACK.push(${this.value})
		`)
	}
}

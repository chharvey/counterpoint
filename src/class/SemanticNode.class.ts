import Util from './Util.class'
import type Serializable from '../iface/Serializable.iface'
import type CodeGenerator from './CodeGenerator.class'
import type Token from './Token.class'
import type {
	Punctuator,
} from './Token.class'
import type {CookValueType} from './Token.class'
import type ParseNode from './ParseNode.class'
import type {
	ParseNodeExpressionUnit,
} from './ParseNode.class'



export type SemanticStatementType =
	| SemanticNodeDeclaration
	| SemanticNodeAssignment
	| SemanticNodeStatementExpression
	| SemanticNodeNull



/**
 * @deprecated temporary in lieu of a more full-fledged class.
 */
export enum SolidLanguageType {
	NUMBER,
	STRING,
}



/**
 * A SemanticNode holds only the semantics of a {@link ParseNode}.
 */
export default abstract class SemanticNode implements Serializable {
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
	 * @return the directions to print
	 */
	abstract evaluate(generator: CodeGenerator): string;

	/**
	 * @implements Serializable
	 */
	serialize(): string {
		const attributes: Map<string, string> = new Map<string, string>()
		if (!(this instanceof SemanticNodeGoal)) {
			attributes.set('line', `${this.line_index + 1}`)
			attributes.set('col' , `${this.col_index  + 1}`)
		}
		attributes.set('source', this.source)
		Object.entries<CookValueType>(this.attributes).forEach(([key, value]) => {
			attributes.set(key, `${value}`)
		})
		const contents: string = this.children.map((child) => child.serialize()).join('')
		return (contents) ? `<${this.tagname} ${Util.stringifyAttributes(attributes)}>${contents}</${this.tagname}>` : `<${this.tagname} ${Util.stringifyAttributes(attributes)}/>`
	}
}



export class SemanticNodeNull extends SemanticNode {
	declare children:
		| readonly []
	constructor(start_node: Token|ParseNode) {
		super(start_node)
	}
	evaluate(generator: CodeGenerator): string {
		return generator.nop()
	}
}
/**
 * A sematic node representing an expression.
 * There are 4 known subclasses:
 * - SemanticNodeConstant
 * - SemanticNodeIdentifier
 * - SemanticNodeTemplate
 * - SemanticNodeOperation
 */
export abstract class SemanticNodeExpression extends SemanticNode {
	/**
	 * The Type of this expression.
	 */
	abstract type(): SolidLanguageType;
}
export class SemanticNodeConstant extends SemanticNodeExpression {
	declare children:
		| readonly []
	constructor(
		start_node: Token|ParseNodeExpressionUnit,
		private readonly value: string|number,
	) {
		super(start_node, {value})
	}
	evaluate(generator: CodeGenerator): string {
		return (typeof this.value === 'number')
			? generator.const(this.value)
			: generator.nop() // TODO strings
	}
	type(): SolidLanguageType {
		return (typeof this.value === 'number')
			? SolidLanguageType.NUMBER
			: SolidLanguageType.STRING
	}
}
export class SemanticNodeIdentifier extends SemanticNodeExpression {
	declare children:
		| readonly []
	constructor(start_node: Token, id: bigint|null) {
		super(start_node, {id})
	}
	evaluate(generator: CodeGenerator): string {
		throw new Error('not yet supported.')
	}
	type(): SolidLanguageType {
		throw new Error('Not yet supported.')
	}
}
export class SemanticNodeTemplate extends SemanticNodeExpression {
	constructor(
		start_node: ParseNode,
		readonly children: // FIXME spread types
			| readonly [SemanticNodeConstant]
			| readonly [SemanticNodeConstant,                                                                     SemanticNodeConstant]
			| readonly [SemanticNodeConstant, SemanticNodeExpression,                                             SemanticNodeConstant]
			// | readonly [SemanticNodeConstant,                         ...SemanticNodeTemplatePartialChildrenType, SemanticNodeConstant]
			// | readonly [SemanticNodeConstant, SemanticNodeExpression, ...SemanticNodeTemplatePartialChildrenType, SemanticNodeConstant]
			| readonly SemanticNodeExpression[]
	) {
		super(start_node, {}, children)
	}
	evaluate(generator: CodeGenerator): string {
		throw new Error('not yet supported.')
	}
	type(): SolidLanguageType {
		return SolidLanguageType.STRING
	}
}
type SemanticNodeTemplatePartialChildrenType = // FIXME spread types
	| readonly [                                            SemanticNodeConstant                        ]
	| readonly [                                            SemanticNodeConstant, SemanticNodeExpression]
	// | readonly [...SemanticNodeTemplatePartialChildrenType, SemanticNodeConstant                        ]
	// | readonly [...SemanticNodeTemplatePartialChildrenType, SemanticNodeConstant, SemanticNodeExpression]
	| readonly SemanticNodeExpression[]
export class SemanticNodeTemplatePartial extends SemanticNode {
	constructor(
		start_node: ParseNode,
		readonly children: SemanticNodeTemplatePartialChildrenType,
	) {
		super(start_node, {}, children)
	}
	evaluate(generator: CodeGenerator): string {
		throw new Error('not yet supported.')
	}
}
export class SemanticNodeOperation extends SemanticNodeExpression {
	constructor(
		start_node: ParseNode,
		private readonly operator: Punctuator,
		readonly children:
			| readonly [SemanticNodeExpression                        ]
			| readonly [SemanticNodeExpression, SemanticNodeExpression]
	) {
		super(start_node, {operator}, children)
	}
	evaluate(generator: CodeGenerator): string {
		return (this.children.length === 1)
			? generator.unop (this.operator, ...this.children)
			: generator.binop(this.operator, ...this.children)
	}
	type(): SolidLanguageType {
		const t1: SolidLanguageType = this.children[0].type()
		if (t1 !== SolidLanguageType.NUMBER || this.children.length === 2 && this.children[1].type() !== SolidLanguageType.NUMBER) {
			throw new TypeError('Invalid operation.')
		}
		return t1
	}
}
export class SemanticNodeDeclaration extends SemanticNode {
	constructor (
		start_node: ParseNode,
		type: string,
		unfixed: boolean,
		readonly children:
			| readonly [SemanticNodeAssignee, SemanticNodeAssigned]
	) {
		super(start_node, {type, unfixed}, children)
	}
	evaluate(generator: CodeGenerator): string {
		throw new Error('not yet supported.')
	}
}
export class SemanticNodeAssignment extends SemanticNode {
	constructor (
		start_node: ParseNode,
		readonly children:
			| readonly [SemanticNodeAssignee, SemanticNodeAssigned]
	) {
		super(start_node, {}, children)
	}
	evaluate(generator: CodeGenerator): string {
		throw new Error('not yet supported.')
	}
}
export class SemanticNodeAssignee extends SemanticNode {
	constructor(
		start_node: Token,
		readonly children:
			| readonly [SemanticNodeIdentifier]
	) {
		super(start_node, {}, children)
	}
	evaluate(generator: CodeGenerator): string {
		throw new Error('not yet supported.')
	}
}
export class SemanticNodeAssigned extends SemanticNode {
	constructor(
		start_node: ParseNode,
		readonly children:
			| readonly [SemanticNodeExpression]
	) {
		super(start_node, {}, children)
	}
	evaluate(generator: CodeGenerator): string {
		throw new Error('not yet supported.')
	}
}
export class SemanticNodeStatementExpression extends SemanticNode {
	constructor(
		start_node: ParseNode,
		readonly children:
			| readonly [SemanticNodeExpression]
	) {
		super(start_node, {}, children)
	}
	evaluate(generator: CodeGenerator): string {
		return this.children[0].evaluate(generator)
	}
}
export class SemanticNodeStatementList extends SemanticNode {
	constructor(
		start_node: ParseNode,
		readonly children:
			| readonly SemanticStatementType[]
	) {
		super(start_node, {}, children)
	}
	evaluate(generator: CodeGenerator): string {
		return this.children.map((child) =>
			child.evaluate(generator)
		).join('')
	}
}
export class SemanticNodeGoal extends SemanticNode {
	constructor(
		start_node: ParseNode,
		readonly children:
			| readonly []
			| readonly [SemanticNodeStatementList]
	) {
		super(start_node, {}, children)
	}
	evaluate(generator: CodeGenerator): string {
		return (!this.children.length)
			? generator.nop()
			: this.children[0].evaluate(generator)
	}
}

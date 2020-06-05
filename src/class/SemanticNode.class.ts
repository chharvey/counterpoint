import type Serializable from '../iface/Serializable.iface'
import Int16 from '../vm/Int16.class'
import {
	NanError02,
} from '../error/NanError.class'
import type CodeGenerator from './CodeGenerator.class'
import {SOT, EOT} from './Char.class'
import type ParseNode from './ParseNode.class'
import type {
	ParseNodeExpressionUnit,
} from './ParseNode.class'



export enum Operator {
	/** Add.          */ ADD, // +
	/** Subtract.     */ SUB, // -
	/** Multiply.     */ MUL, // *
	/** Divide.       */ DIV, // /
	/** Exponentiate. */ EXP, // ^
	/** Affirm.       */ AFF, // +
	/** Negate.       */ NEG, // -
}


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
	 * Give directions to the runtime code generator.
	 * @param generator the generator to direct
	 * @return the directions to print
	 */
	build(generator: CodeGenerator): string {
		return generator.unreachable() // TODO make `ParseNode` and `SemanticNode` abstract classes
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
					.replace(SOT, '\u2402') // SYMBOL FOR START OF TEXT
					.replace(EOT, '\u2403') // SYMBOL FOR END   OF TEXT
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
	build(generator: CodeGenerator): string {
		return generator.nop()
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
	build(generator: CodeGenerator): string {
		return this.children[0].build(generator)
	}
}
export class SemanticNodeExpression extends SemanticNode {
	private static FOLD_UNARY: Map<Operator, (z: number) => number> = new Map<Operator, (z: number) => number>([
		[Operator.AFF, (z) => Number(new Int16(BigInt(z))      .toNumeric())],
		[Operator.NEG, (z) => Number(new Int16(BigInt(z)).neg().toNumeric())],
	])
	private static FOLD_BINARY: Map<Operator, (x: number, y: number) => number> = new Map<Operator, (x: number, y: number) => number>([
		[Operator.EXP, (x, y) => Number(new Int16(BigInt(x)).exp    (new Int16(BigInt(y))).toNumeric())],
		[Operator.MUL, (x, y) => Number(new Int16(BigInt(x)).times  (new Int16(BigInt(y))).toNumeric())],
		[Operator.DIV, (x, y) => Number(new Int16(BigInt(x)).divide (new Int16(BigInt(y))).toNumeric())],
		[Operator.ADD, (x, y) => Number(new Int16(BigInt(x)).plus   (new Int16(BigInt(y))).toNumeric())],
		[Operator.SUB, (x, y) => Number(new Int16(BigInt(x)).minus  (new Int16(BigInt(y))).toNumeric())],
	])
	constructor(
		start_node: ParseNode,
		private readonly operator: Operator,
		protected readonly children:
			readonly [SemanticNodeConstant|SemanticNodeExpression] |
			readonly [SemanticNodeConstant|SemanticNodeExpression, SemanticNodeConstant|SemanticNodeExpression],
	) {
		super(start_node, {operator: Operator[operator]}, children)
	}
	/**
	 * Assess the value of this node at compile-time, if possible.
	 * @return the computed value of this node, or `null` if the value cannot be computed
	 */
	assess(): number | null {
		const assessment0: number | null = this.children[0].assess()
		if (assessment0 === null) return null
		if (this.children.length === 1) {
			return SemanticNodeExpression.FOLD_UNARY.get(this.operator)!(assessment0)
		} else {
			const assessment1: number | null = this.children[1].assess()
			if (assessment1 === null) return null
			if (this.operator === Operator.DIV && assessment1 === 0) {
				throw new NanError02(this.children[1])
			}
			return SemanticNodeExpression.FOLD_BINARY.get(this.operator)!(assessment0, assessment1)
		}
	}
	build(generator: CodeGenerator): string {
		const assessment: number | null = this.assess()
		return (assessment !== null)
			? generator.const(assessment)
			: (this.children.length === 1)
				? generator.unop (this.operator, ...this.children)
				: generator.binop(this.operator, ...this.children)
	}
}
export class SemanticNodeConstant extends SemanticNode {
	constructor(
		start_node: ParseNodeExpressionUnit,
		private readonly value: number,
	) {
		super(start_node, {value})
	}
	/**
	 * Assess the value of this node at compile-time, if possible.
	 * @return the computed value of this node, or `null` if the value cannot be computed
	 */
	assess(): number {
		return this.value
	}
	build(generator: CodeGenerator): string {
		return generator.const(this.assess())
	}
}

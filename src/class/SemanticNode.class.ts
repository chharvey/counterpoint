import Util from './Util.class'
import type Serializable from '../iface/Serializable.iface'
import Int16 from '../vm/Int16.class'
import {
	NanError02,
} from '../error/NanError.class'
import type CodeGenerator from './CodeGenerator.class'
import Token, {
	Punctuator,
} from './Token.class'
import type {CookValueType} from './Token.class'
import type ParseNode from './ParseNode.class'
import type {
	ParseNodeExpressionUnit,
} from './ParseNode.class'



/**
 * @deprecated temporary in lieu of a more full-fledged class.
 */
export enum SolidLanguageType {
	NUMBER,
	STRING,
}

export type Assessment = InstanceType<typeof SemanticNodeExpression.Assessment>



/**
 * A SemanticNode holds only the semantics of a {@link ParseNode}.
 */
export default abstract class SemanticNode implements Serializable {
	/** The name of the type of this SemanticNode. */
	readonly tagname: string = this.constructor.name.slice('SemanticNode'.length) || 'Unknown'
	/** The concatenation of the source text of all children. */
	readonly source: string;
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
	abstract build(generator: CodeGenerator): string;

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
	/**
	 * Assess the value of this node at compile-time, if possible.
	 * @return the computed value of this node, or a SemanticNode if the value cannot be computed by the compiler
	 */
	abstract assess(): Assessment;

	public static Assessment = class Assessment {
		constructor (readonly value: number | SemanticNodeExpression) {
		}
		get isDetermined(): boolean {
			return !(this.value instanceof SemanticNodeExpression)
		}
		build(generator: CodeGenerator): string {
			return (typeof this.value === 'number')
				? generator.const(this.value)
				: this.value.build(generator)
		}
	}
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
	build(generator: CodeGenerator): string {
		return (typeof this.value === 'number')
			? generator.const(this.assess())
			: generator.nop() // TODO strings
	}
	type(): SolidLanguageType {
		return (typeof this.value === 'number')
			? SolidLanguageType.NUMBER
			: SolidLanguageType.STRING
	}
	assess(): Assessment {
		if (typeof this.value === 'number') {
			return new SemanticNodeExpression.Assessment(this.value)
		} else {
			throw new Error('not yet supported.')
		}
	}
}
export class SemanticNodeIdentifier extends SemanticNodeExpression {
	declare children:
		| readonly []
	constructor(start_node: Token, id: bigint|null) {
		super(start_node, {id})
	}
	build(generator: CodeGenerator): string {
		throw new Error('not yet supported.')
	}
	type(): SolidLanguageType {
		throw new Error('Not yet supported.')
	}
	assess(): Assessment {
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
	build(generator: CodeGenerator): string {
		throw new Error('not yet supported.')
	}
	type(): SolidLanguageType {
		return SolidLanguageType.STRING
	}
	assess(): Assessment {
		throw new Error('Not yet supported.')
	}
}
export class SemanticNodeOperation extends SemanticNodeExpression {
	private static FOLD_UNARY: Map<Punctuator, (z: number) => number> = new Map<Punctuator, (z: number) => number>([
		[Punctuator.AFF, (z) => Number(new Int16(BigInt(z))      .toNumeric())],
		[Punctuator.NEG, (z) => Number(new Int16(BigInt(z)).neg().toNumeric())],
	])
	private static FOLD_BINARY: Map<Punctuator, (x: number, y: number) => number> = new Map<Punctuator, (x: number, y: number) => number>([
		[Punctuator.EXP, (x, y) => Number(new Int16(BigInt(x)).exp    (new Int16(BigInt(y))).toNumeric())],
		[Punctuator.MUL, (x, y) => Number(new Int16(BigInt(x)).times  (new Int16(BigInt(y))).toNumeric())],
		[Punctuator.DIV, (x, y) => Number(new Int16(BigInt(x)).divide (new Int16(BigInt(y))).toNumeric())],
		[Punctuator.ADD, (x, y) => Number(new Int16(BigInt(x)).plus   (new Int16(BigInt(y))).toNumeric())],
		[Punctuator.SUB, (x, y) => Number(new Int16(BigInt(x)).minus  (new Int16(BigInt(y))).toNumeric())],
	])
	constructor(
		start_node: ParseNode,
		private readonly operator: Punctuator,
		readonly children:
			| readonly [SemanticNodeExpression                        ]
			| readonly [SemanticNodeExpression, SemanticNodeExpression]
	) {
		super(start_node, {operator}, children)
	}
	build(generator: CodeGenerator): string {
		const assessment: number | null = this.assess()
		return (assessment !== null)
			? generator.const(assessment)
			: (this.children.length === 1)
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
	assess(): Assessment {
		const assessment0: Assessment = this.children[0].assess()
		if (!assessment0.isDetermined) return new SemanticNodeExpression.Assessment(this)
		if (this.children.length === 1) {
			return new SemanticNodeExpression.Assessment(SemanticNodeOperation.FOLD_UNARY.get(this.operator)!(assessment0.value as number))
		} else {
			const assessment1: Assessment = this.children[1].assess()
			if (!assessment1.isDetermined) return new SemanticNodeExpression.Assessment(this)
			if (this.operator === Punctuator.DIV && assessment1.value === 0) {
				throw new NanError02(this.children[1])
			}
			return new SemanticNodeExpression.Assessment(SemanticNodeOperation.FOLD_BINARY.get(this.operator)!(assessment0.value as number, assessment1.value as number))
		}
	}
}
/**
 * A sematic node representing a statement.
 * There are 3 known subclasses:
 * - SemanticNodeStatementExpression
 * - SemanticNodeDeclaration
 * - SemanticNodeAssignment
 */
export type SemanticStatementType =
	| SemanticNodeStatementExpression
	| SemanticNodeDeclaration
	| SemanticNodeAssignment
export class SemanticNodeStatementExpression extends SemanticNode {
	constructor(
		start_node: ParseNode,
		readonly children:
			| readonly []
			| readonly [SemanticNodeExpression]
	) {
		super(start_node, {}, children)
	}
	build(generator: CodeGenerator): string {
		return (!this.children.length)
			? generator.nop()
			: this.children[0].build(generator)
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
	build(generator: CodeGenerator): string {
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
	build(generator: CodeGenerator): string {
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
	build(generator: CodeGenerator): string {
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
	build(generator: CodeGenerator): string {
		throw new Error('not yet supported.')
	}
}
export class SemanticNodeGoal extends SemanticNode {
	constructor(
		start_node: ParseNode,
		readonly children:
			| readonly []
			| readonly SemanticStatementType[]
	) {
		super(start_node, {}, children)
	}
	build(generator: CodeGenerator): string {
		return (!this.children.length)
			? generator.nop()
			: (this.children as SemanticStatementType[]).map((child) =>
				child.build(generator)
			).join(' ')
	}
}

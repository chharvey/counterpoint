import Util from './Util.class'
import type Serializable from '../iface/Serializable.iface'
import {
	CompletionStructureAssessment,
} from '../spec/CompletionStructure.class'
import type Builder from '../vm/Builder.class'
import SolidLanguageType, {
	SolidTypeUnion,
} from '../vm/SolidLanguageType.class'
import SolidLanguageValue, {
	SolidNull,
	SolidBoolean,
	SolidNumber,
	SolidString,
} from '../vm/SolidLanguageValue.class'
import Int16 from '../vm/Int16.class'
import Float64 from '../vm/Float64.class'
import Instruction, {
	Operator,
	InstructionNone,
	InstructionExpression,
	InstructionConst,
	InstructionUnop,
	InstructionBinop,
	InstructionStatement,
	InstructionModule,
} from '../vm/Instruction.class'
import {
	NanError02,
} from '../error/NanError.class'
import Token, {
	Keyword,
	TokenKeyword,
	TokenIdentifier,
	TokenNumber,
	TokenString,
	TokenTemplate,
} from './Token.class'
import type {CookValueType} from './Token.class'
import type ParseNode from './ParseNode.class'



function isNumericType(t: SolidLanguageType): boolean {
	return t === Int16 || t === Float64 // ([Int16, Float64] as SolidLanguageType[]).includes(t)
}



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
		private readonly attributes: {[key: string]: CookValueType | SolidLanguageValue} = {},
		readonly children: readonly SemanticNode[] = [],
	) {
		this.source       = start_node.source
		this.source_index = start_node.source_index
		this.line_index   = start_node.line_index
		this.col_index    = start_node.col_index
	}

	/**
	 * Give directions to the runtime code builder.
	 * @param builder the builder to direct
	 * @return the directions to print
	 */
	abstract build(builder: Builder): Instruction;

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
		Object.entries<CookValueType | SolidLanguageValue>(this.attributes).forEach(([key, value]) => {
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
	constructor (
		start_node: Token|ParseNode,
		attributes: typeof SemanticNode.prototype['attributes'] = {},
		children: typeof SemanticNode.prototype.children = [],
	) {
		super(start_node, attributes, children)
		this.type() // assert does not throw
	}

	/**
	 * @override
	 * @param to_float Should the returned instruction be type-coersed into a floating-point number?
	 */
	abstract build(builder: Builder, to_float?: boolean): InstructionExpression;
	/**
	 * The Type of this expression.
	 */
	abstract type(): SolidLanguageType;
	/**
	 * Assess the value of this node at compile-time, if possible.
	 * @return the computed value of this node, or a SemanticNode if the value cannot be computed by the compiler
	 */
	abstract assess(): CompletionStructureAssessment | null;
}
export class SemanticNodeConstant extends SemanticNodeExpression {
	declare children:
		| readonly []
	readonly value: string | SolidLanguageValue;
	constructor (start_node: TokenKeyword | TokenNumber | TokenString | TokenTemplate) {
		const cooked: number | bigint | string = start_node.cook()
		const value: string | SolidLanguageValue =
			(start_node instanceof TokenKeyword) ?
				(start_node.source === Keyword.FALSE) ? SolidBoolean.FALSE :
				(start_node.source === Keyword.TRUE ) ? SolidBoolean.TRUE  :
				SolidNull.NULL
			:
			(start_node instanceof TokenNumber) ?
				start_node.isFloat ? new Float64(cooked as number) : new Int16(BigInt(cooked as number))
			:
			cooked
		super(start_node, {value})
		this.value = value
	}
	build(_builder: Builder, to_float: boolean = false): InstructionConst {
		return this.assess().build(to_float)
	}
	type(): SolidLanguageType {
		return (
			(this.value instanceof SolidNull)    ? SolidNull :
			(this.value instanceof SolidBoolean) ? SolidBoolean :
			(this.value instanceof Int16)        ? Int16 :
			(this.value instanceof Float64)      ? Float64 :
			SolidString
		)
	}
	assess(): CompletionStructureAssessment {
		if (this.value instanceof SolidLanguageValue) {
			return new CompletionStructureAssessment(this.value)
		} else {
			throw new Error('not yet supported.')
		}
	}
}
export class SemanticNodeIdentifier extends SemanticNodeExpression {
	declare children:
		| readonly []
	constructor (start_node: TokenIdentifier) {
		const id: bigint | null = start_node.cook()
		super(start_node, {id})
	}
	build(generator: Builder): InstructionExpression {
		throw new Error('not yet supported.')
	}
	type(): SolidLanguageType {
		throw new Error('Not yet supported.')
	}
	assess(): CompletionStructureAssessment {
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
	build(generator: Builder): InstructionExpression {
		throw new Error('not yet supported.')
	}
	type(): SolidLanguageType {
		return SolidString
	}
	assess(): CompletionStructureAssessment {
		throw new Error('Not yet supported.')
	}
}
export class SemanticNodeOperation extends SemanticNodeExpression {
	private static foldUnary<T extends SolidNumber<T>>(op: Operator, z: T): T {
		return new Map<Operator, (z: T) => T>([
			[Operator.AFF, (z) => z      ],
			[Operator.NEG, (z) => z.neg()],
		]).get(op)!(z)
	}
	private static foldBinary<T extends SolidNumber<T>>(op: Operator, x: T, y: T): T {
		return new Map<Operator, (x: T, y: T) => T>([
			[Operator.EXP, (x, y) => x.exp    (y)],
			[Operator.MUL, (x, y) => x.times  (y)],
			[Operator.DIV, (x, y) => x.divide (y)],
			[Operator.ADD, (x, y) => x.plus   (y)],
			[Operator.SUB, (x, y) => x.minus  (y)],
		]).get(op)!(x, y)
	}
	private assessment0:  CompletionStructureAssessment | null = null
	private assessment1?: CompletionStructureAssessment | null;
	private is_folded: boolean = false
	constructor(
		start_node: ParseNode,
		readonly operator: Operator,
		readonly children:
			| readonly [SemanticNodeExpression]
			| readonly [SemanticNodeExpression, SemanticNodeExpression]
			| readonly [SemanticNodeExpression, SemanticNodeExpression, SemanticNodeExpression]
	) {
		super(start_node, {operator}, children)
	}
	build(builder: Builder, to_float: boolean = false): InstructionUnop | InstructionBinop {
		const _to_float: boolean = to_float || this.type() === Float64
		if (!this.is_folded) { this.fold() }
		const operand0: InstructionExpression = (this.assessment0) ? this.assessment0.build(_to_float) : this.children[0].build(builder, _to_float)
		if (this.children.length === 1) {
			return new InstructionUnop(this.operator, operand0)
		} else {
			const operand1: InstructionExpression = (this.assessment1) ? this.assessment1.build(_to_float) : this.children[1].build(builder, _to_float)
			return new InstructionBinop(this.operator, operand0, operand1)
		}
	}
	type(): SolidLanguageType {
		const t0: SolidLanguageType = this.children[0].type()
		const throwErr: () => never = () => { throw new TypeError('Invalid operation.') }
		if (this.children.length === 1) {
			return (isNumericType(t0)) ? t0 : throwErr()
		}
		const t1: SolidLanguageType = this.children[1].type()
		if (this.children.length === 2) {
			return (isNumericType(t0) && isNumericType(t1)) ?
				([t0, t1].includes(Float64)) ? Float64 : Int16
			: throwErr()
		}
		const t2: SolidLanguageType = this.children[2].type()
		return (t0 === SolidBoolean) ? new SolidTypeUnion(t1, t2) : throwErr()
	}
	assess(): CompletionStructureAssessment | null {
		if (!this.is_folded) { this.fold() }
		if (!this.assessment0) return null
		const v0: SolidLanguageValue = this.assessment0.value
		if (this.children.length === 1) {
			return (v0 instanceof SolidNumber)
				? new CompletionStructureAssessment(SemanticNodeOperation.foldUnary(this.operator, v0))
				: (() => { throw new TypeError('Invalid operation.') })()
		} else {
			if (!this.assessment1) return null
			const v1: SolidLanguageValue = this.assessment1.value
			if (this.operator === Operator.DIV && v1 instanceof SolidNumber && v1.eq0()) {
				throw new NanError02(this.children[1])
			}
			return (
				(v0 instanceof Int16       && v1 instanceof Int16)       ? new CompletionStructureAssessment(SemanticNodeOperation.foldBinary(this.operator, v0,           v1))           :
				(v0 instanceof SolidNumber && v1 instanceof SolidNumber) ? new CompletionStructureAssessment(SemanticNodeOperation.foldBinary(this.operator, v0.toFloat(), v1.toFloat())) :
				(() => { throw new TypeError('Invalid operation.') })()
			)
		}
	}
	private fold(): void {
		this.assessment0 = this.children[0].assess()
		if (this.children.length > 1) {
			this.assessment1 = this.children[1]!.assess()
		}
		this.is_folded = true
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
	build(generator: Builder): InstructionNone | InstructionStatement {
		return (!this.children.length)
			? new InstructionNone()
			: generator.stmt(this.children[0])
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
		this.typeCheck()
	}
	build(generator: Builder): Instruction {
		throw new Error('not yet supported.')
	}
	/**
	 * Type-check the node as part of semantic analysis.
	 */
	private typeCheck(): void {
		throw new Error('not yet supported.')
		// const assignedType = this.children[1].type()
	}
}
export class SemanticNodeAssignment extends SemanticNode {
	constructor (
		start_node: ParseNode,
		readonly children:
			| readonly [SemanticNodeAssignee, SemanticNodeAssigned]
	) {
		super(start_node, {}, children)
		this.typeCheck()
	}
	build(generator: Builder): Instruction {
		throw new Error('not yet supported.')
	}
	/**
	 * Type-check the node as part of semantic analysis.
	 */
	private typeCheck(): void {
		throw new Error('not yet supported.')
		// const assignedType = this.children[1].type()
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
	build(generator: Builder): Instruction {
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
	build(generator: Builder): Instruction {
		throw new Error('not yet supported.')
	}
	/**
	 * The Type of the assigned expression.
	 */
	type(): SolidLanguageType {
		return this.children[0].type()
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
	build(generator: Builder): InstructionNone | InstructionModule {
		return (!this.children.length)
			? new InstructionNone()
			: generator.goal(this.children)
	}
}

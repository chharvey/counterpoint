import * as xjs from 'extrajs'

import Util from './Util.class'
import type SolidConfig from '../SolidConfig'
import type Serializable from '../iface/Serializable.iface'
import {
	CompletionType,
	CompletionStructureAssessment,
} from '../spec/CompletionStructure.class'
import type Builder from '../vm/Builder.class'
import SolidLanguageType, {
	SolidTypeConstant,
} from '../vm/SolidLanguageType.class'
import SolidObject  from '../vm/SolidObject.class'
import SolidNull    from '../vm/SolidNull.class'
import SolidBoolean from '../vm/SolidBoolean.class'
import SolidNumber  from '../vm/SolidNumber.class'
import Int16 from '../vm/Int16.class'
import Float64 from '../vm/Float64.class'
import SolidString  from '../vm/SolidString.class'
import Instruction, {
	Operator,
	InstructionNone,
	InstructionExpression,
	InstructionConst,
	InstructionUnop,
	InstructionBinop,
	InstructionCond,
	InstructionStatement,
	InstructionModule,
} from '../vm/Instruction.class'
import {
	NanError01,
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



export type ValidOperatorUnary =
	| Operator.NOT
	| Operator.EMP
	| Operator.NEG
export type ValidOperatorBinary =
	| ValidOperatorArithmetic
	| ValidOperatorComparative
	| ValidOperatorEquality
	| ValidOperatorLogical
export type ValidOperatorArithmetic =
	| Operator.EXP
	| Operator.MUL
	| Operator.DIV
	| Operator.ADD
export type ValidOperatorComparative =
	| Operator.LT
	| Operator.LE
	| Operator.GT
	| Operator.GE
export type ValidOperatorEquality =
	| Operator.IS
	| Operator.EQ
export type ValidOperatorLogical =
	| Operator.AND
	| Operator.OR


/**
 * A SemanticNode holds only the semantics of a {@link ParseNode}.
 */
export default abstract class SemanticNode implements Serializable {
	/** The name of the type of this SemanticNode. */
	protected readonly tagname: string = this.constructor.name.slice('SemanticNode'.length) || 'Unknown'
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
		private readonly attributes: {[key: string]: CookValueType | SolidObject} = {},
		readonly children: readonly SemanticNode[] = [],
	) {
		this.source       = start_node.source
		this.source_index = start_node.source_index
		this.line_index   = start_node.line_index
		this.col_index    = start_node.col_index
	}

	/**
	 * Type-check the node as part of semantic analysis.
	 * @param opts a set of compiler options
	 */
	abstract typeCheck(opts: SolidConfig['compilerOptions']): void;

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
		Object.entries<CookValueType | SolidObject>(this.attributes).forEach(([key, value]) => {
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
	private assessed: CompletionStructureAssessment | null = null
	private typed: SolidLanguageType | null = null
	constructor (
		start_node: Token|ParseNode,
		attributes: typeof SemanticNode.prototype['attributes'] = {},
		children: typeof SemanticNode.prototype.children = [],
	) {
		super(start_node, attributes, children)
	}

	typeCheck(opts: SolidConfig['compilerOptions']): void {
		this.type() // assert does not throw
	}
	/**
	 * @override
	 * @param to_float Should the returned instruction be type-coersed into a floating-point number?
	 * @final
	 */
	build(builder: Builder, to_float?: boolean): InstructionExpression {
		const assess: CompletionStructureAssessment = this.assess(builder.config.compilerOptions.constantFolding)
		return (!assess.isAbrupt) ? assess.build(to_float) : this.build_do(builder, to_float)
	}
	protected abstract build_do(builder: Builder, to_float?: boolean): InstructionExpression;
	/**
	 * Assess the value of this node at compile-time, if possible.
	 * @param const_fold Should this expression be constant-folded at compile-time? (See {@link SolidConfig} for info.)
	 * @return the computed value of this node, or a SemanticNode if the value cannot be computed by the compiler
	 * @final
	 */
	assess(const_fold: boolean = true): CompletionStructureAssessment {
		if (const_fold) {
			this.assessed || (this.assessed = this.assess_do()) // COMBAK `this.assessed ||= this.assess_do()`
			return this.assessed
		}
		return new CompletionStructureAssessment(CompletionType.THROW)
	}
	protected abstract assess_do(): CompletionStructureAssessment
	/**
	 * The Type of this expression.
	 * @final
	 */
	type(): SolidLanguageType {
		if (!this.typed) {
			const type_: SolidLanguageType = this.type_do() // type-check first, to re-throw any TypeErrors
			this.assessed = this.assess()
			this.typed = (this.assessed.isAbrupt) ? type_ : new SolidTypeConstant(this.assessed.value!)
		}
		return this.typed
	}
	protected abstract type_do(): SolidLanguageType;
}
export class SemanticNodeConstant extends SemanticNodeExpression {
	declare children:
		| readonly []
	readonly value: string | SolidObject;
	constructor (start_node: TokenKeyword | TokenNumber | TokenString | TokenTemplate) {
		const cooked: number | bigint | string = start_node.cook()
		const value: string | SolidObject =
			(start_node instanceof TokenKeyword) ?
				(start_node.source === Keyword.FALSE) ? SolidBoolean.FALSE :
				(start_node.source === Keyword.TRUE ) ? SolidBoolean.TRUE  :
				SolidNull.NULL
			:
			(start_node instanceof TokenNumber) ?
				start_node.isFloat ? new Float64(cooked as number) : new Int16(BigInt(cooked as number))
			:
			cooked as string
		super(start_node, {value})
		this.value = value
	}
	/** @implements SemanticNodeExpression */
	protected build_do(_builder: Builder, to_float: boolean = false): InstructionConst {
		return this.assess().build(to_float)
	}
	/** @implements SemanticNodeExpression */
	protected assess_do(): CompletionStructureAssessment {
		if (this.value instanceof SolidObject) {
			return new CompletionStructureAssessment(this.value)
		} else {
			throw new Error('not yet supported.')
		}
	}
	/** @implements SemanticNodeExpression */
	protected type_do(): SolidLanguageType {
		// No need to call `this.assess()` and then unwrap again; just use `this.value`.
		return (
			this.value instanceof SolidNull ||
			this.value instanceof SolidBoolean ||
			this.value instanceof SolidNumber
		) ? new SolidTypeConstant(this.value) : SolidString
	}
}
export class SemanticNodeIdentifier extends SemanticNodeExpression {
	declare children:
		| readonly []
	constructor (start_node: TokenIdentifier) {
		const id: bigint | null = start_node.cook()
		super(start_node, {id})
	}
	/** @implements SemanticNodeExpression */
	protected build_do(builder: Builder): InstructionExpression {
		throw new Error('not yet supported.')
	}
	/** @implements SemanticNodeExpression */
	protected assess_do(): CompletionStructureAssessment {
		throw new Error('Not yet supported.')
	}
	/** @implements SemanticNodeExpression */
	protected type_do(): SolidLanguageType {
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
	/** @implements SemanticNodeExpression */
	protected build_do(builder: Builder): InstructionExpression {
		throw new Error('not yet supported.')
	}
	/** @implements SemanticNodeExpression */
	protected assess_do(): CompletionStructureAssessment {
		throw new Error('Not yet supported.')
	}
	/** @implements SemanticNodeExpression */
	protected type_do(): SolidLanguageType {
		return SolidString
	}
}
export abstract class SemanticNodeOperation extends SemanticNodeExpression {
	/** @override */
	protected readonly tagname: string = 'Operation' // TODO remove after refactoring tests using `#serialize`
	constructor(
		start_node: ParseNode,
		readonly operator: Operator,
		readonly children:
			| readonly SemanticNodeExpression[]
	) {
		super(start_node, {operator}, children)
	}
}
export class SemanticNodeOperationUnary extends SemanticNodeOperation {
	constructor(
		start_node: ParseNode,
		readonly operator: ValidOperatorUnary,
		readonly children:
			| readonly [SemanticNodeExpression]
	) {
		super(start_node, operator, children)
	}
	/** @implements SemanticNodeExpression */
	protected build_do(builder: Builder, to_float: boolean = false): InstructionUnop {
		return new InstructionUnop(
			this.operator,
			this.children[0].build(builder, to_float),
		)
	}
	/** @implements SemanticNodeExpression */
	protected assess_do(): CompletionStructureAssessment {
		const assess0: CompletionStructureAssessment = this.children[0].assess()
		if (assess0.isAbrupt) {
			return assess0
		}
		const v0: SolidObject = assess0.value!
		return new CompletionStructureAssessment(
			(this.operator === Operator.NOT) ? v0.isTruthy.not :
			(this.operator === Operator.EMP) ? v0.isTruthy.not.or(SolidBoolean.fromBoolean(v0 instanceof SolidNumber && v0.eq0())) :
			(this.operator === Operator.NEG) ? this.foldNumeric(v0 as SolidNumber<any>) :
			(() => { throw new Error(`Operator ${ Operator[this.operator] } not found.`) })()
		)
	}
	/** @implements SemanticNodeExpression */
	protected type_do(): SolidLanguageType {
		if ([Operator.NOT, Operator.EMP].includes(this.operator)) {
			return SolidBoolean
		}
		const t0: SolidLanguageType = this.children[0].type()
		return (t0.isNumericType) ? t0 : (() => { throw new TypeError('Invalid operation.') })()
	}
	private foldNumeric<T extends SolidNumber<T>>(z: T): T {
		try {
			return new Map<Operator, (z: T) => T>([
				[Operator.AFF, (z) => z],
				[Operator.NEG, (z) => z.neg()],
			]).get(this.operator)!(z)
		} catch (err) {
			if (err instanceof xjs.NaNError) {
				throw new NanError01(this)
			} else {
				throw err
			}
		}
	}
}
export abstract class SemanticNodeOperationBinary extends SemanticNodeOperation {
	constructor(
		start_node: ParseNode,
		readonly operator: ValidOperatorBinary,
		readonly children:
			| readonly [SemanticNodeExpression, SemanticNodeExpression]
	) {
		super(start_node, operator, children)
	}
	/**
	 * @implements SemanticNodeExpression
	 * @final
	 */
	protected build_do(builder: Builder, to_float: boolean = false): InstructionBinop {
		const tofloat: boolean = to_float || this.build_do_tofloat
		return new InstructionBinop(
			this.operator,
			this.children[0].build(builder, tofloat),
			this.children[1].build(builder, tofloat),
		)
	}
	protected get build_do_tofloat(): boolean {
		return this.children[0].type().isFloatType || this.children[1].type().isFloatType
	}
	/**
	 * @implements SemanticNodeExpression
	 * @final
	 */
	protected type_do(): SolidLanguageType {
		return this.type_do_do(this.children[0].type(), this.children[1].type())
	}
	protected abstract type_do_do(t0: SolidLanguageType, t1: SolidLanguageType): SolidLanguageType;
}
export class SemanticNodeOperationBinaryArithmetic extends SemanticNodeOperationBinary {
	constructor (
		start_node: ParseNode,
		readonly operator: ValidOperatorArithmetic,
		children: readonly [SemanticNodeExpression, SemanticNodeExpression]
	) {
		super(start_node, operator, children)
	}
	/** @implements SemanticNodeExpression */
	protected assess_do(): CompletionStructureAssessment {
		const assess0: CompletionStructureAssessment = this.children[0].assess()
		if (assess0.isAbrupt) {
			return assess0
		}
		const assess1: CompletionStructureAssessment = this.children[1].assess()
		if (assess1.isAbrupt) {
			return assess1
		}
		const [v0, v1]: [SolidObject, SolidObject] = [assess0.value!, assess1.value!]
		if (this.operator === Operator.DIV && v1 instanceof SolidNumber && v1.eq0()) {
			throw new NanError02(this.children[1])
		}
		return (v0 instanceof SolidNumber && v1 instanceof SolidNumber) ? new CompletionStructureAssessment(
			(v0 instanceof Int16 && v1 instanceof Int16)
				? this.foldNumeric(v0, v1)
				: this.foldNumeric(
					(v0 as SolidNumber).toFloat(),
					(v1 as SolidNumber).toFloat(),
				)
		) : (() => { throw new TypeError('Both operands must be of type `SolidNumber`.') })()
	}
	/** @implements SemanticNodeOperationBinary */
	protected type_do_do(t0: SolidLanguageType, t1: SolidLanguageType): SolidLanguageType {
		return (t0.isNumericType && t1.isNumericType)
			? (t0.isFloatType || t1.isFloatType) ? Float64 : Int16
			: (() => { throw new TypeError('Invalid operation.') })()
	}
	private foldNumeric<T extends SolidNumber<T>>(x: T, y: T): T {
		try {
			return new Map<Operator, (x: T, y: T) => T>([
				[Operator.EXP, (x, y) => x.exp(y)],
				[Operator.MUL, (x, y) => x.times(y)],
				[Operator.DIV, (x, y) => x.divide(y)],
				[Operator.ADD, (x, y) => x.plus(y)],
				// [Operator.SUB, (x, y) => x.minus(y)],
			]).get(this.operator)!(x, y)
		} catch (err) {
			if (err instanceof xjs.NaNError) {
				throw new NanError01(this)
			} else {
				throw err
			}
		}
	}
}
export class SemanticNodeOperationBinaryComparative extends SemanticNodeOperationBinary {
	constructor (
		start_node: ParseNode,
		readonly operator: ValidOperatorComparative,
		children: readonly [SemanticNodeExpression, SemanticNodeExpression]
	) {
		super(start_node, operator, children)
	}
	/** @implements SemanticNodeExpression */
	protected assess_do(): CompletionStructureAssessment {
		const assess0: CompletionStructureAssessment = this.children[0].assess()
		if (assess0.isAbrupt) {
			return assess0
		}
		const assess1: CompletionStructureAssessment = this.children[1].assess()
		if (assess1.isAbrupt) {
			return assess1
		}
		const [v0, v1]: [SolidObject, SolidObject] = [assess0.value!, assess1.value!]
		return (v0 instanceof SolidNumber && v1 instanceof SolidNumber) ? new CompletionStructureAssessment(
			(v0 instanceof Int16 && v1 instanceof Int16)
				? this.foldComparative(v0, v1)
				: this.foldComparative(
					(v0 as SolidNumber).toFloat(),
					(v1 as SolidNumber).toFloat(),
				)
		) : (() => { throw new TypeError('Both operands must be of type `SolidNumber`.') })()
	}
	/** @implements SemanticNodeOperationBinary */
	protected type_do_do(t0: SolidLanguageType, t1: SolidLanguageType): SolidLanguageType {
		return (t0.isNumericType && t1.isNumericType)
			? SolidBoolean
			: (() => { throw new TypeError('Invalid operation.') })()
	}
	private foldComparative<T extends SolidNumber<T>>(x: T, y: T): SolidBoolean {
		return SolidBoolean.fromBoolean(new Map<Operator, (x: T, y: T) => boolean>([
			[Operator.LT, (x, y) => x.lt(y)],
			[Operator.GT, (x, y) => y.lt(x)],
			[Operator.LE, (x, y) => x.equal(y) || x.lt(y)],
			[Operator.GE, (x, y) => x.equal(y) || y.lt(x)],
			// [Operator.NLT, (x, y) => !x.lt(y)],
			// [Operator.NGT, (x, y) => !y.lt(x)],
		]).get(this.operator)!(x, y))
	}
}
export class SemanticNodeOperationBinaryEquality extends SemanticNodeOperationBinary {
	constructor (
		start_node: ParseNode,
		readonly operator: ValidOperatorEquality,
		children: readonly [SemanticNodeExpression, SemanticNodeExpression]
	) {
		super(start_node, operator, children)
	}
	/** @override */
	protected get build_do_tofloat(): boolean {
		return this.operator === Operator.EQ && super.build_do_tofloat
	}
	/** @implements SemanticNodeExpression */
	protected assess_do(): CompletionStructureAssessment {
		const assess0: CompletionStructureAssessment = this.children[0].assess()
		if (assess0.isAbrupt) {
			return assess0
		}
		const assess1: CompletionStructureAssessment = this.children[1].assess()
		if (assess1.isAbrupt) {
			return assess1
		}
		const [v0, v1]: [SolidObject, SolidObject] = [assess0.value!, assess1.value!]
		return (v1 instanceof SolidObject)
			? new CompletionStructureAssessment(this.foldEquality(v0, v1))
			: (() => { throw new TypeError('Both operands must be of type `SolidObject`.') })()
	}
	/** @implements SemanticNodeOperationBinary */
	protected type_do_do(t0: SolidLanguageType, t1: SolidLanguageType): SolidLanguageType {
		// If `a` and `b` are of disjoint numeric types, then `a is b` will always return `false`.
		if (this.operator === Operator.IS) {
			if (
				t0.isNumericType && t1.isNumericType &&
				(t0.isFloatType && !t1.isFloatType || !t0.isFloatType && t1.isFloatType)
			) {
				return new SolidTypeConstant(SolidBoolean.FALSE)
			}
		}
		return SolidBoolean
	}
	private foldEquality(x: SolidObject, y: SolidObject): SolidBoolean {
		return SolidBoolean.fromBoolean(new Map<Operator, (x: SolidObject, y: SolidObject) => boolean>([
			[Operator.IS, (x, y) => x.identical(y)],
			[Operator.EQ, (x, y) => x.equal(y)],
			// [Operator.ISNT, (x, y) => !x.identical(y)],
			// [Operator.NEQ,  (x, y) => !x.equal(y)],
		]).get(this.operator)!(x, y))
	}
}
export class SemanticNodeOperationBinaryLogical extends SemanticNodeOperationBinary {
	constructor (
		start_node: ParseNode,
		readonly operator: ValidOperatorLogical,
		children: readonly [SemanticNodeExpression, SemanticNodeExpression]
	) {
		super(start_node, operator, children)
	}
	/** @implements SemanticNodeExpression */
	protected assess_do(): CompletionStructureAssessment {
		const assess0: CompletionStructureAssessment = this.children[0].assess()
		if (assess0.isAbrupt) {
			return assess0
		}
		const v0: SolidObject = assess0.value!
		if (
			this.operator === Operator.AND && !v0.isTruthy.value ||
			this.operator === Operator.OR  &&  v0.isTruthy.value
		) {
			return new CompletionStructureAssessment(v0)
		}
		return this.children[1].assess()
	}
	/** @implements SemanticNodeOperationBinary */
	protected type_do_do(t0: SolidLanguageType, t1: SolidLanguageType): SolidLanguageType {
		// If `a` is of type `null` or `false`, then `typeof (a && b)` is `typeof a`.
		// If `a` is of type `null` or `false`, then `typeof (a || b)` is `typeof b`.
		return (t0 instanceof SolidTypeConstant && ([SolidNull.NULL, SolidBoolean.FALSE] as SolidObject[]).includes(t0.value))
			? (this.operator === Operator.AND) ? t0 : t1
			: t0.union(t1)
	}
}
export class SemanticNodeOperationTernary extends SemanticNodeOperation {
	constructor(
		start_node: ParseNode,
		readonly operator: Operator.COND,
		readonly children:
			| readonly [SemanticNodeExpression, SemanticNodeExpression, SemanticNodeExpression]
	) {
		super(start_node, operator, children)
	}
	/** @implements SemanticNodeExpression */
	protected build_do(builder: Builder, to_float: boolean = false): InstructionCond {
		const _to_float: boolean = to_float || this.children[1].type().isFloatType || this.children[2].type().isFloatType
		return new InstructionCond(
			this.children[0].build(builder, false),
			this.children[1].build(builder, _to_float),
			this.children[2].build(builder, _to_float),
		)
	}
	/** @implements SemanticNodeExpression */
	protected assess_do(): CompletionStructureAssessment {
		const assess0: CompletionStructureAssessment = this.children[0].assess()
		if (assess0.isAbrupt) {
			return assess0
		}
		return (assess0.value! === SolidBoolean.TRUE)
			? this.children[1].assess()
			: this.children[2].assess()
	}
	/** @implements SemanticNodeExpression */
	protected type_do(): SolidLanguageType {
		// If `a` is of type `false`, then `typeof (if a then b else c)` is `typeof c`.
		// If `a` is of type `true`,  then `typeof (if a then b else c)` is `typeof b`.
		const t0: SolidLanguageType = this.children[0].type()
		const t1: SolidLanguageType = this.children[1].type()
		const t2: SolidLanguageType = this.children[2].type()
		return (t0.isBooleanType)
			? (t0 instanceof SolidTypeConstant)
				? (t0.value === SolidBoolean.FALSE) ? t2 : t1
				: t1.union(t2)
			: (() => { throw new TypeError('Invalid operation.') })()
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
	typeCheck(opts: SolidConfig['compilerOptions']): void {
		this.children[0] && this.children[0].typeCheck(opts) // assert does not throw // COMBAK this.children[0]?.type()
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
	}
	typeCheck(opts: SolidConfig['compilerOptions']): void {
		throw new Error('not yet supported.')
		// const assignedType = this.children[1].type()
	}
	build(generator: Builder): Instruction {
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
	typeCheck(opts: SolidConfig['compilerOptions']): void {
		throw new Error('not yet supported.')
		// const assignedType = this.children[1].type()
	}
	build(generator: Builder): Instruction {
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
	typeCheck(opts: SolidConfig['compilerOptions']): void {
		throw new Error('not yet supported.')
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
	typeCheck(opts: SolidConfig['compilerOptions']): void {
		this.type() // assert does not throw
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
	typeCheck(opts: SolidConfig['compilerOptions']): void {
		this.children.forEach((child) => {
			child.typeCheck(opts)
		})
	}
	build(generator: Builder): InstructionNone | InstructionModule {
		return (!this.children.length)
			? new InstructionNone()
			: generator.goal(this.children)
	}
}

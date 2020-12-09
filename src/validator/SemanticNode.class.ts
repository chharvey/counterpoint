import {
	Serializable,
	Token,
	ParseNode,
	ASTNode,
} from '@chharvey/parser';
import * as xjs from 'extrajs'

import Util from '../class/Util.class'
import Operator, {
	ValidTypeOperator,
	ValidOperatorUnary,
	ValidOperatorBinary,
	ValidOperatorArithmetic,
	ValidOperatorComparative,
	ValidOperatorEquality,
	ValidOperatorLogical,
} from '../enum/Operator.enum'
import Validator, {
	SymbolInfo,
} from './Validator.class';
import {
	CompletionType,
	CompletionStructureAssessment,
} from './CompletionStructure.class'
import SolidLanguageType, {
	SolidTypeConstant,
} from './SolidLanguageType.class'
import SolidObject  from './SolidObject.class'
import SolidNull    from './SolidNull.class'
import SolidBoolean from './SolidBoolean.class'
import SolidNumber  from './SolidNumber.class'
import Int16        from './Int16.class'
import Float64      from './Float64.class'
import SolidString  from './SolidString.class'
import {
	Builder,
	Instruction,
	InstructionNone,
	InstructionExpression,
	InstructionConst,
	InstructionUnop,
	InstructionBinopArithmetic,
	InstructionBinopComparative,
	InstructionBinopEquality,
	InstructionBinopLogical,
	InstructionCond,
	InstructionStatement,
	InstructionModule,
} from '../builder/'
import {
	ReferenceError01,
} from '../error/SolidReferenceError.class';
import {
	AssignmentError01,
	AssignmentError10,
} from '../error/AssignmentError.class';
import {
	TypeError01,
	TypeError03,
} from '../error/SolidTypeError.class'
import {
	NanError01,
	NanError02,
} from '../error/NanError.class'
import {
	Keyword,
	CookValueType,
	TOKEN,
} from '../parser/';



function bothNumeric(t0: SolidLanguageType, t1: SolidLanguageType): boolean {
	return t0.isSubtypeOf(SolidNumber) && t1.isSubtypeOf(SolidNumber)
}
function eitherFloats(t0: SolidLanguageType, t1: SolidLanguageType): boolean {
	return t0.isSubtypeOf(Float64) || t1.isSubtypeOf(Float64)
}
function bothFloats(t0: SolidLanguageType, t1: SolidLanguageType): boolean {
	return t0.isSubtypeOf(Float64) && t1.isSubtypeOf(Float64)
}
function neitherFloats(t0: SolidLanguageType, t1: SolidLanguageType): boolean {
	return !eitherFloats(t0, t1)
}
function oneFloats(t0: SolidLanguageType, t1: SolidLanguageType): boolean {
	return !neitherFloats(t0, t1) && !bothFloats(t0, t1)
}



export abstract class SemanticNodeSolid extends ASTNode {
	/**
	 * Construct a new SemanticNodeSolid object.
	 *
	 * @param start_node - The initial node in the parse tree to which this SemanticNode corresponds.
	 * @param children   - The set of child inputs that creates this SemanticNode.
	 * @param attributes - Any other attributes to attach.
	 */
	constructor(
		start_node: Token|ParseNode,
		attributes: {[key: string]: CookValueType | SolidObject} = {},
		children: readonly SemanticNodeSolid[] = [],
	) {
		super(start_node, attributes, children)
	}

	/**
	 * Perform definite assignment phase of semantic analysis:
	 * - Check that all variables have been assigned before being used.
	 * - Check that no varaible is declared more than once.
	 * - Check that fixed variables are not reassigned.
	 * @param validator a record of declared variable symbols
	 */
	abstract varCheck(validator?: Validator): void;

	/**
	 * Type-check the node as part of semantic analysis.
	 * @param validator stores validation information
	 */
	abstract typeCheck(validator?: Validator): void;

	/**
	 * Give directions to the runtime code builder.
	 * @param builder the builder to direct
	 * @return the directions to print
	 */
	abstract build(builder: Builder): Instruction;
}



/**
 * A sematic node representing a type.
 * There are 2 known subclasses:
 * - SemanticNodeTypeConstant
 * - SemanticNodeTypeOperation
 */
export abstract class SemanticNodeType extends SemanticNodeSolid {
	private assessed: SolidLanguageType | null = null
	/** @implements SemanticNodeSolid */
	varCheck(_validator: Validator = new Validator()): void {
		return; // for now, there are no type variables // TODO: dereferencing type variables
	}
	/** @implements SemanticNodeSolid */
	typeCheck(_validator: Validator = new Validator()): void {
		return; // for now, all types are valid // TODO: dereferencing type variables
	}
	/**
	 * @implements SemanticNodeSolid
	 * @final
	 */
	build(_builder: Builder): InstructionNone {
		return new InstructionNone()
	}
	/**
	 * Assess the type-value of this node at compile-time.
	 * @returns the computed type-value of this node
	 * @final
	 */
	assess(): SolidLanguageType {
		this.assessed || (this.assessed = this.assess_do()) // COMBAK `this.assessed ||= this.assess_do()`
		return this.assessed
	}
	protected abstract assess_do(): SolidLanguageType
}
export class SemanticNodeTypeConstant extends SemanticNodeType {
	declare children:
		| readonly []
	readonly value: SolidLanguageType;
	constructor (start_node: TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString) {
		const value: SolidLanguageType =
			(start_node instanceof TOKEN.TokenKeyword) ?
				(start_node.source === Keyword.BOOL)  ? SolidBoolean :
				(start_node.source === Keyword.FALSE) ? SolidBoolean.FALSETYPE :
				(start_node.source === Keyword.TRUE ) ? SolidBoolean.TRUETYPE :
				(start_node.source === Keyword.INT)   ? Int16 :
				(start_node.source === Keyword.FLOAT) ? Float64 :
				(start_node.source === Keyword.OBJ)   ? SolidObject :
				SolidNull
			: (start_node instanceof TOKEN.TokenNumber) ?
				new SolidTypeConstant(
					start_node.isFloat
						? new Float64(start_node.cook())
						: new Int16(BigInt(start_node.cook()))
				)
			: SolidString
		super(start_node, {value: value.toString()})
		this.value = value
	}
	/** @implements SemanticNodeType */
	protected assess_do(): SolidLanguageType {
		return this.value
	}
}
export abstract class SemanticNodeTypeOperation extends SemanticNodeType {
	constructor (
		start_node: ParseNode,
		readonly operator: ValidTypeOperator,
		readonly children:
			| readonly SemanticNodeType[]
	) {
		super(start_node, {operator}, children)
	}
}
export class SemanticNodeTypeOperationUnary extends SemanticNodeTypeOperation {
	constructor (
		start_node: ParseNode,
		operator: ValidTypeOperator,
		readonly children:
			| readonly [SemanticNodeType]
	) {
		super(start_node, operator, children)
	}
	/** @implements SemanticNodeType */
	protected assess_do(): SolidLanguageType {
		return (this.operator === Operator.ORNULL)
			? this.children[0].assess().union(SolidNull)
			: (() => { throw new Error(`Operator ${ Operator[this.operator] } not found.`) })()
	}
}
export class SemanticNodeTypeOperationBinary extends SemanticNodeTypeOperation {
	constructor (
		start_node: ParseNode,
		operator: ValidTypeOperator,
		readonly children:
			| readonly [SemanticNodeType, SemanticNodeType]
	) {
		super(start_node, operator, children)
	}
	/** @implements SemanticNodeType */
	protected assess_do(): SolidLanguageType {
		return (
			(this.operator === Operator.AND) ? this.children[0].assess().intersect(this.children[1].assess()) :
			(this.operator === Operator.OR)  ? this.children[0].assess().union    (this.children[1].assess()) :
			(() => { throw new Error(`Operator ${ Operator[this.operator] } not found.`) })()
		)
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
export abstract class SemanticNodeExpression extends SemanticNodeSolid {
	private assessed: CompletionStructureAssessment | null = null
	/**
	 * Determine whether this expression should build to a float-type instruction.
	 * @return Should the built instruction be type-coerced into a floating-point number?
	 */
	abstract get shouldFloat(): boolean;
	/** @implements SemanticNodeSolid */
	typeCheck(validator: Validator = new Validator()): void {
		this.type(validator); // assert does not throw
	}
	/**
	 * @implements SemanticNodeSolid
	 * @param to_float Should the returned instruction be type-coerced into a floating-point number?
	 * @final
	 */
	build(builder: Builder, to_float?: boolean): InstructionExpression {
		const assess: CompletionStructureAssessment | null = (builder.config.compilerOptions.constantFolding) ? this.assess() : null
		return (assess && !assess.isAbrupt) ? assess.build(to_float) : this.build_do(builder, to_float)
	}
	protected abstract build_do(builder: Builder, to_float?: boolean): InstructionExpression;
	/**
	 * Assess the value of this node at compile-time, if possible.
	 * If {@link SolidConfig|constant folding} is off, this should not be called.
	 * @return the computed value of this node, or an abrupt completion if the value cannot be computed by the compiler
	 * @final
	 */
	assess(): CompletionStructureAssessment {
		this.assessed || (this.assessed = this.assess_do()) // COMBAK `this.assessed ||= this.assess_do()`
		return this.assessed
	}
	protected abstract assess_do(): CompletionStructureAssessment
	/**
	 * The Type of this expression.
	 * @param validator stores validation and configuration information
	 * @return the compile-time type of this node
	 * @final
	 */
	type(validator: Validator = new Validator()): SolidLanguageType {
		const type_: SolidLanguageType = this.type_do(validator); // type-check first, to re-throw any TypeErrors
		if (validator.config.compilerOptions.constantFolding) {
			this.assessed || (this.assessed = this.assess()); // COMBAK `this.assessed ||= this.assess()`
			if (!this.assessed.isAbrupt) {
				return new SolidTypeConstant(this.assessed.value!)
			}
		}
		return type_
	}
	protected abstract type_do(validator: Validator): SolidLanguageType;
}
export class SemanticNodeConstant extends SemanticNodeExpression {
	declare children:
		| readonly []
	readonly value: string | SolidObject;
	constructor (start_node: TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString | TOKEN.TokenTemplate) {
		const value: string | SolidObject =
			(start_node instanceof TOKEN.TokenKeyword) ?
				(start_node.source === Keyword.FALSE) ? SolidBoolean.FALSE :
				(start_node.source === Keyword.TRUE ) ? SolidBoolean.TRUE  :
				SolidNull.NULL
			:
			(start_node instanceof TOKEN.TokenNumber) ?
				start_node.isFloat ? new Float64(start_node.cook()) : new Int16(BigInt(start_node.cook()))
			:
			start_node.cook()
		super(start_node, {value})
		this.value = value
	}
	/** @implements SemanticNodeExpression */
	get shouldFloat(): boolean {
		return this.value instanceof Float64
	}
	/** @implements SemanticNodeSolid */
	varCheck(_validator: Validator = new Validator()): void {
		return; // no validation necessary for constants
	}
	/** @implements SemanticNodeExpression */
	protected build_do(_builder: Builder, to_float: boolean = false): InstructionConst {
		return this.assess_do().build(to_float)
	}
	/** @implements SemanticNodeExpression */
	protected assess_do(): CompletionStructureAssessment {
		if (this.value instanceof SolidObject) {
			return new CompletionStructureAssessment(this.value)
		} else {
			throw new Error('SemanticNodeConstant[value:string]#assess_do not yet supported.')
		}
	}
	/** @implements SemanticNodeExpression */
	protected type_do(validator: Validator): SolidLanguageType {
		// No need to call `this.assess()` and then unwrap again; just use `this.value`.
		return (validator.config.compilerOptions.constantFolding && (
			this.value instanceof SolidNull ||
			this.value instanceof SolidBoolean ||
			this.value instanceof SolidNumber
		)) ? new SolidTypeConstant(this.value) :
		(this.value instanceof SolidNull)    ? SolidNull :
		(this.value instanceof SolidBoolean) ? SolidBoolean :
		(this.value instanceof Int16)        ? Int16 :
		(this.value instanceof Float64)      ? Float64 :
		SolidString
	}
}
export class SemanticNodeIdentifier extends SemanticNodeExpression {
	declare children:
		| readonly []
	readonly id: bigint;
	constructor (start_node: TOKEN.TokenIdentifier) {
		super(start_node, {id: start_node.cook()})
		this.id = start_node.cook()!;
	}
	/** @implements SemanticNodeExpression */
	get shouldFloat(): boolean {
		return this.type().isSubtypeOf(Float64);
	}
	/** @implements SemanticNodeSolid */
	varCheck(validator: Validator = new Validator()): void {
		if (!validator.hasSymbol(this.id)) {
			throw new ReferenceError01(this);
		};
	}
	/** @implements SemanticNodeExpression */
	protected build_do(_builder: Builder): InstructionExpression {
		throw new Error('SemanticNodeIdentifier#build_do not yet supported.')
	}
	/** @implements SemanticNodeExpression */
	protected assess_do(): CompletionStructureAssessment {
		return new CompletionStructureAssessment(CompletionType.THROW); // TODO #35 : constant propagation
	}
	/** @implements SemanticNodeExpression */
	protected type_do(validator: Validator): SolidLanguageType {
		return (validator.hasSymbol(this.id))
			? validator.getSymbolInfo(this.id)!.type
			: SolidLanguageType.UNKNOWN
		;
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
	get shouldFloat(): boolean {
		throw new Error('SemanticNodeTemplate#shouldFloat not yet supported.')
	}
	/** @implements SemanticNodeSolid */
	varCheck(validator: Validator = new Validator()): void {
		return this.children.forEach((c) => c.varCheck(validator));
	}
	/** @implements SemanticNodeExpression */
	protected build_do(_builder: Builder): InstructionExpression {
		throw new Error('SemanticNodeTemplate#build_do not yet supported.')
	}
	/** @implements SemanticNodeExpression */
	protected assess_do(): CompletionStructureAssessment {
		throw new Error('SemanticNodeTemplate#assess_do not yet supported.')
	}
	/** @implements SemanticNodeExpression */
	protected type_do(_validator: Validator): SolidLanguageType {
		return SolidString
	}
}
export abstract class SemanticNodeOperation extends SemanticNodeExpression {
	/** @override */
	readonly tagname: string = 'Operation' // TODO remove after refactoring tests using `#serialize`
	constructor(
		start_node: ParseNode,
		operator: Operator,
		readonly children:
			| readonly SemanticNodeExpression[]
	) {
		super(start_node, {operator}, children)
	}
	/**
	 * @implements SemanticNodeSolid
	 * @final
	 */
	varCheck(validator: Validator = new Validator()): void {
		return this.children.forEach((c) => c.varCheck(validator));
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
	get shouldFloat(): boolean {
		return this.children[0].shouldFloat
	}
	/** @implements SemanticNodeExpression */
	protected build_do(builder: Builder, to_float: boolean = false): InstructionUnop {
		const tofloat: boolean = to_float || this.shouldFloat
		return new InstructionUnop(
			this.operator,
			this.children[0].build(builder, tofloat),
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
			(() => { throw new ReferenceError(`Operator ${ Operator[this.operator] } not found.`) })()
		)
	}
	/** @implements SemanticNodeExpression */
	protected type_do(validator: Validator): SolidLanguageType {
		if ([Operator.NOT, Operator.EMP].includes(this.operator)) {
			return SolidBoolean
		}
		const t0: SolidLanguageType = this.children[0].type(validator);
		return (t0.isSubtypeOf(SolidNumber)) ? t0 : (() => { throw new TypeError01(this) })()
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
	/** @implements SemanticNodeExpression */
	get shouldFloat(): boolean {
		return this.children[0].shouldFloat || this.children[1].shouldFloat
	}
	/**
	 * @implements SemanticNodeExpression
	 * @final
	 */
	protected type_do(validator: Validator): SolidLanguageType {
		return this.type_do_do(
			this.children[0].type(validator),
			this.children[1].type(validator),
			validator.config.compilerOptions.intCoercion,
		)
	}
	protected abstract type_do_do(t0: SolidLanguageType, t1: SolidLanguageType, int_coercion: boolean): SolidLanguageType;
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
	protected build_do(builder: Builder, to_float: boolean = false): InstructionBinopArithmetic {
		const tofloat: boolean = to_float || this.shouldFloat
		return new InstructionBinopArithmetic(
			this.operator,
			this.children[0].build(builder, tofloat),
			this.children[1].build(builder, tofloat),
		)
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
		if (!(v0 instanceof SolidNumber) || !(v1 instanceof SolidNumber)) {
			// using an internal TypeError, not a SolidTypeError, as it should already be valid per `this#type`
			throw new TypeError('Both operands must be of type `SolidNumber`.')
		}
		return new CompletionStructureAssessment(
			(v0 instanceof Int16 && v1 instanceof Int16)
				? this.foldNumeric(v0, v1)
				: this.foldNumeric(
					(v0 as SolidNumber).toFloat(),
					(v1 as SolidNumber).toFloat(),
				)
		)
	}
	/** @implements SemanticNodeOperationBinary */
	protected type_do_do(t0: SolidLanguageType, t1: SolidLanguageType, int_coercion: boolean): SolidLanguageType {
		if (bothNumeric(t0, t1)) {
			if (int_coercion) {
				return (eitherFloats(t0, t1)) ? Float64 : Int16
			}
			if (bothFloats   (t0, t1)) { return Float64 }
			if (neitherFloats(t0, t1)) { return Int16 }
		}
		throw new TypeError01(this)
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
	protected build_do(builder: Builder, to_float: boolean = false): InstructionBinopComparative {
		const tofloat: boolean = to_float || this.shouldFloat
		return new InstructionBinopComparative(
			this.operator,
			this.children[0].build(builder, tofloat),
			this.children[1].build(builder, tofloat),
		)
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
		if (!(v0 instanceof SolidNumber) || !(v1 instanceof SolidNumber)) {
			// using an internal TypeError, not a SolidTypeError, as it should already be valid per `this#type`
			throw new TypeError('Both operands must be of type `SolidNumber`.')
		}
		return new CompletionStructureAssessment(
			(v0 instanceof Int16 && v1 instanceof Int16)
				? this.foldComparative(v0, v1)
				: this.foldComparative(
					(v0 as SolidNumber).toFloat(),
					(v1 as SolidNumber).toFloat(),
				)
		)
	}
	/** @implements SemanticNodeOperationBinary */
	protected type_do_do(t0: SolidLanguageType, t1: SolidLanguageType, int_coercion: boolean): SolidLanguageType {
		if (bothNumeric(t0, t1) && (int_coercion || (
			bothFloats(t0, t1) || neitherFloats(t0, t1)
		))) {
			return SolidBoolean
		}
		throw new TypeError01(this)
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
	get shouldFloat(): boolean {
		return this.operator === Operator.EQ && super.shouldFloat
	}
	/** @implements SemanticNodeExpression */
	protected build_do(builder: Builder, _to_float: boolean = false): InstructionBinopEquality {
		const tofloat: boolean = builder.config.compilerOptions.intCoercion && this.shouldFloat
		return new InstructionBinopEquality(
			this.operator,
			this.children[0].build(builder, tofloat),
			this.children[1].build(builder, tofloat),
		)
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
		return new CompletionStructureAssessment(this.foldEquality(v0, v1))
	}
	/** @implements SemanticNodeOperationBinary */
	protected type_do_do(t0: SolidLanguageType, t1: SolidLanguageType, int_coercion: boolean): SolidLanguageType {
		// If `a` and `b` are of disjoint numeric types, then `a is b` will always return `false`.
		// If `a` and `b` are of disjoint numeric types, then `a == b` will return `false` when `intCoercion` is off.
		if (bothNumeric(t0, t1)) {
			if (oneFloats(t0, t1) && (this.operator === Operator.IS || !int_coercion)) {
				return SolidBoolean.FALSETYPE
			}
			return SolidBoolean
		}
		if (t0.intersect(t1).isEmpty) {
			return SolidBoolean.FALSETYPE
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
	protected build_do(builder: Builder, to_float: boolean = false): InstructionBinopLogical {
		const tofloat: boolean = to_float || this.shouldFloat
		return new InstructionBinopLogical(
			builder.varCount,
			this.operator,
			this.children[0].build(builder, tofloat),
			this.children[1].build(builder, tofloat),
		)
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
	protected type_do_do(t0: SolidLanguageType, t1: SolidLanguageType, _int_coercion: boolean): SolidLanguageType {
		const null_union_false: SolidLanguageType = SolidNull.union(SolidBoolean.FALSETYPE);
		function truthifyType(t: SolidLanguageType): SolidLanguageType {
			const values: Set<SolidObject> = new Set(t.values);
			values.delete(SolidNull.NULL);
			values.delete(SolidBoolean.FALSE);
			return [...values].map<SolidLanguageType>((v) => new SolidTypeConstant(v)).reduce((a, b) => a.union(b));
		}
		return (this.operator === Operator.AND)
			? (t0.isSubtypeOf(null_union_false))
				? t0
				: (t0.includes(SolidNull.NULL))
					? (t0.includes(SolidBoolean.FALSE))
						? null_union_false.union(t1)
						: SolidNull.union(t1)
					: (t0.includes(SolidBoolean.FALSE))
						? SolidBoolean.FALSETYPE.union(t1)
						: t1
			: (t0.isSubtypeOf(null_union_false))
				? t1
				: (t0.includes(SolidNull.NULL) || t0.includes(SolidBoolean.FALSE))
					? truthifyType(t0).union(t1)
					: t0
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
	get shouldFloat(): boolean {
		return this.children[1].shouldFloat || this.children[2].shouldFloat
	}
	/** @implements SemanticNodeExpression */
	protected build_do(builder: Builder, to_float: boolean = false): InstructionCond {
		const tofloat: boolean = to_float || this.shouldFloat
		return new InstructionCond(
			this.children[0].build(builder, false),
			this.children[1].build(builder, tofloat),
			this.children[2].build(builder, tofloat),
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
	protected type_do(validator: Validator): SolidLanguageType {
		// If `a` is of type `false`, then `typeof (if a then b else c)` is `typeof c`.
		// If `a` is of type `true`,  then `typeof (if a then b else c)` is `typeof b`.
		const t0: SolidLanguageType = this.children[0].type(validator);
		const t1: SolidLanguageType = this.children[1].type(validator);
		const t2: SolidLanguageType = this.children[2].type(validator);
		return (t0.isSubtypeOf(SolidBoolean))
			? (t0 instanceof SolidTypeConstant)
				? (t0.value === SolidBoolean.FALSE) ? t2 : t1
				: t1.union(t2)
			: (() => { throw new TypeError01(this) })()
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
	| SemanticNodeDeclarationVariable
	| SemanticNodeAssignment
export class SemanticNodeStatementExpression extends SemanticNodeSolid {
	constructor(
		start_node: ParseNode,
		readonly children:
			| readonly []
			| readonly [SemanticNodeExpression]
	) {
		super(start_node, {}, children)
	}
	/** @implements SemanticNodeSolid */
	varCheck(validator: Validator = new Validator()): void {
		return this.children.forEach((c) => c.varCheck(validator));
	}
	/** @implements SemanticNodeSolid */
	typeCheck(validator: Validator = new Validator()): void {
		return this.children[0]?.typeCheck(validator);
	}
	/** @implements SemanticNodeSolid */
	build(builder: Builder): InstructionNone | InstructionStatement {
		return (!this.children.length)
			? new InstructionNone()
			: new InstructionStatement(builder.stmtCount, this.children[0].build(builder))
	}
}
export class SemanticNodeDeclarationVariable extends SemanticNodeSolid {
	constructor (
		start_node: ParseNode,
		readonly unfixed: boolean,
		readonly children:
			| readonly [SemanticNodeAssignee, SemanticNodeType, SemanticNodeExpression]
	) {
		super(start_node, {unfixed}, children)
	}
	/** @implements SemanticNodeSolid */
	varCheck(validator: Validator = new Validator()): void {
		const assignee:   SemanticNodeAssignee   = this.children[0];
		const identifier: SemanticNodeIdentifier = assignee.children[0];
		const assignee_type: SolidLanguageType   = this.children[1].assess();
		if (validator.hasSymbol(identifier.id)) {
			throw new AssignmentError01(identifier);
		};
		validator.addSymbol(
			identifier.id,
			assignee_type,
			this.unfixed,
			assignee.line_index,
			assignee.col_index,
		);
		return this.children[2].varCheck(validator);
	}
	/** @implements SemanticNodeSolid */
	typeCheck(validator: Validator = new Validator()): void {
		const assignee_type: SolidLanguageType = this.children[1].assess()
		const assigned_type: SolidLanguageType = this.children[2].type(validator);
		if (
			assigned_type.isSubtypeOf(assignee_type) ||
			validator.config.compilerOptions.intCoercion && assigned_type.isSubtypeOf(Int16) && Float64.isSubtypeOf(assignee_type)
		) {
		} else {
			throw new TypeError03(this, assignee_type, assigned_type)
		}
	}
	/** @implements SemanticNodeSolid */
	build(_builder: Builder): Instruction {
		throw new Error('SemanticNodeDeclaration#build not yet supported.')
	}
}
export class SemanticNodeAssignment extends SemanticNodeSolid {
	constructor (
		start_node: ParseNode,
		readonly children:
			| readonly [SemanticNodeAssignee, SemanticNodeExpression]
	) {
		super(start_node, {}, children)
	}
	/** @implements SemanticNodeSolid */
	varCheck(validator: Validator = new Validator()): void {
		return this.children.forEach((c) => c.varCheck(validator));
	}
	/** @implements SemanticNodeSolid */
	typeCheck(validator: Validator = new Validator()): void {
		const assignee_type: SolidLanguageType = this.children[0].children[0].type(validator);
		const assigned_type: SolidLanguageType = this.children[1].type(validator);
		if (
			assigned_type.isSubtypeOf(assignee_type) ||
			validator.config.compilerOptions.intCoercion && assigned_type.isSubtypeOf(Int16) && Float64.isSubtypeOf(assignee_type)
		) {
		} else {
			throw new TypeError03(this, assignee_type, assigned_type);
		};
	}
	/** @implements SemanticNodeSolid */
	build(_builder: Builder): Instruction {
		throw new Error('SemanticNodeAssignment#build not yet supported.')
	}
}
export class SemanticNodeAssignee extends SemanticNodeSolid {
	constructor(
		start_node: Token,
		readonly children:
			| readonly [SemanticNodeIdentifier]
	) {
		super(start_node, {}, children)
	}
	/** @implements SemanticNodeSolid */
	varCheck(validator: Validator = new Validator()): void {
		const identifier: SemanticNodeIdentifier = this.children[0];
		identifier.varCheck(validator);
		const info: SymbolInfo = validator.getSymbolInfo(identifier.id) as SymbolInfo;
		if (!info.unfixed) {
			throw new AssignmentError10(identifier);
		};
	}
	/** @implements SemanticNodeSolid */
	typeCheck(validator: Validator = new Validator()): void {
		return this.children[0].typeCheck(validator);
	}
	/** @implements SemanticNodeSolid */
	build(_builder: Builder): Instruction {
		throw new Error('SemanticNodeAssignee#build not yet supported.')
	}
}
export class SemanticNodeGoal extends SemanticNodeSolid {
	constructor(
		start_node: ParseNode,
		readonly children:
			| readonly []
			| readonly SemanticStatementType[]
	) {
		super(start_node, {}, children)
	}
	/** @implements SemanticNodeSolid */
	varCheck(validator: Validator = new Validator()): void {
		return this.children.forEach((c) => c.varCheck(validator));
	}
	/** @implements SemanticNodeSolid */
	typeCheck(validator: Validator = new Validator()): void {
		return this.children.forEach((child) => child.typeCheck(validator));
	}
	/** @implements SemanticNodeSolid */
	build(builder: Builder): InstructionNone | InstructionModule {
		return (!this.children.length)
			? new InstructionNone()
			: new InstructionModule([
				...Builder.IMPORTS,
				...(this.children as readonly SemanticStatementType[]).map((child) => child.build(builder)),
			])
	}
}

import {
	Token,
	ParseNode,
	ASTNode,
	NonemptyArray,
} from '@chharvey/parser';
import * as assert from 'assert';
import * as xjs from 'extrajs'
import {
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
} from '../core/index.js';
import {
	Keyword,
	TOKEN,
	PARSER,
	ParserSolid as Parser,
} from '../parser/index.js';
import {
	SolidType,
	SolidTypeConstant,
	SolidTypeTuple,
	SolidTypeRecord,
	SolidTypeMapping,
	SolidObject,
	SolidNull,
	SolidBoolean,
	SolidNumber,
	Int16,
	Float64,
	SolidString,
	SolidTuple,
	SolidRecord,
	SolidMapping,
} from '../typer/index.js';
import {
	Builder,
	Instruction,
	INST,
} from '../builder/index.js';
import {
	ReferenceError01,
	ReferenceError03,
	AssignmentError01,
	AssignmentError10,
	TypeError01,
	TypeError03,
	NanError01,
	NanError02,
} from '../error/index.js';
import {
	Operator,
	ValidTypeOperator,
	ValidOperatorUnary,
	ValidOperatorBinary,
	ValidOperatorArithmetic,
	ValidOperatorComparative,
	ValidOperatorEquality,
	ValidOperatorLogical,
} from './Operator.js';
import {Decorator} from './Decorator.js';
import {Validator} from './Validator.js';
import {
	SymbolKind,
	SymbolStructure,
	SymbolStructureVar,
	SymbolStructureType,
} from './SymbolStructure.js';



function bothNumeric(t0: SolidType, t1: SolidType): boolean {
	return t0.isSubtypeOf(SolidNumber) && t1.isSubtypeOf(SolidNumber)
}
function eitherFloats(t0: SolidType, t1: SolidType): boolean {
	return t0.isSubtypeOf(Float64) || t1.isSubtypeOf(Float64)
}
function bothFloats(t0: SolidType, t1: SolidType): boolean {
	return t0.isSubtypeOf(Float64) && t1.isSubtypeOf(Float64)
}
function neitherFloats(t0: SolidType, t1: SolidType): boolean {
	return !eitherFloats(t0, t1)
}
function oneFloats(t0: SolidType, t1: SolidType): boolean {
	return !neitherFloats(t0, t1) && !bothFloats(t0, t1)
}



export abstract class ASTNodeSolid extends ASTNode {
	/**
	 * Construct a new ASTNodeSolid object.
	 *
	 * @param start_node - The initial node in the parse tree to which this ASTNode corresponds.
	 * @param children   - The set of child inputs that creates this ASTNode.
	 * @param attributes - Any other attributes to attach.
	 */
	constructor(
		start_node: Token|ParseNode,
		attributes: {[key: string]: unknown} = {},
		override readonly children: readonly ASTNodeSolid[] = [],
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
	varCheck(validator: Validator): void {
		return this.children.forEach((c) => c.varCheck(validator));
	}

	/**
	 * Type-check the node as part of semantic analysis.
	 * @param validator stores validation information
	 */
	typeCheck(validator: Validator): void {
		return this.children.forEach((c) => c.typeCheck(validator));
	}

	/**
	 * Give directions to the runtime code builder.
	 * @param builder the builder to direct
	 * @return the directions to print
	 */
	abstract build(builder: Builder): Instruction;
}



export class ASTNodeKey extends ASTNodeSolid {
	declare readonly children: readonly [];
	readonly id: bigint;
	constructor (start_node: TOKEN.TokenKeyword | TOKEN.TokenIdentifier) {
		super(start_node, {id: start_node.cook()});
		this.id = start_node.cook()!;
	}
	override build(builder: Builder): Instruction {
		throw builder && 'ASTNodeKey#build not yet supported.';
	}
}
export class ASTNodePropertyType extends ASTNodeSolid {
	constructor (
		start_node: PARSER.ParseNodePropertyType,
		override readonly children: readonly [ASTNodeKey, ASTNodeType],
	) {
		super(start_node, {}, children);
	}
	override build(builder: Builder): Instruction {
		throw builder && 'ASTNodePropertyType#build not yet supported.';
	}
}
export class ASTNodeIndex extends ASTNodeSolid {
	constructor (
		start_node: PARSER.ParseNodePropertyAccess,
		override readonly children: readonly [ASTNodeConstant],
	) {
		super(start_node, {}, children);
	}
	override build(builder: Builder): Instruction {
		throw builder && 'ASTNodeIndex#build not yet supported.';
	}
}
export class ASTNodeProperty extends ASTNodeSolid {
	constructor (
		start_node: PARSER.ParseNodeProperty,
		override readonly children: readonly [ASTNodeKey, ASTNodeExpression],
	) {
		super(start_node, {}, children);
	}
	override build(builder: Builder): Instruction {
		throw builder && 'ASTNodeProperty#build not yet supported.';
	}
}
export class ASTNodeCase extends ASTNodeSolid {
	constructor (
		start_node: PARSER.ParseNodeCase,
		override readonly children: [ASTNodeExpression, ASTNodeExpression],
	) {
		super(start_node, {}, children);
	}
	override build(builder: Builder): Instruction {
		throw builder && 'ASTNodeCase#build not yet supported.';
	}
}
/**
 * A sematic node representing a type.
 * Known subclasses:
 * - ASTNodeTypeConstant
 * - ASTNodeTypeAlias
 * - ASTNodeTypeTuple
 * - ASTNodeTypeRecord
 * - ASTNodeTypeOperation
 */
export abstract class ASTNodeType extends ASTNodeSolid {
	/**
	 * Construct a new ASTNodeType from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeType representing the given source
	 */
	static fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeType {
		const statement: ASTNodeDeclarationType = ASTNodeDeclarationType.fromSource(`type T = ${ src };`, config);
		return statement.children[1];
	}
	private assessed?: SolidType;
	/**
	 * @final
	 */
	override typeCheck(_validator: Validator): void {
		return; // no type-checking necessary
	}
	/**
	 * @final
	 */
	override build(_builder: Builder): INST.InstructionNone {
		return new INST.InstructionNone();
	}
	/**
	 * Assess the type-value of this node at compile-time.
	 * @param validator a record of declared variable symbols
	 * @returns the computed type-value of this node
	 * @final
	 */
	assess(validator: Validator): SolidType {
		return this.assessed ||= this.assess_do(validator);
	}
	protected abstract assess_do(validator: Validator): SolidType;
}
export class ASTNodeTypeConstant extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeConstant {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeConstant);
		return typ;
	}
	declare readonly children: readonly [];
	readonly value: SolidType;
	constructor (start_node: TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString) {
		const value: SolidType =
			(start_node instanceof TOKEN.TokenKeyword) ?
				(start_node.source === Keyword.BOOL)  ? SolidBoolean :
				(start_node.source === Keyword.FALSE) ? SolidBoolean.FALSETYPE :
				(start_node.source === Keyword.TRUE ) ? SolidBoolean.TRUETYPE :
				(start_node.source === Keyword.INT)   ? Int16 :
				(start_node.source === Keyword.FLOAT) ? Float64 :
				(start_node.source === Keyword.STR)   ? SolidString :
				(start_node.source === Keyword.OBJ)   ? SolidObject :
				SolidNull
			: (start_node instanceof TOKEN.TokenNumber) ?
				new SolidTypeConstant(
					start_node.isFloat
						? new Float64(start_node.cook())
						: new Int16(BigInt(start_node.cook()))
				)
			: SolidNull;
		super(start_node, {value});
		this.value = value
	}
	protected override assess_do(_validator: Validator): SolidType {
		return this.value
	}
}
export class ASTNodeTypeAlias extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeAlias {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeAlias);
		return typ;
	}
	declare readonly children: readonly [];
	readonly id: bigint;
	constructor (start_node: TOKEN.TokenIdentifier) {
		super(start_node, {id: start_node.cook()})
		this.id = start_node.cook()!;
	}
	override varCheck(validator: Validator): void {
		if (!validator.hasSymbol(this.id)) {
			throw new ReferenceError01(this);
		};
		if (validator.getSymbolInfo(this.id)! instanceof SymbolStructureVar) {
			throw new ReferenceError03(this, SymbolKind.VALUE, SymbolKind.TYPE);
		};
	}
	protected override assess_do(validator: Validator): SolidType {
		if (validator.hasSymbol(this.id)) {
			const symbol: SymbolStructure = validator.getSymbolInfo(this.id)!;
			if (symbol instanceof SymbolStructureType) {
				return symbol.value;
			};
		};
		return SolidType.UNKNOWN;
	}
}
export class ASTNodeTypeTuple extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeTuple {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeTuple);
		return typ;
	}
	constructor (
		start_node: PARSER.ParseNodeTypeTupleLiteral,
		override readonly children: readonly ASTNodeType[],
	) {
		super(start_node, {}, children);
	}
	protected override assess_do(validator: Validator): SolidType {
		return new SolidTypeTuple(this.children.map((c) => c.assess(validator)));
	}
}
export class ASTNodeTypeRecord extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeRecord {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeRecord);
		return typ;
	}
	constructor (
		start_node: PARSER.ParseNodeTypeRecordLiteral,
		override readonly children: Readonly<NonemptyArray<ASTNodePropertyType>>,
	) {
		super(start_node, {}, children);
	}
	protected override assess_do(validator: Validator): SolidType {
		return new SolidTypeRecord(new Map(this.children.map((c) => [
			c.children[0].id,
			c.children[1].assess(validator),
		])));
	}
}
export abstract class ASTNodeTypeOperation extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeOperation {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeOperation);
		return typ;
	}
	constructor (
		start_node: ParseNode,
		readonly operator: ValidTypeOperator,
		override readonly children: Readonly<NonemptyArray<ASTNodeType>>,
	) {
		super(start_node, {operator}, children)
	}
}
export class ASTNodeTypeOperationUnary extends ASTNodeTypeOperation {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeOperationUnary {
		const typ: ASTNodeTypeOperation = ASTNodeTypeOperation.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeOperationUnary);
		return typ;
	}
	constructor (
		start_node: ParseNode,
		operator: ValidTypeOperator,
		override readonly children: readonly [ASTNodeType],
	) {
		super(start_node, operator, children)
	}
	protected override assess_do(validator: Validator): SolidType {
		return (this.operator === Operator.ORNULL)
			? this.children[0].assess(validator).union(SolidNull)
			: (() => { throw new Error(`Operator ${ Operator[this.operator] } not found.`) })()
	}
}
export class ASTNodeTypeOperationBinary extends ASTNodeTypeOperation {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeOperationBinary {
		const typ: ASTNodeTypeOperation = ASTNodeTypeOperation.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeOperationBinary);
		return typ;
	}
	constructor (
		start_node: ParseNode,
		operator: ValidTypeOperator,
		override readonly children: readonly [ASTNodeType, ASTNodeType],
	) {
		super(start_node, operator, children)
	}
	protected override assess_do(validator: Validator): SolidType {
		return (
			(this.operator === Operator.AND) ? this.children[0].assess(validator).intersect(this.children[1].assess(validator)) :
			(this.operator === Operator.OR)  ? this.children[0].assess(validator).union    (this.children[1].assess(validator)) :
			(() => { throw new Error(`Operator ${ Operator[this.operator] } not found.`) })()
		)
	}
}
/**
 * A sematic node representing an expression.
 * Known subclasses:
 * - ASTNodeConstant
 * - ASTNodeVariable
 * - ASTNodeTemplate
 * - ASTNodeTuple
 * - ASTNodeRecord
 * - ASTNodeMapping
 * - ASTNodeAccess
 * - ASTNodeOperation
 */
export abstract class ASTNodeExpression extends ASTNodeSolid {
	/**
	 * Construct a new ASTNodeExpression from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeExpression representing the given source
	 */
	static fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeExpression {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeStatementExpression);
		assert.strictEqual(statement.children.length, 1, 'semantic statement should have 1 child');
		return statement.children[0]!;
	}
	private typed?: SolidType;
	private assessed?: SolidObject | null;
	/**
	 * Determine whether this expression should build to a float-type instruction.
	 * @return Should the built instruction be type-coerced into a floating-point number?
	 */
	abstract get shouldFloat(): boolean;
	/**
	 * @final
	 */
	override typeCheck(validator: Validator): void {
		this.type(validator); // assert does not throw
	}
	/**
	 * @param to_float Should the returned instruction be type-coerced into a floating-point number?
	 * @final
	 */
	override build(builder: Builder, to_float?: boolean): INST.InstructionExpression {
		const assessed: SolidObject | null = (builder.config.compilerOptions.constantFolding) ? this.assess(builder.validator) : null;
		return (!!assessed) ? INST.InstructionConst.fromAssessment(assessed, to_float) : this.build_do(builder, to_float);
	}
	protected abstract build_do(builder: Builder, to_float?: boolean): INST.InstructionExpression;
	/**
	 * The Type of this expression.
	 * @param validator stores validation and configuration information
	 * @return the compile-time type of this node
	 * @final
	 */
	type(validator: Validator): SolidType {
		if (!this.typed) {
			this.typed = this.type_do(validator); // type-check first, to re-throw any TypeErrors
			if (validator.config.compilerOptions.constantFolding) {
				const assessed: SolidObject | null = this.assess(validator);
				if (!!assessed) {
					this.typed = new SolidTypeConstant(assessed);
				};
			};
		};
		return this.typed;
	}
	protected abstract type_do(validator: Validator): SolidType;
	/**
	 * Assess the value of this node at compile-time, if possible.
	 * If {@link SolidConfig|constant folding} is off, this should not be called.
	 * @param validator stores validation and configuration information
	 * @return the computed value of this node, or an abrupt completion if the value cannot be computed by the compiler
	 * @final
	 */
	assess(validator: Validator): SolidObject | null {
		return this.assessed ||= this.assess_do(validator);
	}
	protected abstract assess_do(validator: Validator): SolidObject | null;
}
export class ASTNodeConstant extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeConstant {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeConstant);
		return expression;
	}
	declare readonly children: readonly [];
	readonly value: SolidObject;
	constructor (start_node: TOKEN.TokenKeyword | TOKEN.TokenNumber | TOKEN.TokenString | TOKEN.TokenTemplate) {
		const value: SolidObject =
			(start_node instanceof TOKEN.TokenKeyword) ?
				(start_node.source === Keyword.FALSE) ? SolidBoolean.FALSE :
				(start_node.source === Keyword.TRUE ) ? SolidBoolean.TRUE  :
				SolidNull.NULL
			:
			(start_node instanceof TOKEN.TokenNumber) ?
				start_node.isFloat ? new Float64(start_node.cook()) : new Int16(BigInt(start_node.cook()))
			:
			(Dev.supports('literalString-cook')) ? new SolidString(start_node.cook()) : (() => { throw new Error('`literalString-cook` not yet supported.'); })();
		super(start_node, {value})
		this.value = value
	}
	override get shouldFloat(): boolean {
		return this.value instanceof Float64
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionConst {
		return INST.InstructionConst.fromAssessment(this.assess_do(builder.validator), to_float);
	}
	protected override type_do(validator: Validator): SolidType {
		// No need to call `this.assess(validator)` and then unwrap again; just use `this.value`.
		return (validator.config.compilerOptions.constantFolding) ? new SolidTypeConstant(this.value) :
		(this.value instanceof SolidNull)    ? SolidNull :
		(this.value instanceof SolidBoolean) ? SolidBoolean :
		(this.value instanceof Int16)        ? Int16 :
		(this.value instanceof Float64)      ? Float64 :
		(Dev.supports('stringConstant-assess') && this.value instanceof SolidString)  ? SolidString :
		SolidObject
	}
	protected override assess_do(_validator: Validator): SolidObject {
		if (this.value instanceof SolidString && !Dev.supports('stringConstant-assess')) {
			throw new Error('`stringConstant-assess` not yet supported.');
		};
		return this.value;
	}
}
export class ASTNodeVariable extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeVariable {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeVariable);
		return expression;
	}
	declare readonly children: readonly [];
	readonly id: bigint;
	constructor (start_node: TOKEN.TokenIdentifier) {
		super(start_node, {id: start_node.cook()})
		this.id = start_node.cook()!;
	}
	override get shouldFloat(): boolean {
		return this.type(new Validator()).isSubtypeOf(Float64);
	}
	override varCheck(validator: Validator): void {
		if (!validator.hasSymbol(this.id)) {
			throw new ReferenceError01(this);
		};
		if (validator.getSymbolInfo(this.id)! instanceof SymbolStructureType) {
			throw new ReferenceError03(this, SymbolKind.TYPE, SymbolKind.VALUE);
			// TODO: When Type objects are allowed as runtime values, this should be removed and checked by the type checker (`this#typeCheck`).
		};
	}
	protected override build_do(_builder: Builder, to_float: boolean = false): INST.InstructionGlobalGet {
		return new INST.InstructionGlobalGet(this.id, to_float || this.shouldFloat);
	}
	protected override type_do(validator: Validator): SolidType {
		if (validator.hasSymbol(this.id)) {
			const symbol: SymbolStructure = validator.getSymbolInfo(this.id)!;
			if (symbol instanceof SymbolStructureVar) {
				return symbol.type;
			};
		};
		return SolidType.UNKNOWN;
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		if (validator.hasSymbol(this.id)) {
			const symbol: SymbolStructure = validator.getSymbolInfo(this.id)!;
			if (symbol instanceof SymbolStructureVar && !symbol.unfixed) {
				return symbol.value;
			};
		};
		return null;
	}
}
export class ASTNodeTemplate extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTemplate {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeTemplate);
		return expression;
	}
	constructor(
		start_node: ParseNode,
		override readonly children: // FIXME spread types
			| readonly [ASTNodeConstant]
			| readonly [ASTNodeConstant,                                                           ASTNodeConstant]
			| readonly [ASTNodeConstant, ASTNodeExpression,                                        ASTNodeConstant]
			// | readonly [ASTNodeConstant,                    ...ASTNodeTemplatePartialChildrenType, ASTNodeConstant]
			// | readonly [ASTNodeConstant, ASTNodeExpression, ...ASTNodeTemplatePartialChildrenType, ASTNodeConstant]
			| readonly ASTNodeExpression[]
		,
	) {
		super(start_node, {}, children)
	}
	override get shouldFloat(): boolean {
		throw new Error('ASTNodeTemplate#shouldFloat not yet supported.');
	}
	protected override build_do(_builder: Builder): INST.InstructionExpression {
		throw new Error('ASTNodeTemplate#build_do not yet supported.');
	}
	protected override type_do(_validator: Validator): SolidType {
		return SolidString
	}
	protected override assess_do(validator: Validator): SolidString | null {
		const concat: string | null = [...this.children].map((expr) => {
			const assessed: SolidObject | null = expr.assess(validator);
			return assessed && assessed.toString();
		}).reduce((accum, value) => ([accum, value].includes(null)) ? null : accum!.concat(value!), '');
		return (concat === null) ? null : new SolidString(concat);
	}
}
export class ASTNodeTuple extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTuple {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeTuple);
		return expression;
	}
	constructor (
		start_node: PARSER.ParseNodeTupleLiteral,
		override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, {}, children);
	}
	override get shouldFloat(): boolean {
		throw 'ASTNodeTuple#shouldFloat not yet supported.';
	}
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeTuple#build_do not yet supported.';
	}
	protected override type_do(validator: Validator): SolidType {
		return new SolidTypeTuple(this.children.map((c) => c.type(validator)));
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const items: readonly (SolidObject | null)[] = this.children.map((c) => c.assess(validator));
		return (items.includes(null))
			? null
			: new SolidTuple<SolidObject>(items as SolidObject[]);
	}
}
export class ASTNodeRecord extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeRecord {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeRecord);
		return expression;
	}
	constructor (
		start_node: PARSER.ParseNodeRecordLiteral,
		override readonly children: Readonly<NonemptyArray<ASTNodeProperty>>,
	) {
		super(start_node, {}, children);
	}
	override get shouldFloat(): boolean {
		throw 'ASTNodeRecord#shouldFloat not yet supported.';
	}
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeRecord#build_do not yet supported.';
	}
	protected override type_do(validator: Validator): SolidType {
		return new SolidTypeRecord(new Map(this.children.map((c) => [
			c.children[0].id,
			c.children[1].type(validator),
		])));
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const properties: ReadonlyMap<bigint, SolidObject | null> = new Map(this.children.map((c) => [
			c.children[0].id,
			c.children[1].assess(validator),
		]));
		return ([...properties].map((p) => p[1]).includes(null))
			? null
			: new SolidRecord<SolidObject>(properties as ReadonlyMap<bigint, SolidObject>);
	}
}
export class ASTNodeMapping extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeMapping {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeMapping);
		return expression;
	}
	constructor (
		start_node: PARSER.ParseNodeMappingLiteral,
		override readonly children: Readonly<NonemptyArray<ASTNodeCase>>,
	) {
		super(start_node, {}, children);
	}
	override get shouldFloat(): boolean {
		throw 'ASTNodeMapping#shouldFloat not yet supported.';
	}
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeMapping#build_do not yet supported.';
	}
	protected override type_do(validator: Validator): SolidType {
		this.children.forEach((c) => c.typeCheck(validator)); // TODO: use forEachAggregated
		return new SolidTypeMapping(
			this.children.map((c) => c.children[0].type(validator)).reduce((a, b) => a.union(b)),
			this.children.map((c) => c.children[1].type(validator)).reduce((a, b) => a.union(b)),
		);
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const cases: ReadonlyMap<SolidObject | null, SolidObject | null> = new Map(this.children.map((c) => [
			c.children[0].assess(validator),
			c.children[1].assess(validator),
		]));
		return ([...cases].some((c) => c[0] === null || c[1] === null))
			? null
			: new SolidMapping<SolidObject, SolidObject>(cases as ReadonlyMap<SolidObject, SolidObject>);
	}
}
export class ASTNodeAccess extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeAccess {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeAccess);
		return expression;
	}
	constructor (
		start_node: PARSER.ParseNodeExpressionCompound,
		override readonly children: readonly [ASTNodeExpression, ASTNodeIndex | ASTNodeKey | ASTNodeExpression],
	) {
		super(start_node, {}, children);
	}
	override get shouldFloat(): boolean {
		throw 'ASTNodeAccess#shouldFloat not yet supported.';
	}
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeAccess#build_do not yet supported.';
	}
	protected override type_do(validator: Validator): SolidType {
		throw validator && 'ASTNodeAccess#type_do not yet supported.';
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		throw validator && 'ASTNodeAccess#assess_do not yet supported.';
	}
}
export abstract class ASTNodeOperation extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperation {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperation);
		return expression;
	}
	override readonly tagname: string = 'Operation' // TODO remove after refactoring tests using `#serialize`
	constructor(
		start_node: ParseNode,
		operator: Operator,
		override readonly children: Readonly<NonemptyArray<ASTNodeExpression>>,
	) {
		super(start_node, {operator}, children)
	}
}
export class ASTNodeOperationUnary extends ASTNodeOperation {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationUnary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationUnary);
		return expression;
	}
	constructor(
		start_node: ParseNode,
		readonly operator: ValidOperatorUnary,
		override readonly children: readonly [ASTNodeExpression],
	) {
		super(start_node, operator, children)
	}
	override get shouldFloat(): boolean {
		return this.children[0].shouldFloat
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionUnop {
		const tofloat: boolean = to_float || this.shouldFloat
		return new INST.InstructionUnop(
			this.operator,
			this.children[0].build(builder, tofloat),
		)
	}
	protected override type_do(validator: Validator): SolidType {
		const t0: SolidType = this.children[0].type(validator);
		return (
			(this.operator === Operator.NOT) ? (
				(t0.isSubtypeOf(SolidNull.union(SolidBoolean.FALSETYPE))) ? SolidBoolean.TRUETYPE :
				(SolidNull.isSubtypeOf(t0) || SolidBoolean.FALSETYPE.isSubtypeOf(t0)) ? SolidBoolean :
				SolidBoolean.FALSETYPE
			) :
			(this.operator === Operator.EMP) ? SolidBoolean :
			/* (this.operator === Operator.NEG) */ (t0.isSubtypeOf(SolidNumber)) ? t0 : (() => { throw new TypeError01(this); })()
		);
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const assess0: SolidObject | null = this.children[0].assess(validator);
		if (!assess0) {
			return assess0
		}
		const v0: SolidObject = assess0;
		return (
			(this.operator === Operator.NOT) ? v0.isTruthy.not :
			(this.operator === Operator.EMP) ? v0.isTruthy.not.or(v0.isEmpty) :
			(this.operator === Operator.NEG) ? this.foldNumeric(v0 as SolidNumber<any>) :
			(() => { throw new ReferenceError(`Operator ${ Operator[this.operator] } not found.`) })()
		)
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
export abstract class ASTNodeOperationBinary extends ASTNodeOperation {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationBinary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinary);
		return expression;
	}
	constructor(
		start_node: ParseNode,
		readonly operator: ValidOperatorBinary,
		override readonly children: readonly [ASTNodeExpression, ASTNodeExpression],
	) {
		super(start_node, operator, children)
	}
	override get shouldFloat(): boolean {
		return this.children[0].shouldFloat || this.children[1].shouldFloat
	}
	/**
	 * @final
	 */
	protected override type_do(validator: Validator): SolidType {
		return this.type_do_do(
			this.children[0].type(validator),
			this.children[1].type(validator),
			validator.config.compilerOptions.intCoercion,
		)
	}
	protected abstract type_do_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType;
}
export class ASTNodeOperationBinaryArithmetic extends ASTNodeOperationBinary {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryArithmetic {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinaryArithmetic);
		return expression;
	}
	constructor (
		start_node: ParseNode,
		override readonly operator: ValidOperatorArithmetic,
		children: readonly [ASTNodeExpression, ASTNodeExpression],
	) {
		super(start_node, operator, children)
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionBinopArithmetic {
		const tofloat: boolean = to_float || this.shouldFloat
		return new INST.InstructionBinopArithmetic(
			this.operator,
			this.children[0].build(builder, tofloat),
			this.children[1].build(builder, tofloat),
		)
	}
	protected override type_do_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType {
		if (bothNumeric(t0, t1)) {
			if (int_coercion) {
				return (eitherFloats(t0, t1)) ? Float64 : Int16
			}
			if (bothFloats   (t0, t1)) { return Float64 }
			if (neitherFloats(t0, t1)) { return Int16 }
		}
		throw new TypeError01(this)
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const assess0: SolidObject | null = this.children[0].assess(validator);
		if (!assess0) {
			return assess0
		}
		const assess1: SolidObject | null = this.children[1].assess(validator);
		if (!assess1) {
			return assess1
		}
		const [v0, v1]: [SolidObject, SolidObject] = [assess0, assess1];
		if (this.operator === Operator.DIV && v1 instanceof SolidNumber && v1.eq0()) {
			throw new NanError02(this.children[1])
		}
		if (!(v0 instanceof SolidNumber) || !(v1 instanceof SolidNumber)) {
			// using an internal TypeError, not a SolidTypeError, as it should already be valid per `this#type`
			throw new TypeError('Both operands must be of type `SolidNumber`.')
		}
		return (
			(v0 instanceof Int16 && v1 instanceof Int16)
				? this.foldNumeric(v0, v1)
				: this.foldNumeric(
					(v0 as SolidNumber).toFloat(),
					(v1 as SolidNumber).toFloat(),
				)
		)
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
export class ASTNodeOperationBinaryComparative extends ASTNodeOperationBinary {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryComparative {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinaryComparative);
		return expression;
	}
	constructor (
		start_node: ParseNode,
		override readonly operator: ValidOperatorComparative,
		children: readonly [ASTNodeExpression, ASTNodeExpression],
	) {
		super(start_node, operator, children)
		if ([Operator.IS, Operator.ISNT].includes(this.operator)) {
			throw new TypeError(`Operator ${ this.operator } not yet supported.`);
		}
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionBinopComparative {
		const tofloat: boolean = to_float || this.shouldFloat
		return new INST.InstructionBinopComparative(
			this.operator,
			this.children[0].build(builder, tofloat),
			this.children[1].build(builder, tofloat),
		)
	}
	protected override type_do_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType {
		if (bothNumeric(t0, t1) && (int_coercion || (
			bothFloats(t0, t1) || neitherFloats(t0, t1)
		))) {
			return SolidBoolean
		}
		throw new TypeError01(this)
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const assess0: SolidObject | null = this.children[0].assess(validator);
		if (!assess0) {
			return assess0
		}
		const assess1: SolidObject | null = this.children[1].assess(validator);
		if (!assess1) {
			return assess1
		}
		const [v0, v1]: [SolidObject, SolidObject] = [assess0, assess1];
		if (!(v0 instanceof SolidNumber) || !(v1 instanceof SolidNumber)) {
			// using an internal TypeError, not a SolidTypeError, as it should already be valid per `this#type`
			throw new TypeError('Both operands must be of type `SolidNumber`.')
		}
		return (
			(v0 instanceof Int16 && v1 instanceof Int16)
				? this.foldComparative(v0, v1)
				: this.foldComparative(
					(v0 as SolidNumber).toFloat(),
					(v1 as SolidNumber).toFloat(),
				)
		)
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
export class ASTNodeOperationBinaryEquality extends ASTNodeOperationBinary {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryEquality {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinaryEquality);
		return expression;
	}
	constructor (
		start_node: ParseNode,
		override readonly operator: ValidOperatorEquality,
		children: readonly [ASTNodeExpression, ASTNodeExpression],
	) {
		super(start_node, operator, children)
	}
	override get shouldFloat(): boolean {
		return this.operator === Operator.EQ && super.shouldFloat
	}
	protected override build_do(builder: Builder, _to_float: boolean = false): INST.InstructionBinopEquality {
		const tofloat: boolean = builder.config.compilerOptions.intCoercion && this.shouldFloat
		return new INST.InstructionBinopEquality(
			this.operator,
			this.children[0].build(builder, tofloat),
			this.children[1].build(builder, tofloat),
		)
	}
	protected override type_do_do(t0: SolidType, t1: SolidType, int_coercion: boolean): SolidType {
		// If `a` and `b` are of disjoint numeric types, then `a is b` will always return `false`.
		// If `a` and `b` are of disjoint numeric types, then `a == b` will return `false` when `intCoercion` is off.
		if (bothNumeric(t0, t1)) {
			if (oneFloats(t0, t1) && (this.operator === Operator.ID || !int_coercion)) {
				return SolidBoolean.FALSETYPE
			}
			return SolidBoolean
		}
		if (t0.intersect(t1).isEmpty) {
			return SolidBoolean.FALSETYPE
		}
		return SolidBoolean
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const assess0: SolidObject | null = this.children[0].assess(validator);
		if (!assess0) {
			return assess0
		}
		const assess1: SolidObject | null = this.children[1].assess(validator);
		if (!assess1) {
			return assess1
		}
		const [v0, v1]: [SolidObject, SolidObject] = [assess0, assess1];
		return this.foldEquality(v0, v1);
	}
	private foldEquality(x: SolidObject, y: SolidObject): SolidBoolean {
		return SolidBoolean.fromBoolean(new Map<Operator, (x: SolidObject, y: SolidObject) => boolean>([
			[Operator.ID, (x, y) => x.identical(y)],
			[Operator.EQ, (x, y) => x.equal(y)],
			// [Operator.ISNT, (x, y) => !x.identical(y)],
			// [Operator.NEQ,  (x, y) => !x.equal(y)],
		]).get(this.operator)!(x, y))
	}
}
export class ASTNodeOperationBinaryLogical extends ASTNodeOperationBinary {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationBinaryLogical {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationBinaryLogical);
		return expression;
	}
	constructor (
		start_node: ParseNode,
		override readonly operator: ValidOperatorLogical,
		children: readonly [ASTNodeExpression, ASTNodeExpression],
	) {
		super(start_node, operator, children)
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionBinopLogical {
		const tofloat: boolean = to_float || this.shouldFloat
		return new INST.InstructionBinopLogical(
			builder.varCount,
			this.operator,
			this.children[0].build(builder, tofloat),
			this.children[1].build(builder, tofloat),
		)
	}
	protected override type_do_do(t0: SolidType, t1: SolidType, _int_coercion: boolean): SolidType {
		const null_union_false: SolidType = SolidNull.union(SolidBoolean.FALSETYPE);
		function truthifyType(t: SolidType): SolidType {
			const values: Set<SolidObject> = new Set(t.values);
			values.delete(SolidNull.NULL);
			values.delete(SolidBoolean.FALSE);
			return [...values].map<SolidType>((v) => new SolidTypeConstant(v)).reduce((a, b) => a.union(b));
		}
		return (this.operator === Operator.AND)
			? (t0.isSubtypeOf(null_union_false))
				? t0
				: (SolidNull.isSubtypeOf(t0))
					? (SolidBoolean.FALSETYPE.isSubtypeOf(t0))
						? null_union_false.union(t1)
						: SolidNull.union(t1)
					: (SolidBoolean.FALSETYPE.isSubtypeOf(t0))
						? SolidBoolean.FALSETYPE.union(t1)
						: t1
			: (t0.isSubtypeOf(null_union_false))
				? t1
				: (SolidNull.isSubtypeOf(t0) || SolidBoolean.FALSETYPE.isSubtypeOf(t0))
					? truthifyType(t0).union(t1)
					: t0
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const assess0: SolidObject | null = this.children[0].assess(validator);
		if (!assess0) {
			return assess0
		}
		const v0: SolidObject = assess0;
		if (
			this.operator === Operator.AND && !v0.isTruthy.value ||
			this.operator === Operator.OR  &&  v0.isTruthy.value
		) {
			return v0;
		}
		return this.children[1].assess(validator);
	}
}
export class ASTNodeOperationTernary extends ASTNodeOperation {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationTernary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationTernary);
		return expression;
	}
	constructor(
		start_node: ParseNode,
		readonly operator: Operator.COND,
		override readonly children: readonly [ASTNodeExpression, ASTNodeExpression, ASTNodeExpression],
	) {
		super(start_node, operator, children)
	}
	override get shouldFloat(): boolean {
		return this.children[1].shouldFloat || this.children[2].shouldFloat
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionCond {
		const tofloat: boolean = to_float || this.shouldFloat
		return new INST.InstructionCond(
			this.children[0].build(builder, false),
			this.children[1].build(builder, tofloat),
			this.children[2].build(builder, tofloat),
		)
	}
	protected override type_do(validator: Validator): SolidType {
		// If `a` is of type `false`, then `typeof (if a then b else c)` is `typeof c`.
		// If `a` is of type `true`,  then `typeof (if a then b else c)` is `typeof b`.
		const t0: SolidType = this.children[0].type(validator);
		const t1: SolidType = this.children[1].type(validator);
		const t2: SolidType = this.children[2].type(validator);
		return (t0.isSubtypeOf(SolidBoolean))
			? (t0 instanceof SolidTypeConstant)
				? (t0.value === SolidBoolean.FALSE) ? t2 : t1
				: t1.union(t2)
			: (() => { throw new TypeError01(this) })()
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const assess0: SolidObject | null = this.children[0].assess(validator);
		if (!assess0) {
			return assess0
		}
		return (assess0 === SolidBoolean.TRUE)
			? this.children[1].assess(validator)
			: this.children[2].assess(validator)
	}
}
/**
 * A sematic node representing a statement.
 * There are 3 known subclasses:
 * - ASTNodeStatementExpression
 * - ASTNodeDeclaration
 * - ASTNodeAssignment
 */
export abstract class ASTNodeStatement extends ASTNodeSolid {
	/**
	 * Construct a new ASTNodeStatement from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeStatement representing the given source
	 */
	static fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeStatement {
		const goal: ASTNodeGoal = ASTNodeGoal.fromSource(src, config);
		assert.strictEqual(goal.children.length, 1, 'semantic goal should have 1 child');
		return goal.children[0];
	}
}
export class ASTNodeStatementExpression extends ASTNodeStatement {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeStatementExpression {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeStatementExpression);
		return statement;
	}
	constructor(
		start_node: ParseNode,
		override readonly children:
			| readonly []
			| readonly [ASTNodeExpression]
		,
	) {
		super(start_node, {}, children)
	}
	override build(builder: Builder): INST.InstructionNone | INST.InstructionStatement {
		return (!this.children.length)
			? new INST.InstructionNone()
			: new INST.InstructionStatement(builder.stmtCount, this.children[0].build(builder));
	}
}
/**
 * A sematic node representing a declaration.
 * There are 2 known subclasses:
 * - ASTNodeDeclarationType
 * - ASTNodeDeclarationVariable
 */
export type ASTNodeDeclaration =
	| ASTNodeDeclarationType
	| ASTNodeDeclarationVariable
export class ASTNodeDeclarationType extends ASTNodeStatement {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeDeclarationType {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeDeclarationType);
		return statement;
	}
	constructor (
		start_node: ParseNode,
		override readonly children: readonly [ASTNodeTypeAlias, ASTNodeType],
	) {
		super(start_node, {}, children);
	}
	override varCheck(validator: Validator): void {
		const variable: ASTNodeTypeAlias = this.children[0];
		if (validator.hasSymbol(variable.id)) {
			throw new AssignmentError01(variable);
		};
		this.children[1].varCheck(validator);
		validator.addSymbol(new SymbolStructureType(
			variable.id,
			variable.line_index,
			variable.col_index,
			variable.source,
			() => this.children[1].assess(validator),
		));
	}
	override typeCheck(validator: Validator): void {
		this.children[1].typeCheck(validator);
		return validator.getSymbolInfo(this.children[0].id)?.assess();
	}
	override build(_builder: Builder): INST.InstructionNone {
		return new INST.InstructionNone();
	}
}
export class ASTNodeDeclarationVariable extends ASTNodeStatement {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeDeclarationVariable {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeDeclarationVariable);
		return statement;
	}
	constructor (
		start_node: ParseNode,
		readonly unfixed: boolean,
		override readonly children: readonly [ASTNodeVariable, ASTNodeType, ASTNodeExpression],
	) {
		super(start_node, {unfixed}, children)
	}
	override varCheck(validator: Validator): void {
		const variable: ASTNodeVariable = this.children[0];
		if (validator.hasSymbol(variable.id)) {
			throw new AssignmentError01(variable);
		};
		this.children[1].varCheck(validator);
		this.children[2].varCheck(validator);
		validator.addSymbol(new SymbolStructureVar(
			variable.id,
			variable.line_index,
			variable.col_index,
			variable.source,
			this.unfixed,
			() => this.children[1].assess(validator),
			(validator.config.compilerOptions.constantFolding && !this.unfixed)
				? () => this.children[2].assess(validator)
				: null,
		));
	}
	override typeCheck(validator: Validator): void {
		this.children[1].typeCheck(validator);
		this.children[2].typeCheck(validator);
		const assignee_type: SolidType = this.children[1].assess(validator);
		const assigned_type: SolidType = this.children[2].type(validator);
		if (
			assigned_type.isSubtypeOf(assignee_type) ||
			validator.config.compilerOptions.intCoercion && assigned_type.isSubtypeOf(Int16) && Float64.isSubtypeOf(assignee_type)
		) {
		} else {
			throw new TypeError03(this, assignee_type, assigned_type)
		}
		return validator.getSymbolInfo(this.children[0].id)?.assess();
	}
	override build(builder: Builder): INST.InstructionNone | INST.InstructionDeclareGlobal {
		const tofloat: boolean = this.children[2].type(builder.validator).isSubtypeOf(Float64) || this.children[2].shouldFloat;
		const assess: SolidObject | null = this.children[0].assess(builder.validator);
		return (builder.validator.config.compilerOptions.constantFolding && !this.unfixed && assess)
			? new INST.InstructionNone()
			: new INST.InstructionDeclareGlobal(this.children[0].id, this.unfixed, this.children[2].build(builder, tofloat))
		;
	}
}
export class ASTNodeAssignment extends ASTNodeStatement {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeAssignment {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeAssignment);
		return statement;
	}
	constructor (
		start_node: ParseNode,
		override readonly children: readonly [ASTNodeVariable, ASTNodeExpression],
	) {
		super(start_node, {}, children)
	}
	override varCheck(validator: Validator): void {
		this.children.forEach((c) => c.varCheck(validator));
		const variable: ASTNodeVariable = this.children[0];
		if (!(validator.getSymbolInfo(variable.id) as SymbolStructureVar).unfixed) {
			throw new AssignmentError10(variable);
		};
	}
	override typeCheck(validator: Validator): void {
		this.children[1].typeCheck(validator);
		const assignee_type: SolidType = this.children[0].type(validator);
		const assigned_type: SolidType = this.children[1].type(validator);
		if (
			assigned_type.isSubtypeOf(assignee_type) ||
			validator.config.compilerOptions.intCoercion && assigned_type.isSubtypeOf(Int16) && Float64.isSubtypeOf(assignee_type)
		) {
		} else {
			throw new TypeError03(this, assignee_type, assigned_type);
		};
	}
	override build(builder: Builder): INST.InstructionStatement {
		const tofloat: boolean = this.children[1].type(builder.validator).isSubtypeOf(Float64) || this.children[1].shouldFloat;
		return new INST.InstructionStatement(
			builder.stmtCount,
			new INST.InstructionGlobalSet(this.children[0].id, this.children[1].build(builder, tofloat)),
		);
	}
}
export class ASTNodeGoal extends ASTNodeSolid {
	/**
	 * Construct a new ASTNodeGoal from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeGoal representing the given source
	 */
	static fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeGoal {
		return Decorator.decorate(new Parser(src, config).parse());
	}
	constructor(
		start_node: ParseNode,
		override readonly children: readonly ASTNodeStatement[],
	) {
		super(start_node, {}, children)
	}
	override build(builder: Builder): INST.InstructionNone | INST.InstructionModule {
		return (!this.children.length)
			? new INST.InstructionNone()
			: new INST.InstructionModule([
				...Builder.IMPORTS,
				...(this.children as readonly ASTNodeStatement[]).map((child) => child.build(builder)),
			])
	}
}

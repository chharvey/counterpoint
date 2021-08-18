import type {
	ParseNode,
} from '@chharvey/parser';
import * as assert from 'assert';
import * as xjs from 'extrajs'
import {
	SolidConfig,
	CONFIG_DEFAULT,
} from '../core/index.js';
import {
	ParserSolid as Parser,
} from '../parser/index.js';
import {
	SolidType,
	SolidTypeConstant,
	SolidObject,
	SolidNull,
	SolidBoolean,
	SolidNumber,
	Int16,
	Float64,
} from '../typer/index.js';
import {
	Builder,
	Instruction,
	INST,
} from '../builder/index.js';
import {
	AssignmentError01,
	AssignmentError10,
	TypeError01,
	TypeError03,
	NanError01,
	NanError02,
} from '../error/index.js';
import {
	Operator,
	ValidOperatorUnary,
	ValidOperatorBinary,
	ValidOperatorArithmetic,
	ValidOperatorComparative,
	ValidOperatorEquality,
	ValidOperatorLogical,
} from './Operator.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import type {ASTNodeType} from './ASTNodeType.js';
import type {ASTNodeTypeAlias} from './ASTNodeTypeAlias.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import type {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';
import {Decorator} from './Decorator.js';
import type {Validator} from './Validator.js';
import {
	SymbolStructureVar,
	SymbolStructureType,
} from './SymbolStructure.js';



export * from './ASTNodeKey.js';
export * from './ASTNodeIndexType.js';
export * from './ASTNodeItemType.js';
export * from './ASTNodePropertyType.js';
export * from './ASTNodeIndex.js';
export * from './ASTNodeProperty.js';
export * from './ASTNodeCase.js';
export * from './ASTNodeType.js';
export * from './ASTNodeTypeConstant.js';
export * from './ASTNodeTypeAlias.js';
export * from './ASTNodeTypeTuple.js';
export * from './ASTNodeTypeRecord.js';
export * from './ASTNodeTypeAccess.js';
export * from './ASTNodeTypeOperation.js';
export * from './ASTNodeTypeOperationUnary.js';
export * from './ASTNodeTypeOperationBinary.js';
export * from './ASTNodeExpression.js';
export * from './ASTNodeConstant.js';
export * from './ASTNodeVariable.js';
export * from './ASTNodeTemplate.js';
export * from './ASTNodeTuple.js';
export * from './ASTNodeRecord.js';
export * from './ASTNodeSet.js';
export * from './ASTNodeMapping.js';
export * from './ASTNodeAccess.js';
export * from './ASTNodeOperation.js';



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



export class ASTNodeOperationUnary extends ASTNodeOperation {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeOperationUnary {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeOperationUnary);
		return expression;
	}
	constructor(
		start_node: ParseNode,
		readonly operator: ValidOperatorUnary,
		readonly operand: ASTNodeExpression,
	) {
		super(start_node, operator, [operand]);
	}
	override shouldFloat(validator: Validator): boolean {
		return this.operand.shouldFloat(validator);
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionUnop {
		const tofloat: boolean = to_float || this.shouldFloat(builder.validator);
		return new INST.InstructionUnop(
			this.operator,
			this.operand.build(builder, tofloat),
		)
	}
	protected override type_do(validator: Validator): SolidType {
		const t0: SolidType = this.operand.type(validator);
		return (
			(this.operator === Operator.NOT) ? (
				(t0.isSubtypeOf(SolidType.VOID.union(SolidNull).union(SolidBoolean.FALSETYPE))) ? SolidBoolean.TRUETYPE :
				(SolidType.VOID.isSubtypeOf(t0) || SolidNull.isSubtypeOf(t0) || SolidBoolean.FALSETYPE.isSubtypeOf(t0)) ? SolidBoolean :
				SolidBoolean.FALSETYPE
			) :
			(this.operator === Operator.EMP) ? SolidBoolean :
			/* (this.operator === Operator.NEG) */ (t0.isSubtypeOf(SolidNumber)) ? t0 : (() => { throw new TypeError01(this); })()
		);
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const assess0: SolidObject | null = this.operand.assess(validator);
		if (!assess0) {
			return assess0
		}
		return (
			(this.operator === Operator.NOT) ? SolidBoolean.fromBoolean(!assess0.isTruthy) :
			(this.operator === Operator.EMP) ? SolidBoolean.fromBoolean(!assess0.isTruthy || assess0.isEmpty) :
			(this.operator === Operator.NEG) ? this.foldNumeric(assess0 as SolidNumber<any>) :
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
			throw (err instanceof xjs.NaNError) ? new NanError01(this) : err;
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
		readonly operand0: ASTNodeExpression,
		readonly operand1: ASTNodeExpression,
	) {
		super(start_node, operator, [operand0, operand1]);
	}
	override shouldFloat(validator: Validator): boolean {
		return this.operand0.shouldFloat(validator) || this.operand1.shouldFloat(validator);
	}
	/**
	 * @final
	 */
	protected override type_do(validator: Validator): SolidType {
		return this.type_do_do(
			this.operand0.type(validator),
			this.operand1.type(validator),
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
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionBinopArithmetic {
		const tofloat: boolean = to_float || this.shouldFloat(builder.validator);
		return new INST.InstructionBinopArithmetic(
			this.operator,
			this.operand0.build(builder, tofloat),
			this.operand1.build(builder, tofloat),
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
		const assess0: SolidObject | null = this.operand0.assess(validator);
		if (!assess0) {
			return assess0
		}
		const assess1: SolidObject | null = this.operand1.assess(validator);
		if (!assess1) {
			return assess1
		}
		if (this.operator === Operator.DIV && assess1 instanceof SolidNumber && assess1.eq0()) {
			throw new NanError02(this.operand1);
		}
		return (assess0 instanceof Int16 && assess1 instanceof Int16)
			? this.foldNumeric(assess0, assess1)
			: this.foldNumeric(
				(assess0 as SolidNumber).toFloat(),
				(assess1 as SolidNumber).toFloat(),
			);
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
			throw (err instanceof xjs.NaNError) ? new NanError01(this) : err;
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
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
		if ([Operator.IS, Operator.ISNT].includes(this.operator)) {
			throw new TypeError(`Operator ${ this.operator } not yet supported.`);
		}
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionBinopComparative {
		const tofloat: boolean = to_float || this.shouldFloat(builder.validator);
		return new INST.InstructionBinopComparative(
			this.operator,
			this.operand0.build(builder, tofloat),
			this.operand1.build(builder, tofloat),
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
		const assess0: SolidObject | null = this.operand0.assess(validator);
		if (!assess0) {
			return assess0
		}
		const assess1: SolidObject | null = this.operand1.assess(validator);
		if (!assess1) {
			return assess1
		}
		return (assess0 instanceof Int16 && assess1 instanceof Int16)
			? this.foldComparative(assess0, assess1)
			: this.foldComparative(
				(assess0 as SolidNumber).toFloat(),
				(assess1 as SolidNumber).toFloat(),
			);
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
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
	}
	override shouldFloat(validator: Validator): boolean {
		return this.operator === Operator.EQ && super.shouldFloat(validator);
	}
	protected override build_do(builder: Builder, _to_float: boolean = false): INST.InstructionBinopEquality {
		const tofloat: boolean = builder.config.compilerOptions.intCoercion && this.shouldFloat(builder.validator);
		return new INST.InstructionBinopEquality(
			this.operator,
			this.operand0.build(builder, tofloat),
			this.operand1.build(builder, tofloat),
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
		if (t0.intersect(t1).isBottomType) {
			return SolidBoolean.FALSETYPE
		}
		return SolidBoolean
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const assess0: SolidObject | null = this.operand0.assess(validator);
		if (!assess0) {
			return assess0
		}
		const assess1: SolidObject | null = this.operand1.assess(validator);
		if (!assess1) {
			return assess1
		}
		return this.foldEquality(assess0, assess1);
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
		operand0: ASTNodeExpression,
		operand1: ASTNodeExpression,
	) {
		super(start_node, operator, operand0, operand1);
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionBinopLogical {
		const tofloat: boolean = to_float || this.shouldFloat(builder.validator);
		return new INST.InstructionBinopLogical(
			builder.varCount,
			this.operator,
			this.operand0.build(builder, tofloat),
			this.operand1.build(builder, tofloat),
		)
	}
	protected override type_do_do(t0: SolidType, t1: SolidType, _int_coercion: boolean): SolidType {
		const falsytypes: SolidType = SolidType.VOID.union(SolidNull).union(SolidBoolean.FALSETYPE);
		return (this.operator === Operator.AND)
			? (t0.isSubtypeOf(falsytypes))
				? t0
				: t0.intersect(falsytypes).union(t1)
			: (t0.isSubtypeOf(falsytypes))
				? t1
				: (SolidType.VOID.isSubtypeOf(t0) || SolidNull.isSubtypeOf(t0) || SolidBoolean.FALSETYPE.isSubtypeOf(t0))
					? t0.subtract(falsytypes).union(t1)
					: t0
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const assess0: SolidObject | null = this.operand0.assess(validator);
		if (!assess0) {
			return assess0
		}
		if (
			this.operator === Operator.AND && !assess0.isTruthy
			|| this.operator === Operator.OR && assess0.isTruthy
		) {
			return assess0;
		}
		return this.operand1.assess(validator);
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
		readonly operand0: ASTNodeExpression,
		readonly operand1: ASTNodeExpression,
		readonly operand2: ASTNodeExpression,
	) {
		super(start_node, operator, [operand0, operand1, operand2]);
	}
	override shouldFloat(validator: Validator): boolean {
		return this.operand1.shouldFloat(validator) || this.operand2.shouldFloat(validator);
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionCond {
		const tofloat: boolean = to_float || this.shouldFloat(builder.validator);
		return new INST.InstructionCond(
			this.operand0.build(builder, false),
			this.operand1.build(builder, tofloat),
			this.operand2.build(builder, tofloat),
		)
	}
	protected override type_do(validator: Validator): SolidType {
		// If `a` is of type `false`, then `typeof (if a then b else c)` is `typeof c`.
		// If `a` is of type `true`,  then `typeof (if a then b else c)` is `typeof b`.
		const t0: SolidType = this.operand0.type(validator);
		const t1: SolidType = this.operand1.type(validator);
		const t2: SolidType = this.operand2.type(validator);
		return (t0.isSubtypeOf(SolidBoolean))
			? (t0 instanceof SolidTypeConstant)
				? (t0.value === SolidBoolean.FALSE) ? t2 : t1
				: t1.union(t2)
			: (() => { throw new TypeError01(this) })()
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const assess0: SolidObject | null = this.operand0.assess(validator);
		if (!assess0) {
			return assess0
		}
		return (assess0 === SolidBoolean.TRUE)
			? this.operand1.assess(validator)
			: this.operand2.assess(validator);
	}
}
/**
 * A sematic node representing a statement.
 * There are 3 known subclasses:
 * - ASTNodeStatementExpression
 * - ASTNodeDeclaration
 * - ASTNodeAssignment
 */
export abstract class ASTNodeStatement extends ASTNodeSolid implements Buildable {
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
	abstract build(builder: Builder): Instruction;
}
export class ASTNodeStatementExpression extends ASTNodeStatement {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeStatementExpression {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeStatementExpression);
		return statement;
	}
	constructor(
		start_node: ParseNode,
		readonly expr?: ASTNodeExpression,
	) {
		super(start_node, {}, (expr) ? [expr] : void 0);
	}
	override build(builder: Builder): INST.InstructionNone | INST.InstructionStatement {
		return (this.expr)
			? new INST.InstructionStatement(builder.stmtCount, this.expr.build(builder))
			: new INST.InstructionNone();
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
		readonly variable: ASTNodeTypeAlias,
		readonly value:    ASTNodeType,
	) {
		super(start_node, {}, [variable, value]);
	}
	override varCheck(validator: Validator): void {
		if (validator.hasSymbol(this.variable.id)) {
			throw new AssignmentError01(this.variable);
		};
		this.value.varCheck(validator);
		validator.addSymbol(new SymbolStructureType(
			this.variable.id,
			this.variable.line_index,
			this.variable.col_index,
			this.variable.source,
			() => this.value.assess(validator),
		));
	}
	override typeCheck(validator: Validator): void {
		this.value.typeCheck(validator);
		return validator.getSymbolInfo(this.variable.id)?.assess();
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
		readonly variable: ASTNodeVariable,
		readonly type:     ASTNodeType,
		readonly value:    ASTNodeExpression,
	) {
		super(start_node, {unfixed}, [variable, type, value]);
	}
	override varCheck(validator: Validator): void {
		const variable: ASTNodeVariable = this.variable;
		if (validator.hasSymbol(variable.id)) {
			throw new AssignmentError01(variable);
		};
		this.type.varCheck(validator);
		this.value.varCheck(validator);
		validator.addSymbol(new SymbolStructureVar(
			variable.id,
			variable.line_index,
			variable.col_index,
			variable.source,
			this.unfixed,
			() => this.type.assess(validator),
			(validator.config.compilerOptions.constantFolding && !this.unfixed)
				? () => this.value.assess(validator)
				: null,
		));
	}
	override typeCheck(validator: Validator): void {
		this.type.typeCheck(validator);
		this.value.typeCheck(validator);
		const assignee_type: SolidType = this.type.assess(validator);
		const assigned_type: SolidType = this.value.type(validator);
		if (
			assigned_type.isSubtypeOf(assignee_type) ||
			validator.config.compilerOptions.intCoercion && assigned_type.isSubtypeOf(Int16) && Float64.isSubtypeOf(assignee_type)
		) {
		} else {
			throw new TypeError03(this, assignee_type, assigned_type)
		}
		return validator.getSymbolInfo(this.variable.id)?.assess();
	}
	override build(builder: Builder): INST.InstructionNone | INST.InstructionDeclareGlobal {
		const tofloat: boolean = this.type.assess(builder.validator).isSubtypeOf(Float64) || this.value.shouldFloat(builder.validator);
		const assess: SolidObject | null = this.variable.assess(builder.validator);
		return (builder.validator.config.compilerOptions.constantFolding && !this.unfixed && assess)
			? new INST.InstructionNone()
			: new INST.InstructionDeclareGlobal(this.variable.id, this.unfixed, this.value.build(builder, tofloat))
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
		readonly assignee: ASTNodeVariable,
		readonly assigned: ASTNodeExpression,
	) {
		super(start_node, {}, [assignee, assigned]);
	}
	override varCheck(validator: Validator): void {
		this.children.forEach((c) => c.varCheck(validator));
		const variable: ASTNodeVariable = this.assignee;
		if (!(validator.getSymbolInfo(variable.id) as SymbolStructureVar).unfixed) {
			throw new AssignmentError10(variable);
		};
	}
	override typeCheck(validator: Validator): void {
		this.assigned.typeCheck(validator);
		const assignee_type: SolidType = this.assignee.type(validator);
		const assigned_type: SolidType = this.assigned.type(validator);
		if (
			assigned_type.isSubtypeOf(assignee_type) ||
			validator.config.compilerOptions.intCoercion && assigned_type.isSubtypeOf(Int16) && Float64.isSubtypeOf(assignee_type)
		) {
		} else {
			throw new TypeError03(this, assignee_type, assigned_type);
		};
	}
	override build(builder: Builder): INST.InstructionStatement {
		const tofloat: boolean = this.assignee.type(builder.validator).isSubtypeOf(Float64) || this.assigned.shouldFloat(builder.validator);
		return new INST.InstructionStatement(
			builder.stmtCount,
			new INST.InstructionGlobalSet(this.assignee.id, this.assigned.build(builder, tofloat)),
		);
	}
}
export class ASTNodeGoal extends ASTNodeSolid implements Buildable {
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
	build(builder: Builder): INST.InstructionNone | INST.InstructionModule {
		return (!this.children.length)
			? new INST.InstructionNone()
			: new INST.InstructionModule([
				...Builder.IMPORTS,
				...(this.children as readonly ASTNodeStatement[]).map((child) => child.build(builder)),
			])
	}
}

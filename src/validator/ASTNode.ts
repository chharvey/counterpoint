import type {
	ParseNode,
} from '@chharvey/parser';
import * as assert from 'assert';
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
} from '../error/index.js';
import {
	Operator,
	ValidOperatorLogical,
} from './Operator.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import type {ASTNodeType} from './ASTNodeType.js';
import type {ASTNodeTypeAlias} from './ASTNodeTypeAlias.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import type {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeOperation} from './ASTNodeOperation.js';
import {ASTNodeOperationBinary} from './ASTNodeOperationBinary.js';
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
export * from './ASTNodeOperationUnary.js';
export * from './ASTNodeOperationBinary.js';
export * from './ASTNodeOperationBinaryArithmetic.js';
export * from './ASTNodeOperationBinaryComparative.js';
export * from './ASTNodeOperationBinaryEquality.js';



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

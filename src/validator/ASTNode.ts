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
	SolidObject,
	Int16,
	Float64,
} from '../typer/index.js';
import {
	Builder,
	INST,
} from '../builder/index.js';
import {
	AssignmentError01,
	AssignmentError10,
	TypeError03,
} from '../error/index.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import type {ASTNodeType} from './ASTNodeType.js';
import type {ASTNodeExpression} from './ASTNodeExpression.js';
import type {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';
import {Decorator} from './Decorator.js';
import type {Validator} from './Validator.js';
import {
	SymbolStructureVar,
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
export * from './ASTNodeOperationBinaryLogical.js';
export * from './ASTNodeOperationTernary.js';
export * from './ASTNodeStatement.js';
export * from './ASTNodeDeclaration.js';
export * from './ASTNodeDeclarationType.js';



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

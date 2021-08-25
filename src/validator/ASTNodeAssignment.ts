import type {ParseNode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	AssignmentError10,
	TypeError03,
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	Int16,
	Float64,
	INST,
	Builder,
} from './package.js';
import type {ASTNodeExpression} from './ASTNodeExpression.js';
import type {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';
import type {Validator} from './Validator.js';
import type {SymbolStructureVar} from './SymbolStructure.js';



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

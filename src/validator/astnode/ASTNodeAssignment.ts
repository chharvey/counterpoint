import type {ParseNode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	Float64,
	INST,
	Builder,
	AssignmentError10,
	SolidConfig,
	CONFIG_DEFAULT,
	Validator,
	SymbolStructureVar,
} from './package.js';
import type {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeVariable} from './ASTNodeVariable.js';
import type {ASTNodeAccess} from './ASTNodeAccess.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeAssignment extends ASTNodeStatement {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeAssignment {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeAssignment);
		return statement;
	}
	constructor (
		start_node: ParseNode,
		readonly assignee: ASTNodeVariable | ASTNodeAccess,
		readonly assigned: ASTNodeExpression,
	) {
		super(start_node, {}, [assignee, assigned]);
	}
	override varCheck(validator: Validator): void {
		super.varCheck(validator);
		const assignee: ASTNodeVariable | ASTNodeAccess = this.assignee;
		if (assignee instanceof ASTNodeVariable && !(validator.getSymbolInfo(assignee.id) as SymbolStructureVar).unfixed) {
			throw new AssignmentError10(assignee);
		};
	}
	override typeCheck(validator: Validator): void {
		super.typeCheck(validator);
		return this.typeCheckAssignment(
			this.assignee.type(validator),
			this.assigned.type(validator),
			validator,
		);
	}
	override build(builder: Builder): INST.InstructionStatement {
		const tofloat: boolean = this.assignee.type(builder.validator).isSubtypeOf(Float64) || this.assigned.shouldFloat(builder.validator);
		return new INST.InstructionStatement(
			builder.stmtCount,
			new INST.InstructionGlobalSet((this.assignee as ASTNodeVariable).id, this.assigned.build(builder, tofloat)),
		);
	}
}

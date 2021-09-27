import type {ParseNode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	AssignmentError10,
	SolidConfig,
	CONFIG_DEFAULT,
	Float64,
	INST,
	Builder,
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
		const variable: ASTNodeVariable | ASTNodeAccess = this.assignee;
		if (variable instanceof ASTNodeVariable && !(validator.getSymbolInfo(variable.id) as SymbolStructureVar).unfixed) {
			throw new AssignmentError10(variable);
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

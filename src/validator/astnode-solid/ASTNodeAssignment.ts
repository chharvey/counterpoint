import * as assert from 'assert';
import {
	SolidType,
	INST,
	Builder,
	AssignmentError10,
	MutabilityError01,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	SymbolStructureVar,
} from './package.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import type {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeAccess} from './ASTNodeAccess.js';
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
	override varCheck(): void {
		super.varCheck();
		const assignee: ASTNodeVariable | ASTNodeAccess = this.assignee;
		if (assignee instanceof ASTNodeVariable && !(this.validator.getSymbolInfo(assignee.id) as SymbolStructureVar).unfixed) {
			throw new AssignmentError10(assignee);
		};
	}
	override typeCheck(): void {
		super.typeCheck();
		if (this.assignee instanceof ASTNodeAccess) {
			const base_type: SolidType = this.assignee.base.type();
			if (!base_type.isMutable) {
				throw new MutabilityError01(base_type, this);
			}
		}
		return ASTNodeSolid.typeCheckAssignment(
			this.assignee.type(),
			this.assigned.type(),
			this,
			this.validator,
		);
	}
	override build(builder: Builder): INST.InstructionStatement {
		const tofloat: boolean = this.assignee.type().isSubtypeOf(SolidType.FLOAT) || this.assigned.shouldFloat();
		return new INST.InstructionStatement(
			builder.stmtCount,
			new INST.InstructionGlobalSet((this.assignee as ASTNodeVariable).id, this.assigned.build(builder, tofloat)),
		);
	}
}

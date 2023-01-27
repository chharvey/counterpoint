import * as assert from 'assert';
import binaryen from 'binaryen';
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
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';
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
		const assignee_type: SolidType = this.assignee.type();
		try {
			return ASTNodeSolid.typeCheckAssignment(
				this.assigned.type(),
				assignee_type,
				this,
				this.validator,
			);
		} catch (err) {
			if (!(this.assigned instanceof ASTNodeCollectionLiteral && this.assigned.assignTo(assignee_type))) {
				throw err;
			}
		}
	}
	public override build(builder: Builder): binaryen.ExpressionRef {
		const id: bigint = (this.assignee as ASTNodeVariable).id;
		const local = builder.getLocalInfo(id);
		if (!local) {
			throw new ReferenceError(`Variable with id ${ id } not found.`);
		}
		let inst: INST.InstructionExpression = this.assigned.build(builder);
		if (this.assignee.type().isSubtypeOf(SolidType.FLOAT) && inst.binType === binaryen.i32) {
			inst = new INST.InstructionConvert(inst);
		}
		return builder.module.local.set(local.index, inst.buildBin(builder.module));
	}
}

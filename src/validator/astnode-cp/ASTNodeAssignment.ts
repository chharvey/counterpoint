import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	TYPE,
	INST,
	Builder,
	AssignmentError10,
	MutabilityError01,
	CPConfig,
	CONFIG_DEFAULT,
	SymbolStructureVar,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';
import {ASTNodeAccess} from './ASTNodeAccess.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeAssignment extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeAssignment {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeAssignment);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'statement_assignment'>,
		private readonly assignee: ASTNodeVariable | ASTNodeAccess,
		public readonly assigned:  ASTNodeExpression,
	) {
		super(start_node, {}, [assignee, assigned]);
	}

	public override varCheck(): void {
		super.varCheck();
		const assignee: ASTNodeVariable | ASTNodeAccess = this.assignee;
		if (assignee instanceof ASTNodeVariable && !(this.validator.getSymbolInfo(assignee.id) as SymbolStructureVar).unfixed) {
			throw new AssignmentError10(assignee);
		}
	}

	public override typeCheck(): void {
		super.typeCheck();
		if (this.assignee instanceof ASTNodeAccess) {
			const base_type: TYPE.Type = this.assignee.base.type();
			if (!base_type.isMutable) {
				throw new MutabilityError01(base_type, this);
			}
		}
		const assignee_type: TYPE.Type = this.assignee.type();
		try {
			return ASTNodeCP.typeCheckAssignment(
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
		if (this.assignee.type().isSubtypeOf(TYPE.FLOAT) && !this.assigned.shouldFloat()) {
			inst = new INST.InstructionConvert(inst);
		}
		return builder.module.local.set(local.index, inst.buildBin(builder.module));
	}
}

import type binaryen from 'binaryen';
import {
	type TYPE,
	AssignmentErrorReassignment,
	MutabilityError01,
} from '../../index.ts';
import {assert_instanceof} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SymbolStructureVar} from '../index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {ASTNodeExpression} from './ASTNodeExpression.ts';
import {ASTNodeVariable} from './ASTNodeVariable.ts';
import {ASTNodeAccess} from './ASTNodeAccess.ts';
import {ASTNodeStatement} from './ASTNodeStatement.ts';



export class ASTNodeAssignment extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeAssignment {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeAssignment);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'statement_assignment'>,
		public readonly assignee: ASTNodeVariable | ASTNodeAccess,
		public readonly assigned: ASTNodeExpression,
	) {
		super(start_node, {}, [assignee, assigned]);
	}

	public override varCheck(): void {
		super.varCheck();
		const assignee: ASTNodeVariable | ASTNodeAccess = this.assignee;
		if (assignee instanceof ASTNodeVariable && !(this.validator.getSymbolInfo(assignee.id) as SymbolStructureVar).unfixed) {
			throw new AssignmentErrorReassignment(assignee);
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
		ASTNodeCP.typeCheckAssign(this.assigned, assignee_type, this);
	}

	public override build(): binaryen.ExpressionRef {
		const id: bigint = (this.assignee as ASTNodeVariable).id;
		const local = this.builder.getLocalInfo(id);
		if (!local) {
			throw new ReferenceError(`Variable with id ${ id } not found.`);
		}
		return this.builder.module.local.set(local.index, ASTNodeStatement.coerceAssignment(
			this.builder.module,
			this.assignee.type(),
			this.assigned.type(),
			this.assigned.build(),
			this.validator.config.compilerOptions.intCoercion,
		));
	}
}

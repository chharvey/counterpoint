import type binaryen from 'binaryen';
import {
	type TYPE,
	type Builder,
	AssignmentErrorReassignment,
	MutabilityError01,
} from '../../index.js';
import {assert_instanceof} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SymbolStructureVar} from '../index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeAccess} from './ASTNodeAccess.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeDeclarationReassignment extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeDeclarationReassignment {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeDeclarationReassignment);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'declaration_reassignment'>,
		private readonly assignee: ASTNodeVariable | ASTNodeAccess,
		public readonly assigned:  ASTNodeExpression,
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
		ASTNodeCP.assignExpression(this.assigned, assignee_type, this);
	}

	public override build(builder: Builder): binaryen.ExpressionRef {
		const id: bigint = (this.assignee as ASTNodeVariable).id;
		const local = builder.getLocalInfo(id);
		if (!local) {
			throw new ReferenceError(`Variable with id ${ id } not found.`);
		}
		return builder.module.local.set(local.index, ASTNodeStatement.coerceAssignment(
			builder.module,
			this.assignee.type(),
			this.assigned.type(),
			this.assigned.build(builder),
			this.validator.config.compilerOptions.intCoercion,
		));
	}
}

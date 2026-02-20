import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	type TYPE,
	type Lowerable,
	AssignmentErrorReassignment,
	MutabilityError01,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SymbolSchemaVar} from '../index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {ASTNodeExpression} from './ASTNodeExpression.ts';
import {ASTNodeVariable} from './ASTNodeVariable.ts';
import {ASTNodeAccess} from './ASTNodeAccess.ts';
import {ASTNodeStatement} from './ASTNodeStatement.ts';



export class ASTNodeAssignment extends ASTNodeStatement implements Lowerable {
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
		if (assignee instanceof ASTNodeVariable && !(this.validator.getSymbolInfo(assignee.id) as SymbolSchemaVar).unfixed) {
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
		ASTNodeCP.typeCheckAssign(this.assigned, this.assignee.writeType(), this);
	}

	public override build(): binaryen.ExpressionRef {
		assert_instanceof(this.assignee, ASTNodeVariable, 'Assignment access not yet supported.');
		return this.builder.getLocal(this.assignee.id)?.set(ASTNodeStatement.coerceAssignment(
			this.builder.module,
			this.assignee.writeType(),
			this.assigned.type(),
			this.assigned.build(),
			this.validator.config.compilerOptions.intCoercion,
		)) ?? assert.fail(new ReferenceError(`Variable with id ${ this.assignee.id } not found.`));
	}

	/**
	 * @inheritdoc
	 * @implements Lowerable
	 */
	@memoizeMethod
	public lower(): null {
		throw new Error('`ASTNodeAssignment#lower` not yet supported.');
	}
}

import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	type TYPE,
	AssignmentErrorReassignment,
	MutabilityError01,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	memoizeGetter,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SymbolSchemaVar} from '../index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {ASTNodeExpression} from './ASTNodeExpression.ts';
import {ASTNodeVariable} from './ASTNodeVariable.ts';
import {ASTNodeAccess} from './ASTNodeAccess.ts';
import {
	buildDeco,
	ASTNodeStatement,
} from './ASTNodeStatement.ts';



export class ASTNodeStatementReassignment extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeStatementReassignment {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeStatementReassignment);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'statement_reassignment', ['break']>,
		public readonly assignee: ASTNodeVariable | ASTNodeAccess,
		public readonly assigned: ASTNodeExpression,
	) {
		super(start_node, {}, [assignee, assigned]);
	}

	// @memoizeGetter // memoizing takes longer than returning a constant
	public override get isFoldable(): boolean {
		return false;
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		return this.assigned.type().isBottomType;
	}

	public override varCheck(): void {
		super.varCheck();
		if (this.assignee instanceof ASTNodeVariable && !(this.validator.getSymbolInfo(this.assignee.id) as SymbolSchemaVar).isUnfixed) {
			throw new AssignmentErrorReassignment(this.assignee);
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

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		assert_instanceof(this.assignee, ASTNodeVariable, '`ASTNodeStatementReassignment[assignee: ASTNodeAccess]#build` not yet supported.');
		return this.builder.getLocal(this.validator.getSymbolInfo(this.assignee.id) as SymbolSchemaVar)?.set(this.assigned.build()) ?? assert.fail(new ReferenceError(`Variable with id ${ this.assignee.id } not found.`));
	}
}

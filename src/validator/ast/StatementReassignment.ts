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
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SymbolSchemaVar} from '../index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {typecheck_assign} from './AstNode.ts';
import type {Expression} from './Expression.ts';
import {Variable} from './Variable.ts';
import {Access} from './Access.ts';
import {
	buildDeco,
	Statement,
} from './Statement.ts';



export class StatementReassignment extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementReassignment {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementReassignment);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'statement_reassignment', ['break']>,
		public readonly assignee: Variable | Access,
		public readonly assigned: Expression,
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
		if (this.assignee instanceof Variable && !(this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar).isUnfixed) {
			throw new AssignmentErrorReassignment(this.assignee);
		}
	}

	public override typeCheck(): void {
		super.typeCheck();
		if (this.assignee instanceof Access) {
			const base_type: TYPE.Type = this.assignee.base.type();
			if (!base_type.isMutable) {
				throw new MutabilityError01(base_type, this);
			}
		}
		typecheck_assign(this.assigned, this.assignee.writeType(), this);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		assert_instanceof(this.assignee, Variable, '`StatementReassignment[assignee: Access]#build` not yet supported.');
		return this.builder.getLocal(this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar)?.set(this.assigned.build()) ?? assert.fail(new ReferenceError(`Variable with id ${ this.assignee.id } not found.`));
	}
}

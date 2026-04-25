import * as assert from 'node:assert';
import {
	type TYPE,
	type Optimizer,
	IR,
	AssignmentErrorReassignment,
	MutabilityError01,
} from '../../index.ts';
import {
	assert_instanceof,
	noopGetter,
	memoizeGetter,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SymbolSchemaVar} from '../index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import {ASTNodeExpression} from './ASTNodeExpression.ts';
import {ASTNodeVariable} from './ASTNodeVariable.ts';
import {ASTNodeAccess} from './ASTNodeAccess.ts';
import {ASTNodeStatement} from './ASTNodeStatement.ts';



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

	@noopGetter(memoizeGetter)
	public override get isFoldable(): boolean {
		return false;
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		return this.assigned.type().isBottomType;
	}

	public override varCheck(): void {
		super.varCheck();
		if (this.assignee instanceof ASTNodeVariable && !(this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar).isWritable) {
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

	@runOnceMethod
	public override lower(optimizer: Optimizer): void {
		if (this.assignee instanceof ASTNodeVariable) {
			const symbol = this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar;
			const value: IR.Value = this.assigned.lower(optimizer);
			symbol.irType = value.type;
			return optimizer.pushInstruction(new IR.Set(symbol, value));
		} else {
			assert_instanceof(this.assignee.accessor, ASTNodeExpression);
			const base_value:    IR.ValueTac = this.assignee.base.lower(optimizer).asTac(optimizer);
			const base_typename: IR.TypeName = IR.ast_type_name(base_value.type);
			assert.ok([IR.TypeName.LIST, IR.TypeName.DICT, IR.TypeName.SET, IR.TypeName.MAP].includes(base_typename), `Expected ${ IR.TypeName[base_typename] } to be a dynamic collection.`);
			return optimizer.pushInstruction(new IR.CollectionDynamicSet(
				base_typename as IR.CollectionDynamicName,
				base_value,
				this.assignee.accessor.lower(optimizer).asTac(optimizer),
				this.assigned.lower(optimizer).asTac(optimizer),
			));
		}
	}
}

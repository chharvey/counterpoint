import {
	AssignmentErrorReassignment,
	AssignmentErrorDeletion,
	TypeError as CplTypeError,
	MutabilityError01,
} from '../../../index.ts';
import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {TYPE} from '../../../typer/index.ts';
import type {SymbolSchemaVar} from '../../index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import {typecheck_assign} from '../AstNode.ts';
import * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';



export class StatementReassignment extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementReassignment {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementReassignment);
		return statement;
	}


	public constructor(
		start_node: (
			| SyntaxNodeFamily<'statement_set',    ['break', 'return']>
			| SyntaxNodeFamily<'statement_delete', ['break', 'return']>
		),
		public readonly assignee:  EXPR.Variable | EXPR.Access,
		public readonly assigned?: EXPR.Expression,
	) {
		super(start_node, {}, [assignee, ...(assigned ? [assigned] : [])]);
	}


	public override varCheck(): void {
		super.varCheck(); // runtime asserts the var is in the symbol table and is a SymbolSchemaVar
		if (this.assignee instanceof EXPR.Variable) {
			const schema = this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar;
			if (this.assigned) {
				if (!schema.isWritable) {
					throw new AssignmentErrorReassignment(this.assignee);
				}
			} else if (!schema.isUninitialized) {
				throw new AssignmentErrorDeletion(this.assignee);
			}
		}
	}

	public override typeCheck(): void {
		super.typeCheck();
		if (this.assignee instanceof EXPR.Access) {
			const base_type: TYPE.Type = this.assignee.base.type();
			if (!base_type.isMutable) {
				throw new MutabilityError01(base_type, this);
			}
			if (!this.assigned && !(base_type instanceof TYPE.TypeInterface)) {
				throw new CplTypeError('The `delete` statement is only applicable to interface types.');
			}
		}
		this.assigned && typecheck_assign(this.assigned, this.assignee.writeType(), this);
	}
}

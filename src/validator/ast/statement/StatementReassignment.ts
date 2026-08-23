import * as assert from 'node:assert';
import {
	type Builder,
	OP,
	AssignmentErrorReassignment,
	AssignmentErrorDeletion,
	TypeError as CplTypeError,
	MutabilityError01,
} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeGetter,
	runOnceMethod,
} from '../../../lib/index.ts';
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
			| SyntaxNodeFamily<'statement_set',    ['break']>
			| SyntaxNodeFamily<'statement_delete', ['break']>
		),
		public  readonly assignee:  EXPR.Variable | EXPR.Access,
		public  readonly assigned?: EXPR.Expression,
	) {
		super(start_node, {}, assigned ? [assignee, assigned] : [assignee]);
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		return this.assignee.type().isBottomType || (this.assigned?.type().isBottomType ?? false);
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
			if (!(base_type instanceof TYPE.TypeInterface)) {
				if (!this.assigned) {
					throw new CplTypeError('The `delete` statement is only applicable to interface types.');
				}
			}
		}
		this.assigned && typecheck_assign(this.assigned, this.assignee.writeType(), this);
	}

	@runOnceMethod
	public override build(builder: Builder): void {
		if (this.assignee instanceof EXPR.Variable) {
			const symbol = this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar;
			let value: OP.Value;
			if (this.assigned) {
				value = this.assigned.build(builder);
				if (symbol.isUninitialized) {
					value = new OP.MaybeNew(symbol.type, value.asTac(builder));
				}
			} else {
				value = new OP.MaybeNew(symbol.type);
			}
			symbol.irType = value.type;
			return builder.pushInstruction(new OP.Set(symbol, symbol.irType, value));
		} else if (this.assigned) {
			assert_instanceof(this.assignee.accessor, EXPR.Expression);
			const base_value:    OP.ValueTac = this.assignee.base.build(builder).asTac(builder);
			const base_typename: OP.TypeName = OP.ast_type_name(base_value.type);
			assert.ok([OP.TypeName.LIST, OP.TypeName.DICT, OP.TypeName.SET, OP.TypeName.MAP].includes(base_typename), `Expected ${ OP.TypeName[base_typename] } to be a dynamic collection.`);
			return builder.pushInstruction(new OP.CollectionDynamicSet(
				base_typename as OP.CollectionDynamicName,
				base_value,
				this.assignee.accessor.build(builder).asTac(builder),
				this.assigned.build(builder).asTac(builder),
			));
		}
		assert.fail('Expected `StatementReassignment#typeCheck` to throw by now.');
	}
}

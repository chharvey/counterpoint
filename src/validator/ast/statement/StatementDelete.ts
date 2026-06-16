import {
	type Builder,
	OP,
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
import * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';



export class StatementDelete extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementDelete {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementDelete);
		return statement;
	}


	public constructor(
		start_node: SyntaxNodeFamily<'statement_delete', ['break']>,
		public readonly assignee: EXPR.Variable | EXPR.Access,
	) {
		super(start_node, {}, [assignee]);
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		return this.assignee.type().isBottomType;
	}

	public override varCheck(): void {
		super.varCheck(); // runtime asserts the var is in the symbol table and is a SymbolSchemaVar
		if (this.assignee instanceof EXPR.Variable) {
			const schema = this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar;
			if (!schema.isUninitialized || !schema.isWritable) {
				throw new AssignmentErrorDeletion(this.assignee);
			}
		}
	}

	public override typeCheck(): void {
		super.typeCheck();
		if (this.assignee instanceof EXPR.Access) {
			const base_type: TYPE.Type = this.assignee.base.type();
			if (!(base_type instanceof TYPE.TypeInterface)) {
				throw new CplTypeError('The `delete` statement is only applicable to interface types.');
			}
			if (!base_type.isMutable) {
				throw new MutabilityError01(base_type, this);
			}
		}
	}

	@runOnceMethod
	public override build(builder: Builder): void {
		assert_instanceof(this.assignee, EXPR.Variable); // TODO: object/interface support
		const symbol = this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar;
		symbol.irType = TYPE.NULL;
		return builder.pushInstruction(new OP.Set(symbol));
	}
}

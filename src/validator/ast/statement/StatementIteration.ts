import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	type Temp,
	type Builder,
	OP,
	AssignmentErrorDuplicateDeclaration,
	TypeErrorNotNarrow,
	TypeErrorNotAssignable,
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
import {
	VALUE,
	TYPE,
} from '../../../typer/index.ts';
import type {Serializable} from '../../../parser/index.ts';
import {SymbolSchemaVar} from '../../index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Validator} from '../../Validator.ts';
import type {Block} from '../Block.ts';
import type * as AST_TYPE from '../type/index.ts';
import type * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';
import {StatementBreakable} from './StatementBreakable.ts';



export class StatementIteration extends StatementBreakable {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementIteration {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementIteration);
		return statement;
	}

	private readonly id?: bigint;


	public constructor(
		start_node: SyntaxNodeType<'statement_iteration'>,
		private readonly assignee: Serializable | null,
		private readonly typenode: AST_TYPE.Type,
		public  readonly iterable: EXPR.Expression,
		public  readonly block:    Block,
	) {
		super(start_node, {}, [typenode, iterable, block]);
		if (this.assignee) {
			this.id = Validator.cookTokenIdentifier(this.assignee.source);
		}
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		return this.iterable.type().isBottomType || this.block.hasBottomType;
	}

	public override varCheck(): void {
		// Do not call `super.varCheck()` as we want to VarCheck `this.block` at the end.
		xjs.Array.forEachAggregated([this.typenode, this.iterable], (c) => c.varCheck());
		if (this.assignee) {
			if (this.block.validator.hasSymbol(this.id!)) {
				throw new AssignmentErrorDuplicateDeclaration(this.assignee);
			}
			this.block.validator.addSymbol(new SymbolSchemaVar(
				this.id!,
				this.assignee,
				false, // because it should not be manually reassigned
				false, // because it won’t ever be nullish upon accessing
			));
		}
		this.block.varCheck(); // must come after assignee checks, because assignee may be referenced inside block
	}

	public override typeCheck(): void {
		const assignee_type: TYPE.Type = this.typenode.eval();
		const iterable_type: TYPE.Type = this.iterable.type();
		if (!(iterable_type instanceof TYPE.List)) {
			throw new TypeErrorNotAssignable(this.iterable, new TYPE.List(TYPE.ANYTHING));
		}
		const item_type: TYPE.Type = iterable_type.typearg;
		if (!item_type.isSubtypeOf(assignee_type)) {
			throw new TypeErrorNotNarrow(item_type, assignee_type, this.line_index, this.col_index);
		}
		if (this.assignee) {
			assert.ok(this.block.validator.hasSymbol(this.id!), `The validator symbol table should include ${ this.id }.`);
			(this.block.validator.getSymbol(this.id!) as SymbolSchemaVar).type = assignee_type;
		}
		this.block.typeCheck();
	}

	@runOnceMethod
	public override build(builder: Builder): void {
		const iterable: OP.ValueTac = this.iterable.build(builder).asTac(builder);
		const index:    Temp        = builder.newTemp(new OP.Const(VALUE.NAT_0));
		const get_index             = new OP.Get(index);
		assert_instanceof(iterable.type, TYPE.List);

		this.labelWhile    = builder.newLabel();
		this.labelDo       = builder.newLabel();
		this.labelEndwhile = builder.newLabel();

		builder.pushInstruction(new OP.Decl(index));
		builder.terminateBlock(new OP.Goto(this.labels.while!));

		builder.initiateBlock(this.labels.while!);
		builder.terminateBlock(new OP.GotoConditional(new OP.Binop(
			OP.OpCode.LT,
			get_index,
			new OP.Unop(OP.OpCode.LIST_COUNT, iterable, TYPE.NAT).asTac(builder),
			TYPE.BOOL,
		), this.labels.do!, this.labels.endwhile!));

		builder.initiateBlock(this.labels.do!);
		if (this.assignee) {
			const symbol = this.block.validator.getSymbol(this.id!) as SymbolSchemaVar;
			symbol.irType = iterable.type.typearg;
			builder.pushInstruction(new OP.Decl(
				symbol,
				symbol.irType,
				new OP.CollectionDynamicGet(OP.TypeName.LIST, iterable, get_index, iterable.type.typearg),
			));
		}
		this.block.build(builder);
		builder.pushInstruction(new OP.Set(index, new OP.Binop(OP.OpCode.NAT_ADD, get_index, new OP.Const(VALUE.NAT_1), index.type)));
		builder.terminateBlock(new OP.Goto(this.labels.while!));

		builder.initiateBlock(this.labels.endwhile!);
	}
}

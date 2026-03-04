import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	type Optimizer,
	IR,
	AssignmentErrorDuplicateDeclaration,
	TypeErrorNotNarrow,
	TypeErrorNotAssignable,
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
import {SymbolSchemaVar} from '../index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeBlock} from './index.ts';
import type {ASTNodeType} from './ASTNodeType.ts';
import type {ASTNodeExpression} from './ASTNodeExpression.ts';
import type {ASTNodeVariable} from './ASTNodeVariable.ts';
import {
	buildDeco,
	ASTNodeStatement,
	StatementBreakable,
} from './ASTNodeStatement.ts';



export class ASTNodeStatementIteration extends StatementBreakable {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeStatementIteration {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeStatementIteration);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'statement_iteration'>,
		private readonly assignee: ASTNodeVariable | null,
		private readonly typenode: ASTNodeType,
		public  readonly iterable: ASTNodeExpression,
		public  readonly block:    ASTNodeBlock,
	) {
		super(start_node, {}, assignee ? [assignee, typenode, iterable, block] : [typenode, iterable, block]);
	}

	@memoizeGetter
	public override get isFoldable(): boolean {
		return !!this.iterable.fold() && this.block.isFoldable;
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		return this.iterable.type().isBottomType || this.block.hasBottomType;
	}

	public override varCheck(): void {
		// Do not call `super.varCheck()` as we don’t want to VarCheck `this.assignee`.
		xjs.Array.forEachAggregated([this.typenode, this.iterable], (c) => c.varCheck());
		if (this.assignee) {
			if (this.block.validator.hasSymbol(this.assignee.id)) {
				throw new AssignmentErrorDuplicateDeclaration(this.assignee);
			}
			this.block.validator.addSymbol(new SymbolSchemaVar(
				this.assignee,
				false, // because it should not be manually reassigned
				false, // because it won’t ever be nullish upon accessing
			));
		}
		this.block.varCheck(); // VarCheck(block) must come after assignee checks, because assignee may be referenced inside block
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
			assert.ok(this.block.validator.hasSymbol(this.assignee.id), `The validator symbol table should include ${ this.assignee.id }.`);
			(this.block.validator.getSymbol(this.assignee.id) as SymbolSchemaVar).type = assignee_type;
		}
		this.block.typeCheck();
	}

	@memoizeMethod
	public override lower(optimizer: Optimizer): void {
		const iterable: IR.Value = this.iterable.lower(optimizer).asTac(optimizer);
		const index              = optimizer.newTempLocal(new IR.Const(VALUE.NAT_0));
		const get_index          = new IR.Get(index);
		assert_instanceof(iterable.type, TYPE.List);

		this.labelWhile    = optimizer.newLabel();
		this.labelEndwhile = optimizer.newLabel();

		optimizer.pushInstruction(this.labels.while!);
		optimizer.pushInstruction(new IR.GotoIfFalse(new IR.Binop(
			IR.BinOp.LT,
			get_index,
			new IR.CollectionDynamicCount(IR.TypeName.LIST, iterable),
			TYPE.BOOL,
		), this.labels.endwhile!));
		if (this.assignee) {
			const symbol = this.block.validator.getSymbol(this.assignee.id) as SymbolSchemaVar;
			symbol.irType = iterable.type.typearg;
			optimizer.pushInstruction(new IR.Decl(
				symbol,
				new IR.CollectionDynamicGet(IR.TypeName.LIST, iterable, get_index, iterable.type.typearg),
			));
		}
		this.block.lower(optimizer);
		optimizer.pushInstruction(new IR.Set(index, new IR.Binop(IR.BinOp.NAT_ADD, get_index, new IR.Const(VALUE.NAT_1), index.type)));
		optimizer.pushInstruction(new IR.Goto(this.labels.while!));
		optimizer.pushInstruction(this.labels.endwhile!);
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		throw new Error('`ASTNodeStatementIteration#build` not yet supported.');
	}
}

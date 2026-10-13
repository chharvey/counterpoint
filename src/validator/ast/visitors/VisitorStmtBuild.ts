import * as assert from 'node:assert';
import {
	type Temp,
	type Builder,
	OP,
} from '../../../index.ts';
import {assert_instanceof} from '../../../lib/index.ts';
import {
	VALUE,
	TYPE,
} from '../../../typer/index.ts';
import type {SymbolSchemaVar} from '../../index.ts';
import {
	AstNodeVisitor,
	type AstNode,
} from '../AstNode.ts';
import type {Functionlike} from '../Functionlike.ts';
import type {ParameterFunction} from '../ParameterFunction.ts';
import type {Capture} from '../Capture.ts';
import type {Block} from '../Block.ts';
import type {Goal} from '../Goal.ts';
import * as EXPR from '../expression/index.ts';
import type * as STMT from '../statement/index.ts';
import {StatementBreakable} from '../statement/StatementBreakable.ts';
import {VisitorExprBuild} from './VisitorExprBuild.ts';



function runOncePerStmtNode<ProtoThis extends object, Param extends STMT.Statement>(
	method:   (this: ProtoThis, arg: Param) => void,
	_context: ClassMethodDecoratorContext<ProtoThis, typeof method>,
): typeof method {
	const memoset = new WeakSet<Param>();
	return function (arg) {
		if (!memoset.has(arg)) {
			memoset.add(arg);
			return method.call(this, arg);
		}
	};
}



export class VisitorStmtBuild extends AstNodeVisitor<void> {
	private readonly exprVisitor: VisitorExprBuild;


	public constructor(private readonly builder: Builder) {
		super();
		this.exprVisitor = new VisitorExprBuild(this.builder);
	}


	@runOncePerStmtNode
	public override visitParameterFunction(node: ParameterFunction): void {
		if (node.identifier) {
			const block: Block                        = (node.parent as Functionlike).block;
			const symbol                              = block.validator.getSymbol(node.id!) as SymbolSchemaVar;
			const default_value: OP.Value | undefined = node.expr ? this.exprVisitor.visit(node.expr) : node.optional ? new OP.MaybeNew(symbol.type) : undefined;
			symbol.irType = default_value?.type ?? symbol.type;
			return this.builder.pushInstruction(new OP.Decl(symbol, symbol.irType, default_value));
		}
	}

	@runOncePerStmtNode
	public override visitCapture(node: Capture): void {
		if (!node.ref) {
			const schema = (node.parent as Functionlike).block.validator.getSymbol(node.variable.id) as SymbolSchemaVar;
			schema.irType = schema.type;
			return this.builder.pushInstruction(new OP.Decl(schema, schema.irType, this.exprVisitor.visit(node.variable)));
		}
	}

	@runOncePerStmtNode
	public override visitBlock(node: Block): void {
		return node.children.forEach((stmt) => this.visit(stmt));
	}

	@runOncePerStmtNode
	public override visitGoal(node: Goal): void {
		node.block && this.visit(node.block);
		this.builder.terminateBlock(new OP.EndProgram());
		return this.builder.validate();
	}


	@runOncePerStmtNode
	public override visitDeclVariable(stmt: STMT.DeclarationVariable): void {
		const symbol: SymbolSchemaVar | undefined = stmt.assignee ? stmt.validator.getSymbol(stmt.id!) as SymbolSchemaVar : undefined;
		const value:  OP.Value                    = stmt.assigned ? this.exprVisitor.visit(stmt.assigned) : new OP.MaybeNew(symbol!.type);
		if (stmt.assignee) {
			symbol!.irType = value.type;
			return this.builder.pushInstruction(new OP.Decl(symbol!, symbol!.irType, value));
		} else {
			return this.builder.pushInstruction(new OP.Drop(value));
		}
	}

	@runOncePerStmtNode
	public override visitDeclFunction(stmt: STMT.DeclarationFunction): void {
		if (stmt.identifier) {
			const label_func:    string = this.builder.newLabel();
			const label_endfunc: string = this.builder.newLabel();

			this.builder.terminateBlock(new OP.Goto(label_endfunc));
			this.builder.initiateBlock(label_func);
			stmt.captures   .forEach((capt)  => this.visit(capt));
			stmt.parameters .forEach((param) => this.visit(param));
			this.visit(stmt.block);
			this.builder.pushInstruction(new OP.Drop(new OP.Trap()));
			this.builder.terminateBlock(new OP.EndProgram());
			return this.builder.initiateBlock(label_endfunc);
		}
	}

	@runOncePerStmtNode
	public override visitStmtExpr(stmt: STMT.StatementExpression): void {
		if (stmt.expr) {
			return this.builder.pushInstruction(new OP.Drop(this.exprVisitor.visit(stmt.expr)));
		}
	}

	@runOncePerStmtNode
	public override visitStmtClaim(stmt: STMT.StatementClaim): void {
		return this.builder.pushInstruction(new OP.Drop(this.exprVisitor.visit(stmt.assignee)));
	}

	@runOncePerStmtNode
	public override visitStmtReassignment(stmt: STMT.StatementReassignment): void {
		if (stmt.assignee instanceof EXPR.Variable) {
			const symbol = stmt.validator.getSymbol(stmt.assignee.id) as SymbolSchemaVar;
			let value: OP.Value;
			if (stmt.assigned) {
				value = this.exprVisitor.visit(stmt.assigned);
				if (symbol.isUninitialized) {
					value = new OP.MaybeNew(symbol.type, value.asTac(this.builder));
				}
			} else {
				value = new OP.MaybeNew(symbol.type);
			}
			symbol.irType = value.type;
			return this.builder.pushInstruction(new OP.Set(symbol, symbol.irType, value));
		} else if (stmt.assigned) {
			assert_instanceof(stmt.assignee.accessor, EXPR.Expression);
			const base_value:    OP.ValueTac = this.exprVisitor.visit(stmt.assignee.base).asTac(this.builder);
			const base_typename: OP.TypeName = OP.ast_type_name(base_value.type);
			assert.ok([OP.TypeName.LIST, OP.TypeName.DICT, OP.TypeName.SET, OP.TypeName.MAP].includes(base_typename), `Expected ${OP.TypeName[base_typename]} to be a dynamic collection.`);
			return this.builder.pushInstruction(new OP.CollectionDynamicSet(
				base_typename as OP.CollectionDynamicName,
				base_value,
				this.exprVisitor.visit(stmt.assignee.accessor) .asTac(this.builder),
				this.exprVisitor.visit(stmt.assigned)          .asTac(this.builder),
			));
		}
		return assert.fail('Expected `StatementReassignment#typeCheck` to throw by now.');
	}

	@runOncePerStmtNode
	public override visitStmtConditional(stmt: STMT.StatementConditional): void {
		let condition: () => OP.Value = () => this.exprVisitor.visit(stmt.condition);
		if (stmt.unless) {
			condition = () => new OP.Unop(OP.OpCode.NOT, this.exprVisitor.visit(stmt.condition).asTac(this.builder), TYPE.BOOL);
		}

		const label_then:  string = this.builder.newLabel();
		const label_else:  string = this.builder.newLabel();
		const label_endif: string = stmt.alternative ? this.builder.newLabel() : label_else;

		this.builder.terminateBlock(new OP.GotoConditional(condition(), label_then, stmt.alternative ? label_else : label_endif));

		this.builder.initiateBlock(label_then);
		this.visit(stmt.consequent);
		this.builder.terminateBlock(new OP.Goto(label_endif));

		if (stmt.alternative) {
			this.builder.initiateBlock(label_else);
			this.visit(stmt.alternative);
			this.builder.terminateBlock(new OP.Goto(label_endif));
		}

		return this.builder.initiateBlock(label_endif);
	}

	@runOncePerStmtNode
	public override visitStatementLoop(stmt: STMT.StatementLoop): void {
		let condition: () => OP.Value = () => this.exprVisitor.visit(stmt.condition);
		if (stmt.until) {
			condition = () => new OP.Unop(OP.OpCode.NOT, this.exprVisitor.visit(stmt.condition).asTac(this.builder), TYPE.BOOL);
		}

		stmt.labelWhile    = this.builder.newLabel();
		stmt.labelDo       = stmt.doFirst ? stmt.labels.while! : this.builder.newLabel();
		stmt.labelEndwhile = this.builder.newLabel();

		if (stmt.doFirst) {
			this.builder.terminateBlock(new OP.Goto(stmt.labels.do!));

			this.builder.initiateBlock(stmt.labels.do!);
			this.visit(stmt.block);
			this.builder.terminateBlock(new OP.GotoConditional(condition(), stmt.labels.do!, stmt.labels.endwhile!));
		} else {
			this.builder.terminateBlock(new OP.Goto(stmt.labels.while!));

			this.builder.initiateBlock(stmt.labels.while!);
			this.builder.terminateBlock(new OP.GotoConditional(condition(), stmt.labels.do!, stmt.labels.endwhile!));

			this.builder.initiateBlock(stmt.labels.do!);
			this.visit(stmt.block);
			this.builder.terminateBlock(new OP.Goto(stmt.labels.while!));
		}

		return this.builder.initiateBlock(stmt.labels.endwhile!);
	}

	@runOncePerStmtNode
	public override visitStatementIteration(stmt: STMT.StatementIteration): void {
		const iterable: OP.ValueTac = this.exprVisitor.visit(stmt.iterable).asTac(this.builder);
		const index:    Temp        = this.builder.newTemp(new OP.Const(VALUE.NAT_0));
		const get_index             = new OP.Get(index);
		assert_instanceof(iterable.type, TYPE.List);

		stmt.labelWhile    = this.builder.newLabel();
		stmt.labelDo       = this.builder.newLabel();
		stmt.labelEndwhile = this.builder.newLabel();

		this.builder.pushInstruction(new OP.Decl(index));
		this.builder.terminateBlock(new OP.Goto(stmt.labels.while!));

		this.builder.initiateBlock(stmt.labels.while!);
		this.builder.terminateBlock(new OP.GotoConditional(new OP.Binop(
			OP.OpCode.LT,
			get_index,
			new OP.Unop(OP.OpCode.LIST_COUNT, iterable, TYPE.NAT).asTac(this.builder),
			TYPE.BOOL,
		), stmt.labels.do!, stmt.labels.endwhile!));

		this.builder.initiateBlock(stmt.labels.do!);
		if (stmt.assignee) {
			const symbol = stmt.block.validator.getSymbol(stmt.id!) as SymbolSchemaVar;
			symbol.irType = iterable.type.typearg;
			this.builder.pushInstruction(new OP.Decl(
				symbol,
				symbol.irType,
				new OP.CollectionDynamicGet(OP.TypeName.LIST, iterable, get_index, iterable.type.typearg),
			));
		}
		this.visit(stmt.block);
		this.builder.pushInstruction(new OP.Set(index, new OP.Binop(OP.OpCode.NAT_ADD, get_index, new OP.Const(VALUE.NAT_1), index.type)));
		this.builder.terminateBlock(new OP.Goto(stmt.labels.while!));

		return this.builder.initiateBlock(stmt.labels.endwhile!);
	}

	@runOncePerStmtNode
	public override visitStatementBreak(stmt: STMT.StatementBreak): void {
		let labels: StatementBreakable['labels'] | undefined = undefined;
		let node:   AstNode | undefined                      = stmt.parent;
		while (node && labels === undefined) {
			if (node instanceof StatementBreakable) {
				labels = node.labels;
			}
			node = node.parent;
		}
		// we should already have labels by the time we reach the root node
		assert.ok(labels, 'Expected StatementBreak to be nested inside (directly or indirectly) a StatementBreakable.');
		assert.ok(labels.while && labels.endwhile, 'Expected containing StatementBreakable to have its labels already created.');
		this.builder.terminateBlock(new OP.Goto(stmt.skip ? labels.while : labels.endwhile));
		return this.builder.initiateBlock(this.builder.newLabel(true));
	}

	@runOncePerStmtNode
	public override visitStatementReturn(_stmt: STMT.StatementReturn): void {
		this.builder.terminateBlock(new OP.Goto('caller'));
		return this.builder.initiateBlock(this.builder.newLabel(true));
	}

	public override defaultVisit(_stmt: STMT.Statement): void {
		return;
	}
}

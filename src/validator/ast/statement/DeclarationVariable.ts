import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	type Builder,
	OP,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorMissingType,
} from '../../../index.ts';
import {
	assert_instanceof,
	runOnceMethod,
	memoizeGetter,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {
	VALUE,
	TYPE,
} from '../../../typer/index.ts';
import {SymbolSchemaVar} from '../../index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import {typecheck_assign} from '../AstNode.ts';
import type * as AST_TYPE from '../type/index.ts';
import * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';



function is_inferrable(node?: EXPR.Expression): boolean {
	return (
		[
			EXPR.Constant,
			EXPR.Template,
			EXPR.Call, // TODO: distinguish between constructor calls and function calls
		].some((klass) => (node instanceof klass)) ? true :
		node instanceof EXPR.Tuple  ? node.children.every((expr) => is_inferrable(expr)) :
		node instanceof EXPR.Record ? node.children.every((prop) => is_inferrable(prop.val)) :
		false
	);
}



function writable_inferred_type(node: EXPR.Expression): TYPE.Type {
	switch (true) {
		case node instanceof EXPR.Constant: {
			const value: VALUE.Primitive = node.interpreterValue;
			return (
				value instanceof VALUE.Null    ? TYPE.NULL :
				value instanceof VALUE.Boolean ? TYPE.BOOL :
				value instanceof VALUE.Symbol  ? TYPE.SYM :
				value instanceof VALUE.Integer ? TYPE.INT :
				value instanceof VALUE.Natural ? TYPE.NAT :
				value instanceof VALUE.Float   ? TYPE.FLOAT :
				value instanceof VALUE.String  ? TYPE.STR :
				assert.fail(`Expected ${ value } to be a primitive value.`)
			);
		}
		case node instanceof EXPR.Tuple: {
			return TYPE.Tuple.fromTypes(node.children.map((expr) => writable_inferred_type(expr)));
		}
		case node instanceof EXPR.Record: {
			return TYPE.Record.fromTypes(new Map(node.children.map((prop) => [prop.key.id, writable_inferred_type(prop.val)])));
		}
		case node instanceof EXPR.Call: { // TODO: distinguish between constructor calls and function calls
			return node.type();
		}
		default: {
			assert.fail(`${ node.source } should be an instance of ${ EXPR.Constant.name }, ${ EXPR.Tuple.name }, ${ EXPR.Record.name }, or ${ EXPR.Call.name }.`);
		}
	}
}



export class DeclarationVariable extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): DeclarationVariable {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, DeclarationVariable);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'declaration_variable', ['break']>,
		public  readonly writable: boolean,
		public  readonly assignee: EXPR.Variable | null,
		public  readonly typenode: AST_TYPE.Type | null,
		public  readonly assigned: EXPR.Expression | null,
	) {
		super(
			start_node,
			{writable},
			[
				...(assignee ? [assignee] : []),
				...(typenode ? [typenode] : []),
				...(assigned ? [assigned] : []),
			],
		);
	}

	@memoizeGetter
	public override get isFoldable(): boolean {
		/*
		 * Foldable cases:
		 * - `val _:        T = assigned_foldable;`
		 * - `val assignee: T = assigned_foldable;`
		 *
		 * Non-Foldable cases:
		 * - `val mut assignee?: T;`
		 * - `val mut assignee:  T = assigned_foldable;`
		 * - `val     _:         T = assigned_non_foldable;`
		 * - `val     assignee:  T = assigned_non_foldable;`
		 * - `val mut assignee:  T = assigned_non_foldable;`
		 *
		 * Syntactically impossible cases (for completion):
		 * - `val _?:        T;`
		 * - `val assignee?: T;`
		 * - `val mut _?:    T;`
		 * - `val mut _:     T = assigned_foldable;`
		 * - `val mut _:     T = assigned_non_foldable;`
		 */
		return !!this.assigned?.fold() && (!this.assignee || !this.writable);
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		return this.assigned?.type().isBottomType ?? false;
	}

	public override varCheck(): void {
		if (!this.writable) {
			assert.ok(this.assigned, `Symbol \`${ this.source }\` should be initialized with a value.`);
		}
		// Do not call `super.varCheck()` as we don’t want to VarCheck `this.assignee`. It’s called only during reassignment.
		xjs.Array.forEachAggregated([this.typenode, this.assigned], (c) => c?.varCheck());
		if (this.assignee) {
			if (this.validator.hasSymbol(this.assignee.id)) {
				throw new AssignmentErrorDuplicateDeclaration(this.assignee);
			}
			this.validator.addSymbol(new SymbolSchemaVar(this.assignee, this.writable, !this.assigned));
		}
	}

	public override typeCheck(): void {
		if (!this.typenode && !is_inferrable(this.assigned ?? undefined)) {
			throw new AssignmentErrorMissingType(this);
		}
		this.assigned?.typeCheck();
		const assignee_type: TYPE.Type = this.typenode?.eval() ?? (
			this.writable && ([
				EXPR.Constant,
				EXPR.Tuple,
				EXPR.Record,
			].some((klass) => (this.assigned instanceof klass))) ? writable_inferred_type(this.assigned!) :
			this.assigned instanceof EXPR.Template ? TYPE.STR :
			this.assigned!.type()
		);
		this.assigned && typecheck_assign(this.assigned, assignee_type, this);
		if (this.assignee) {
			assert.ok(this.validator.hasSymbol(this.assignee.id), `The validator symbol table should include ${ this.assignee.id }.`);
			const symbol = this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar;
			symbol.type = assignee_type;
			// TODO: move these next lines to the interpreter
			if (!symbol.type.hasMutable && !this.writable) {
				assert.ok(!symbol.isWritable, `Symbol \`${ symbol.source }\` should not be writable.`);
				symbol.value = this.assigned?.fold() ?? null;
			}
		}
	}

	@runOnceMethod
	public override build(builder: Builder): void {
		const value: OP.Value = this.assigned?.build(builder) ?? new OP.Const(VALUE.NULL);
		if (this.assignee) {
			const symbol = this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar;
			symbol.irType = value.type;
			builder.pushInstruction(new OP.Decl(symbol, value));
		} else {
			builder.pushInstruction(new OP.Drop(value));
		}
	}
}

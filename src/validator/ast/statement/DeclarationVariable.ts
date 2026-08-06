import * as assert from 'node:assert';
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
import type {Serializable} from '../../../parser/index.ts';
import {SymbolSchemaVar} from '../../index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import {Validator} from '../../Validator.ts';
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


	private readonly id?: bigint;


	public constructor(
		start_node: SyntaxNodeFamily<'declaration_variable', ['break']>,
		public  readonly writable: boolean,
		public  readonly assignee: Serializable | null,
		public  readonly typenode: AST_TYPE.Type | null,
		public  readonly assigned: EXPR.Expression | null,
	) {
		super(
			start_node,
			{writable},
			[
				...(typenode ? [typenode] : []),
				...(assigned ? [assigned] : []),
			],
		);
		if (this.assignee) {
			this.id = Validator.cookTokenIdentifier(this.assignee.source);
		}
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		return this.assigned?.type().isBottomType ?? false;
	}

	public override varCheck(): void {
		super.varCheck();
		if (this.assignee) {
			if (this.validator.hasSymbol(this.id!)) {
				throw new AssignmentErrorDuplicateDeclaration(this.assignee);
			}
			this.validator.addSymbol(new SymbolSchemaVar(this.id!, this.assignee, this.writable, !this.assigned));
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
			assert.ok(this.validator.hasSymbol(this.id!), `The validator symbol table should include ${ this.id }.`);
			const symbol = this.validator.getSymbol(this.id!) as SymbolSchemaVar;
			symbol.type = assignee_type;
		}
	}

	@runOnceMethod
	public override build(builder: Builder): void {
		const value: OP.Value | undefined = this.assigned?.build(builder);
		if (this.assignee) {
			const symbol = this.validator.getSymbol(this.id!) as SymbolSchemaVar;
			symbol.irType = value?.type ?? TYPE.NULL;
			builder.pushInstruction(new OP.Decl(symbol, symbol.irType, value));
		} else {
			builder.pushInstruction(new OP.Drop(value!));
		}
	}
}

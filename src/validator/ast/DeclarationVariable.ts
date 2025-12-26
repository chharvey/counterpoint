import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorMissingType,
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
import {SymbolSchemaVar} from '../index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {Type} from './Type.ts';
import type {Expression} from './Expression.ts';
import {Constant} from './Constant.ts';
import type {Variable} from './Variable.ts';
import {Template} from './Template.ts';
import {Tuple as AstTuple} from './Tuple.ts';
import {Record as AstRecord} from './Record.ts';
import {Call} from './Call.ts';
import {
	buildDeco,
	Statement,
} from './Statement.ts';



function is_inferrable(node?: Expression): boolean {
	return (
		[
			Constant,
			Template,
			Call, // TODO: distinguish between constructor calls and function calls
		].some((klass) => (node instanceof klass)) ? true :
		node instanceof AstTuple  ? node.children.every((expr) => is_inferrable(expr)) :
		node instanceof AstRecord ? node.children.every((prop) => is_inferrable(prop.val)) :
		false
	);
}



function unfixed_inferred_type(node: Expression): TYPE.Type {
	if (node instanceof Constant) {
		const value: VALUE.Primitive = node.fold();
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
	} else if (node instanceof AstTuple) {
		return TYPE.Tuple.fromTypes(node.children.map((expr) => unfixed_inferred_type(expr)));
	} else if (node instanceof AstRecord) {
		return TYPE.Record.fromTypes(new Map(node.children.map((prop) => [prop.key.id, unfixed_inferred_type(prop.val)])));
	} else if (node instanceof Call) { // TODO: distinguish between constructor calls and function calls
		return node.type();
	} else {
		assert.fail(`${ node.source } should be an instance of ${ Constant.name }, ${ AstTuple.name }, ${ AstRecord.name }, or ${ Call.name }.`);
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
		public  readonly unfixed:  boolean,
		public  readonly assignee: Variable | null,
		public  readonly typenode: Type | null,
		public  readonly assigned: Expression | null,
	) {
		super(
			start_node,
			{unfixed},
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
		return !!this.assigned?.fold() && (!this.assignee || !this.unfixed);
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		return this.assigned?.type().isBottomType ?? false;
	}

	public override varCheck(): void {
		if (!this.unfixed) {
			assert.ok(this.assigned, `Symbol \`${ this.source }\` should be initialized with a value.`);
		}
		// Do not call `super.varCheck()` as we don’t want to VarCheck `this.assignee`. It’s called only during reassignment.
		xjs.Array.forEachAggregated([this.typenode, this.assigned], (c) => c?.varCheck());
		if (this.assignee) {
			if (this.validator.hasSymbol(this.assignee.id)) {
				throw new AssignmentErrorDuplicateDeclaration(this.assignee);
			}
			this.validator.addSymbol(new SymbolSchemaVar(this.assignee, this.unfixed, !this.assigned));
		}
	}

	public override typeCheck(): void {
		if (!this.typenode && !is_inferrable(this.assigned ?? undefined)) {
			throw new AssignmentErrorMissingType(this);
		}
		this.assigned?.typeCheck();
		const assignee_type: TYPE.Type = this.typenode?.eval() ?? (
			this.unfixed && ([
				Constant,
				AstTuple,
				AstRecord,
			].some((klass) => (this.assigned instanceof klass))) ? unfixed_inferred_type(this.assigned!) :
			this.assigned instanceof Template ? TYPE.STR :
			this.assigned!.type()
		);
		this.assigned && ASTNodeCP.typeCheckAssign(this.assigned, assignee_type, this);
		if (this.assignee) {
			const value: VALUE.Value | null = this.assigned?.fold() ?? null; // fold first before checking, to rethrow any errors
			assert.ok(this.validator.hasSymbol(this.assignee.id), `The validator symbol table should include ${ this.assignee.id }.`);
			const symbol = this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar;
			symbol.type = assignee_type;
			if (!symbol.type.hasMutable && !this.unfixed) {
				assert.ok(!symbol.isUnfixed, `Symbol \`${ symbol.source }\` should not be unfixed.`);
				symbol.value = value;
			}
		}
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		const value: binaryen.ExpressionRef = this.assigned?.build() ?? VALUE.NULL.build(this.builder);
		return this.assignee
			? this.builder.teeLocal(this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar, value).set()
			: this.builder.module.drop(value);
	}
}

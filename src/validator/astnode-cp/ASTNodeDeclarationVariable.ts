import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	type Optimizer,
	IR,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorMissingType,
} from '../../index.ts';
import {
	assert_instanceof,
	runOnceMethod,
	memoizeGetter,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {SymbolSchemaVar} from '../index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {ASTNodeType} from './ASTNodeType.ts';
import type {ASTNodeExpression} from './ASTNodeExpression.ts';
import {ASTNodeConstant} from './ASTNodeConstant.ts';
import type {ASTNodeVariable} from './ASTNodeVariable.ts';
import {ASTNodeTemplate} from './ASTNodeTemplate.ts';
import {ASTNodeTuple} from './ASTNodeTuple.ts';
import {ASTNodeRecord} from './ASTNodeRecord.ts';
import {ASTNodeCall} from './ASTNodeCall.ts';
import {
	buildDeco,
	ASTNodeStatement,
} from './ASTNodeStatement.ts';



function is_inferrable(node?: ASTNodeExpression): boolean {
	return (
		[
			ASTNodeConstant,
			ASTNodeTemplate,
			ASTNodeCall, // TODO: distinguish between constructor calls and function calls
		].some((klass) => (node instanceof klass)) ? true :
		node instanceof ASTNodeTuple  ? node.children.every((expr) => is_inferrable(expr)) :
		node instanceof ASTNodeRecord ? node.children.every((prop) => is_inferrable(prop.val)) :
		false
	);
}



function writable_inferred_type(node: ASTNodeExpression): TYPE.Type {
	if (node instanceof ASTNodeConstant) {
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
	} else if (node instanceof ASTNodeTuple) {
		return TYPE.Tuple.fromTypes(node.children.map((expr) => writable_inferred_type(expr)));
	} else if (node instanceof ASTNodeRecord) {
		return TYPE.Record.fromTypes(new Map(node.children.map((prop) => [prop.key.id, writable_inferred_type(prop.val)])));
	} else if (node instanceof ASTNodeCall) { // TODO: distinguish between constructor calls and function calls
		return node.type();
	} else {
		assert.fail(`${ node.source } should be an instance of ${ ASTNodeConstant.name }, ${ ASTNodeTuple.name }, ${ ASTNodeRecord.name }, or ${ ASTNodeCall.name }.`);
	}
}



export class ASTNodeDeclarationVariable extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeDeclarationVariable {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeDeclarationVariable);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'declaration_variable', ['break']>,
		public  readonly writable: boolean,
		public  readonly assignee: ASTNodeVariable | null,
		public  readonly typenode: ASTNodeType | null,
		public  readonly assigned: ASTNodeExpression | null,
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
				ASTNodeConstant,
				ASTNodeTuple,
				ASTNodeRecord,
			].some((klass) => (this.assigned instanceof klass))) ? writable_inferred_type(this.assigned!) :
			this.assigned instanceof ASTNodeTemplate ? TYPE.STR :
			this.assigned!.type()
		);
		this.assigned && ASTNodeCP.typeCheckAssign(this.assigned, assignee_type, this);
		if (this.assignee) {
			const value: VALUE.Value | null = this.assigned?.fold() ?? null; // fold first before checking, to rethrow any errors
			assert.ok(this.validator.hasSymbol(this.assignee.id), `The validator symbol table should include ${ this.assignee.id }.`);
			const symbol = this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar;
			symbol.type = assignee_type;
			if (!symbol.type.hasMutable && !this.writable) {
				assert.ok(!symbol.isWritable, `Symbol \`${ symbol.source }\` should not be writable.`);
				symbol.value = value;
			}
		}
	}

	@runOnceMethod
	public override lower(optimizer: Optimizer): void {
		const value: IR.Value = this.assigned?.lower(optimizer) ?? new IR.Const(VALUE.NULL);
		if (this.assignee) {
			optimizer.pushInstruction(new IR.Decl(this.assignee));
			optimizer.pushInstruction(new IR.Set(this.assignee, value));
		} else {
			optimizer.pushInstruction(new IR.Drop(value));
		}
	}

	@buildDeco
	public override build(): binaryen.ExpressionRef {
		const value: binaryen.ExpressionRef = this.assigned?.build() ?? VALUE.NULL.build(this.builder);
		return this.assignee
			? this.builder.teeLocal(this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar, value).set()
			: this.builder.module.drop(value);
	}
}

import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	type TYPE,
	AssignmentErrorDuplicateDeclaration,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {SymbolSchemaVar} from '../index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import {if_constant_folding} from './Foldable.ts';
import type {ASTNodeType} from './ASTNodeType.ts';
import type {ASTNodeExpression} from './ASTNodeExpression.ts';
import type {ASTNodeVariable} from './ASTNodeVariable.ts';
import {
	buildDeco,
	ASTNodeStatement,
} from './ASTNodeStatement.ts';



export class ASTNodeDeclarationVariable extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeDeclarationVariable {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeDeclarationVariable);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'declaration_variable', ['break']>,
		public  readonly unfixed:  boolean,
		private readonly assignee: ASTNodeVariable | null,
		public  readonly typenode: ASTNodeType,
		public  readonly assigned: ASTNodeExpression | null,
	) {
		super(
			start_node,
			{unfixed},
			[
				...(assignee ? [assignee] : []),
				typenode,
				...(assigned ? [assigned] : []),
			],
		);
	}

	@if_constant_folding
	public override get isFoldable(): boolean {
		/*
		 * Foldable cases:
		 * - `let var _?:       T;`
		 * - `let     _:        T = assigned_foldable;`
		 * - `let var _:        T = assigned_foldable;`
		 * - `let     assignee: T = assigned_foldable;`
		 *
		 * Non-Foldable cases:
		 * - `let var assignee?: T;`
		 * - `let var assignee:  T = assigned_foldable;`
		 * - `let     _:         T = assigned_non_foldable;`
		 * - `let var _:         T = assigned_non_foldable;`
		 * - `let     assignee:  T = assigned_non_foldable;`
		 * - `let var assignee:  T = assigned_non_foldable;`
		 *
		 * Syntactically impossible cases (for completion):
		 * - `let _?:        T;`
		 * - `let assignee?: T;`
		 */
		return (
			!this.assigned          && !this.assignee ||
			!!this.assigned?.fold() && !(this.assignee && this.unfixed)
		);
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
		this.assigned?.typeCheck();
		const assignee_type: TYPE.Type = this.typenode.eval();
		this.assigned && ASTNodeCP.typeCheckAssign(this.assigned, assignee_type, this);
		if (this.assignee) {
			const value: VALUE.Value | null = this.assigned?.fold() ?? null; // fold first before checking, to rethrow any errors
			assert.ok(this.validator.hasSymbol(this.assignee.id), `The validator symbol table should include ${ this.assignee.id }.`);
			const symbol = this.validator.getSymbolInfo(this.assignee.id) as SymbolSchemaVar;
			symbol.type = assignee_type;
			if (this.validator.config.compilerOptions.constantFolding && !symbol.type.hasMutable && !this.unfixed) {
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
			? this.builder.teeLocal(this.validator.getSymbolInfo(this.assignee.id) as SymbolSchemaVar, value).set()
			: this.builder.module.drop(value);
	}
}

import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	type Optimizer,
	type Lowerable,
	IR,
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
import type {SyntaxNodeType} from '../utils-private.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {ASTNodeType} from './ASTNodeType.ts';
import type {ASTNodeExpression} from './ASTNodeExpression.ts';
import type {ASTNodeVariable} from './ASTNodeVariable.ts';
import {ASTNodeStatement} from './ASTNodeStatement.ts';



export class ASTNodeDeclarationVariable extends ASTNodeStatement implements Lowerable {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeDeclarationVariable {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeDeclarationVariable);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'declaration_variable'>,
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

	public override varCheck(): void {
		// Do not call `super.varCheck()` as we don’t want to VarCheck `this.assignee`. It’s called only during reassignment.
		if (!this.unfixed) {
			assert.ok(this.assigned, `Symbol \`${ this.source }\` should be initialized with a value.`);
		}
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
				assert.ok(!symbol.unfixed, `Symbol \`${ symbol.source }\` should not be unfixed.`);
				symbol.value = value;
			}
		}
	}

	public override build(): binaryen.ExpressionRef {
		if (
			this.validator.config.compilerOptions.constantFolding && this.assigned?.fold() &&
			(!this.unfixed || !this.assignee) ||
			!this.assignee && !this.assigned
		) {
			return this.builder.module.nop();
		}
		const value: binaryen.ExpressionRef = this.assigned?.build() ?? VALUE.NULL.build(this.builder);
		if (this.assignee) {
			return this.builder.teeLocal(this.assignee.id, value).set(ASTNodeStatement.coerceAssignment(
				this.builder.module,
				this.typenode.eval(),
				this.assigned?.type() ?? TYPE.NULL,
				value,
				this.validator.config.compilerOptions.intCoercion,
			));
		} else {
			return this.builder.module.drop(value);
		}
	}

	/**
	 * @inheritdoc
	 * @implements Lowerable
	 */
	@memoizeMethod
	public lower(optimizer: Optimizer): null {
		const is_foldable: boolean = !!this.assigned?.fold() && (!this.assignee || !this.unfixed); // TODO: v0.5: use decorator
		if (is_foldable) {
			return null;
		}
		const value: IR.Instruction = this.assigned?.lower() ?? VALUE.NULL.lower();
		optimizer.pushInstruction((this.assignee
			? new IR.Set(new IR.Variable(this.assignee), value)
			: new IR.Drop(value)
		));
		return null;
	}
}

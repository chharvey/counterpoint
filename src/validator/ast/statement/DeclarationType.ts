import * as assert from 'node:assert';
import {AssignmentErrorDuplicateDeclaration} from '../../../index.ts';
import {
	assert_instanceof,
	noopMethod,
	noopGetter,
	memoizeGetter,
	runOnceMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {TYPE} from '../../../typer/index.ts';
import {SymbolSchemaType} from '../../index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type * as AST_TYPE from '../type/index.ts';
import {Statement} from './Statement.ts';



export class DeclarationType extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): DeclarationType {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, DeclarationType);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'declaration_type'>,
		private readonly assignee: AST_TYPE.TypeAlias | null,
		public  readonly assigned: AST_TYPE.Type,
	) {
		super(start_node, {}, assignee ? [assignee, assigned] : [assigned]);
	}

	@noopGetter(memoizeGetter)
	public override get isFoldable(): boolean {
		return true;
	}

	@noopGetter(memoizeGetter)
	public override get hasBottomType(): boolean {
		return false;
	}

	public override varCheck(): void {
		// Do not call `super.varCheck()` as we don’t want to VarCheck `this.assignee`.
		this.assigned.varCheck();
		if (this.assignee) {
			if (this.validator.hasSymbol(this.assignee.id)) {
				throw new AssignmentErrorDuplicateDeclaration(this.assignee);
			}
			this.validator.addSymbol(new SymbolSchemaType(this.assignee));
		}
	}

	public override typeCheck(): void {
		const typevalue: TYPE.Type = this.assigned.eval(); // evaluate first before checking, to rethrow any errors
		if (this.assignee) {
			assert.ok(this.validator.hasSymbol(this.assignee.id), `The validator symbol table should include ${ this.assignee.id }.`);
			const symbol = this.validator.getSymbol(this.assignee.id) as SymbolSchemaType;
			symbol.typevalue = typevalue;
		}
	}

	@noopMethod(runOnceMethod)
	public override build(): void {
		return;
	}
}

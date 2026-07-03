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
import type {Serializable} from '../../../parser/index.ts';
import {SymbolSchemaType} from '../../index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Validator} from '../../Validator.ts';
import type * as AST_TYPE from '../type/index.ts';
import {Statement} from './Statement.ts';



export class DeclarationType extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): DeclarationType {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, DeclarationType);
		return statement;
	}


	private readonly id?: bigint;


	public constructor(
		start_node: SyntaxNodeType<'declaration_type'>,
		private readonly assignee: Serializable | null,
		public  readonly assigned: AST_TYPE.Type,
	) {
		super(start_node, {}, [assigned]);
		if (this.assignee) {
			this.id = Validator.cookTokenIdentifier(this.assignee.source);
		}
	}

	@noopGetter(memoizeGetter)
	public override get hasBottomType(): boolean {
		return false;
	}

	public override varCheck(): void {
		super.varCheck();
		if (this.assignee) {
			if (this.validator.hasSymbol(this.id!)) {
				throw new AssignmentErrorDuplicateDeclaration(this.assignee);
			}
			this.validator.addSymbol(new SymbolSchemaType(this.id!, this.assignee));
		}
	}

	public override typeCheck(): void {
		const typevalue: TYPE.Type = this.assigned.eval(); // evaluate first before checking, to rethrow any errors
		if (this.assignee) {
			assert.ok(this.validator.hasSymbol(this.id!), `The validator symbol table should include ${ this.id }.`);
			const symbol = this.validator.getSymbol(this.id!) as SymbolSchemaType;
			symbol.typevalue = typevalue;
		}
	}

	@noopMethod(runOnceMethod)
	public override build(): void {
		return;
	}
}

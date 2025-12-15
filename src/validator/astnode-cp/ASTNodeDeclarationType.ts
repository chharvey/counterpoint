import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	type TYPE,
	AssignmentErrorDuplicateDeclaration,
} from '../../index.ts';
import {assert_instanceof} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {SymbolSchemaType} from '../index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeType} from './ASTNodeType.ts';
import type {ASTNodeTypeAlias} from './ASTNodeTypeAlias.ts';
import {
	buildDeco,
	ASTNodeStatement,
} from './ASTNodeStatement.ts';



export class ASTNodeDeclarationType extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeDeclarationType {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeDeclarationType);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'declaration_type'>,
		private readonly assignee: ASTNodeTypeAlias | null,
		public  readonly assigned: ASTNodeType,
	) {
		super(start_node, {}, assignee ? [assignee, assigned] : [assigned]);
	}

	// @memoizeGetter // memoizing takes longer than returning a constant
	public override get isFoldable(): boolean {
		return true;
	}

	// @memoizeGetter // memoizing takes longer than returning a constant
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
			const symbol = this.validator.getSymbolInfo(this.assignee.id) as SymbolSchemaType;
			symbol.typevalue = typevalue;
		}
	}

	@buildDeco
	public override build(): binaryen.ExpressionRef {
		assert.fail('Expected `ASTNodeDeclarationType#isFoldable` to be true.');
	}
}

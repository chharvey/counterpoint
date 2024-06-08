import * as assert from 'assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	type OBJ,
	type TYPE,
	AssignmentErrorDuplicateDeclaration,
} from '../../index.js';
import {assert_instanceof} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import {SymbolStructureVar} from '../index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeType} from './ASTNodeType.js';
import type {ASTNodeExpression} from './ASTNodeExpression.js';
import type {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeDeclarationVariable extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeDeclarationVariable {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeDeclarationVariable);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'declaration_variable'>,
		public  readonly unfixed:  boolean,
		private readonly assignee: ASTNodeVariable | null,
		public readonly typenode: ASTNodeType,
		public readonly assigned: ASTNodeExpression,
	) {
		super(
			start_node,
			{unfixed},
			(assignee) ? [assignee, typenode, assigned] : [typenode, assigned],
		);
	}

	public override varCheck(): void {
		xjs.Array.forEachAggregated([this.typenode, this.assigned], (c) => c.varCheck());
		if (this.assignee) {
			if (this.validator.hasSymbol(this.assignee.id)) {
				throw new AssignmentErrorDuplicateDeclaration(this.assignee);
			}
			this.validator.addSymbol(new SymbolStructureVar(this.assignee, this.unfixed));
		}
	}

	public override typeCheck(): void {
		this.assigned.typeCheck();
		const assignee_type: TYPE.Type = this.typenode.eval();
		ASTNodeCP.assignExpression(this.assigned, assignee_type, this);
		if (this.assignee) {
			const value: OBJ.Object | null = this.assigned.fold(); // fold first before checking, to rethrow any errors
			assert.ok(this.validator.hasSymbol(this.assignee.id), `The validator symbol table should include ${ this.assignee.id }.`);
			const symbol = this.validator.getSymbolInfo(this.assignee.id) as SymbolStructureVar;
			symbol.type = assignee_type;
			if (this.validator.config.compilerOptions.constantFolding && !symbol.type.hasMutable && !this.unfixed) {
				assert.ok(!symbol.unfixed, `${ symbol } should not be unfixed.`);
				symbol.value = value;
			}
		}
	}

	public override build(): binaryen.ExpressionRef {
		if (
			   this.validator.config.compilerOptions.constantFolding && this.assigned.fold()
			&& (!this.unfixed || !this.assignee)
		) {
			return this.builder.module.nop();
		}
		const value: binaryen.ExpressionRef = this.assigned.build();
		if (this.assignee) {
			const assignee_type: TYPE.Type = this.typenode.eval(); // eval first before adding, to rethrow any errors
			const local = this.builder.addLocal(this.assignee.id, binaryen.v128)[0].getLocalInfo(this.assignee.id)!;
			return this.builder.module.local.set(local.index, ASTNodeStatement.coerceAssignment(
				this.builder.module,
				assignee_type,
				this.assigned.type(),
				value,
				this.validator.config.compilerOptions.intCoercion,
			));
		} else {
			return this.builder.module.drop(value);
		}
	}
}

import type binaryen from 'binaryen';
import {
	TYPE,
	TypeErrorNotNarrow,
} from '../../index.js';
import {assert_instanceof} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SymbolSchemaVar} from '../index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {if_constant_folding} from './Foldable.ts';
import {ASTNodeIndex} from './ASTNodeIndex.js';
import {ASTNodeKey} from './ASTNodeKey.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeVariable} from './ASTNodeVariable.js';
import {ASTNodeAccess} from './ASTNodeAccess.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeDeclarationClaim extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeDeclarationClaim {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeDeclarationClaim);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'declaration_claim'>,
		private readonly assignee: ASTNodeVariable | ASTNodeAccess,
		private readonly claimed_type: ASTNodeType,
	) {
		super(start_node, {}, [assignee, claimed_type]);
	}

	@if_constant_folding
	public override get isFoldable(): boolean {
		return true;
	}

	public override typeCheck(): void {
		super.typeCheck();
		const computed_type: TYPE.Type = this.assignee.type();
		const claimed_type:  TYPE.Type = this.claimed_type.eval();
		/* Type claim statements can only narrow the expression’s type. */
		if (!claimed_type.isSubtypeOf(computed_type)) {
			throw new TypeErrorNotNarrow(claimed_type, computed_type, this.line_index, this.col_index);
		}
		if (this.assignee instanceof ASTNodeVariable) {
			const symbol: SymbolSchemaVar | null = this.validator.getSymbolInfo(this.assignee.id) as SymbolSchemaVar | null;
			if (symbol) {
				symbol.type = claimed_type;
			}
		} else {
			assert_instanceof(this.assignee, ASTNodeAccess);
			const base_type: TYPE.Type = this.assignee.base.type();
			const {accessor} = this.assignee;
			switch (true) {
				case base_type instanceof TYPE.Tuple: {
					assert_instanceof(accessor, ASTNodeIndex);
					return base_type.set(accessor.index, claimed_type, accessor);
				}
				case base_type instanceof TYPE.Record: {
					assert_instanceof(accessor, ASTNodeKey);
					return base_type.set(accessor.id, claimed_type, accessor);
				}
				default: {
					assert_instanceof(accessor, ASTNodeExpression);
					throw new Error('`ASTNodeDeclarationClaim[assignee: ASTNodeAccess[accessor: ASTNodeExpression]]#typeCheck` not yet supported.');
				}
			}
		}
	}

	public override build(): binaryen.ExpressionRef {
		return this.builder.module.nop();
	}
}

import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	TYPE,
	TypeErrorNotNarrow,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SymbolSchemaVar} from '../index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {ASTNodeIndex} from './ASTNodeIndex.ts';
import {ASTNodeKey} from './ASTNodeKey.ts';
import type {ASTNodeType} from './ASTNodeType.ts';
import {ASTNodeExpression} from './ASTNodeExpression.ts';
import {ASTNodeVariable} from './ASTNodeVariable.ts';
import {ASTNodeAccess} from './ASTNodeAccess.ts';
import {
	lowerDeco,
	buildDeco,
	ASTNodeStatement,
} from './ASTNodeStatement.ts';



export class ASTNodeStatementClaim extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeStatementClaim {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeStatementClaim);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'statement_claim', ['break']>,
		private readonly assignee: ASTNodeVariable | ASTNodeAccess,
		private readonly claimed_type: ASTNodeType,
	) {
		super(start_node, {}, [assignee, claimed_type]);
	}

	// @memoizeGetter // memoizing takes longer than returning a constant
	public override get isFoldable(): boolean {
		return true;
	}

	// @memoizeGetter // memoizing takes longer than returning a constant
	public override get hasBottomType(): boolean {
		return false;
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
			const symbol = this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar | undefined;
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
					throw new Error('`ASTNodeStatementClaim[assignee: ASTNodeAccess[accessor: ASTNodeExpression]]#typeCheck` not yet supported.');
				}
			}
		}
	}

	@memoizeMethod
	@lowerDeco
	public override lower(): null {
		assert.fail('Expected `ASTNodeStatementClaim#isFoldable` to be true.');
	}

	@buildDeco
	public override build(): binaryen.ExpressionRef {
		assert.fail('Expected `ASTNodeStatementClaim#isFoldable` to be true.');
	}
}

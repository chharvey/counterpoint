import type binaryen from 'binaryen';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeBlock} from './index.ts';
import {if_constant_folding} from './Foldable.ts';
import type {ASTNodeType} from './ASTNodeType.ts';
import type {ASTNodeExpression} from './ASTNodeExpression.ts';
import type {ASTNodeVariable} from './ASTNodeVariable.ts';
import {
	buildDeco,
	ASTNodeStatement,
} from './ASTNodeStatement.ts';



export class ASTNodeStatementIteration extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeStatementIteration {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeStatementIteration);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'statement_iteration'>,
		private readonly assignee: ASTNodeVariable | null,
		private readonly typenode: ASTNodeType,
		public  readonly iterable: ASTNodeExpression,
		public  readonly block:    ASTNodeBlock,
	) {
		super(start_node, {}, assignee ? [assignee, typenode, iterable, block] : [typenode, iterable, block]);
	}

	@if_constant_folding
	public override get isFoldable(): boolean {
		throw new Error('TODO:');
	}

	public override typeCheck(): void {
		throw new Error('TODO:');
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		throw new Error('TODO:');
	}
}

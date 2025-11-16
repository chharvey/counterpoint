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
import type {ASTNodeExpression} from './ASTNodeExpression.ts';
import {
	buildDeco,
	ASTNodeStatement,
} from './ASTNodeStatement.ts';



export class ASTNodeStatementLoop extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeStatementLoop {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeStatementLoop);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'statement_loop'>,
		private readonly doFirst:   boolean,
		private readonly until:     boolean,
		public  readonly condition: ASTNodeExpression,
		public  readonly block:     ASTNodeBlock,
	) {
		super(start_node, {doFirst, until}, [condition, block]);
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

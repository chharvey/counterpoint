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
import {if_constant_folding} from './Foldable.ts';
import {
	buildDeco,
	ASTNodeStatement,
} from './ASTNodeStatement.ts';



export class ASTNodeStatementBreak extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeStatementBreak {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeStatementBreak);
		return statement;
	}


	public constructor(
		start_node: SyntaxNodeType<'statement_break'>,
		private readonly continu: boolean,
	) {
		super(start_node, {}, []);
	}

	@if_constant_folding
	public override get isFoldable(): boolean {
		return false; // break statements will always have side-effects
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		this.continu;
		throw new Error('`ASTNodeStatementBreak#build` not yet supported.');
	}
}

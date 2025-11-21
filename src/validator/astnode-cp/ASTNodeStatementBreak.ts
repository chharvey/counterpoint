import * as assert from 'node:assert';
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
import {Validator} from '../Validator.ts';
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


	public readonly depth: bigint;

	public constructor(
		start_node: SyntaxNodeType<'statement_break'>,
		private readonly continu: boolean,
		integer?: SyntaxNodeType<'integer'>,
	) {
		super(start_node, {}, []);
		if (integer) {
			// copied from `./ASTNodeIndex.ts`
			const cooked: bigint | number = Validator.cookTokenNumber(integer.text);
			assert.ok(typeof cooked === 'bigint', 'Cooked value should be a bigint.'); // better type guard than `assert.strictEqual`
			this.depth = cooked;
		} else {
			this.depth = 0n;
		}
	}

	@if_constant_folding
	public override get isFoldable(): boolean {
		return false; // break statements will always have side-effects
	}

	public override varCheck(): void {
		super.varCheck();
		this.continu;
		// TODO: check if depth is valid
		throw new Error('`ASTNodeStatementBreak#varCheck` not yet supported.');
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		throw new Error('`ASTNodeStatementBreak#build` not yet supported.');
	}
}

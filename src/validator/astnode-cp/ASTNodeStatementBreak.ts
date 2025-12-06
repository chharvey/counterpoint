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
import {if_constant_folding} from './Foldable.ts';
import type {ASTNodeCP} from './ASTNodeCP.ts';
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
		private readonly skip: boolean,
	) {
		super(start_node, {}, []);
	}

	// @memoizeGetter // memoizing takes longer than returning a constant
	@if_constant_folding
	public override get isFoldable(): boolean {
		return false; // break statements will always have side-effects
	}

	// @memoizeGetter // memoizing takes longer than returning a constant
	public override get hasBottomType(): boolean {
		return false;
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		let block_index: number | undefined = undefined;
		let node = this.parent as ASTNodeCP | undefined;
		while (node && block_index === undefined) {
			block_index = this.builder.getBlock(node)?.index;
			node = node.parent as ASTNodeCP | undefined;
		}
		// we should already have an index by the time we reach the root node
		assert.ok(typeof block_index === 'number', 'Expected builder to store the containing loop/iteration block of this statement.'); // better type guard than `assert.strictEqual`
		return this.builder.module.br(this.skip ? `body${ block_index }` : `exit${ block_index }`);
	}
}

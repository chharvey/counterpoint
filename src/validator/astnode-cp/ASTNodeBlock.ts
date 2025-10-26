import * as assert from 'node:assert';
import binaryen from 'binaryen';
import type {NonemptyArray} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {ASTNodeGoal} from './index.ts';
import type {Buildable} from './Buildable.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {ASTNodeStatement} from './ASTNodeStatement.ts';



export class ASTNodeBlock extends ASTNodeCP implements Buildable {
	/**
	 * Construct a new ASTNodeGoal from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeGoal representing the given source
	 */
	public static fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeBlock {
		const goal: ASTNodeGoal = ASTNodeGoal.fromSource(src, config);
		assert.ok(goal.block, 'semantic goal should have 1 child');
		return goal.block;
	}

	public constructor(
		start_node: SyntaxNodeType<'block'>,
		public override readonly children: Readonly<NonemptyArray<ASTNodeStatement>>,
	) {
		super(start_node, {}, children);
	}

	/** @implements Buildable */
	public build(): binaryen.ExpressionRef {
		assert.ok(this.children.length, 'Expected ASTNodeBlock to contain at least 1 child.');
		this.builder.setupModule((mod) => {
			if (this.children.length) {
				const statements: binaryen.ExpressionRef[] = this.children.map((stmt) => stmt.build()); // must build before calling `.getLocals()`
				const fn_name:    string                   = 'fn0';
				mod.addFunction(
					fn_name,
					binaryen.none,
					binaryen.none,
					this.builder.getLocals().map((var_) => var_.type),
					mod.block(null, statements),
				);
				mod.addFunctionExport(fn_name, fn_name);
			}
		});
		return this.builder.module.nop();
	}
}

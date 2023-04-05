import * as assert from 'assert';
import binaryen from 'binaryen';
import type {Builder} from '../../index.js';
import type {NonemptyArray} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {ASTNodeGoal} from './index.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeStatement} from './ASTNodeStatement.js';



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
	public build(builder: Builder): binaryen.ExpressionRef | binaryen.Module {
		if (!this.children.length) {
			return builder.module.nop();
		} else {
			const statements: binaryen.ExpressionRef[] = this.children.map((stmt) => stmt.build(builder)); // must build before calling `.getLocals()`
			const fn_name:    string                   = 'fn0';
			builder.module.addFunction(
				fn_name,
				binaryen.none,
				binaryen.none,
				builder.getLocals().map((var_) => var_.type),
				builder.module.block(null, [...statements]),
			);
			builder.module.addFunctionExport(fn_name, fn_name);
			return builder.module;
		}
	}
}

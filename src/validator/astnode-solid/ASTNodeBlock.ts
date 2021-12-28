import * as assert from 'assert';
import {
	INST,
	Builder,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
} from './package.js';
import {ASTNodeGoal} from './index.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import type {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeBlock extends ASTNodeSolid implements Buildable {
	/**
	 * Construct a new ASTNodeGoal from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeGoal representing the given source
	 */
	static fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeBlock {
		const goal: ASTNodeGoal = ASTNodeGoal.fromSource(src, config);
		assert.ok(goal.block, 'semantic goal should have 1 child');
		return goal.block;
	}
	constructor(
		start_node: ParseNode,
		override readonly children: readonly ASTNodeStatement[],
	) {
		super(start_node, {}, children);
	}
	/** @implements Buildable */
	build(builder: Builder): INST.InstructionNone | INST.InstructionModule {
		return (!this.children.length)
			? new INST.InstructionNone()
			: new INST.InstructionModule([
				...Builder.IMPORTS,
				...this.children.map((child) => child.build(builder)),
			]);
	}
}

import * as assert from 'assert';
import {
	NonemptyArray,
	INST,
	Builder,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
	Validator,
} from './package.js';
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


	private readonly _validator: Validator;

	public constructor(
		start_node: SyntaxNodeType<'block'>,
		public override readonly children: Readonly<NonemptyArray<ASTNodeStatement>>,
		config: CPConfig,
	) {
		super(start_node, {}, children);
		this._validator = new Validator(config);
	}

	public override get validator(): Validator {
		return this._validator;
	}

	/** @implements Buildable */
	public build(builder: Builder): INST.InstructionModule {
		return new INST.InstructionModule([
			...Builder.IMPORTS,
			...this.children.map((child) => child.build(builder)),
		]);
	}
}

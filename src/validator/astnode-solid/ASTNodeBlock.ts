import * as assert from 'assert';
import {
	NonemptyArray,
	INST,
	Builder,
	SolidConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
	Validator,
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


	private readonly _validator: Validator;

	constructor (
		start_node: SyntaxNodeType<'block'>,
		override readonly children: Readonly<NonemptyArray<ASTNodeStatement>>,
		config: SolidConfig,
	) {
		super(start_node, {}, children);
		this._validator = new Validator(config);
	}

	override get validator(): Validator {
		return this._validator;
	}

	/** @implements Buildable */
	build(builder: Builder): INST.InstructionModule {
		return new INST.InstructionModule([
			...Builder.IMPORTS,
			...this.children.map((child) => child.build(builder)),
		]);
	}
}

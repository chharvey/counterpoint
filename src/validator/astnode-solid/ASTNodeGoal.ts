import {
	INST,
	Builder,
	SolidConfig,
	CONFIG_DEFAULT,
	ParseNode,
	ParserSolid,
	PARSER,
	DECORATOR,
	Validator,
} from './package.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import type {ASTNodeBlock} from './ASTNodeBlock.js';



export class ASTNodeGoal extends ASTNodeSolid implements Buildable {
	/**
	 * Construct a new ASTNodeGoal from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeGoal representing the given source
	 */
	static fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeGoal {
		return DECORATOR.decorate(((config === CONFIG_DEFAULT) ? PARSER : new ParserSolid(config)).parse(src), config);
	}
	private readonly _validator: Validator;
	constructor(
		start_node: ParseNode,
		readonly block: ASTNodeBlock | null,
		config: SolidConfig,
	) {
		super(start_node, {}, (block) ? [block] : []);
		this._validator = new Validator(config);
	}
	override get validator(): Validator {
		return this._validator;
	}
	/** @implements Buildable */
	build(builder: Builder): INST.InstructionNone | INST.InstructionModule {
		return this.block?.build(builder) || new INST.InstructionNone();
	}
}
import {
	INST,
	Builder,
	CPConfig,
	CONFIG_DEFAULT,
	TS_PARSER,
	DECORATOR,
	Validator,
	SyntaxNodeType,
} from './package.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeBlock} from './ASTNodeBlock.js';



export class ASTNodeGoal extends ASTNodeCP implements Buildable {
	/**
	 * Construct a new ASTNodeGoal from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeGoal representing the given source
	 */
	public static fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeGoal {
		return DECORATOR.decorateTS(TS_PARSER.parse(src).rootNode as SyntaxNodeType<'source_file'>, config);
	}

	private readonly _validator: Validator;
	public constructor(
		start_node: SyntaxNodeType<'source_file'>,
		public readonly block: ASTNodeBlock | null,
		config: CPConfig,
	) {
		super(start_node, {}, (block) ? [block] : []);
		this._validator = new Validator(config);
	}

	public override get validator(): Validator {
		return this._validator;
	}

	/** @implements Buildable */
	public build(builder: Builder): INST.InstructionNone | INST.InstructionModule {
		return this.block?.build(builder) || new INST.InstructionNone();
	}
}

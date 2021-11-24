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
import type {ASTNodeStatement} from './ASTNodeStatement.js';



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
		override readonly children: readonly ASTNodeStatement[],
		config: SolidConfig,
	) {
		super(start_node, {}, children)
		this._validator = new Validator(config);
	}
	override get validator(): Validator {
		return this._validator;
	}
	build(builder: Builder): INST.InstructionNone | INST.InstructionModule {
		return (!this.children.length)
			? new INST.InstructionNone()
			: new INST.InstructionModule([
				...Builder.IMPORTS,
				...(this.children as readonly ASTNodeStatement[]).map((child) => child.build(builder)),
			])
	}
}

import binaryen from 'binaryen';
import {
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
	/** @implements Buildable */
	public build(builder: Builder): binaryen.ExpressionRef | binaryen.Module {
		if (!this.children.length) {
			return builder.module.nop();
		} else {
			const statements: binaryen.ExpressionRef[] = this.children.map((stmt) => stmt.build(builder)); // must build before calling `.getLocals()`
			const fn_name:    string                   = 'fn0';
			builder.module.addFunction(
				fn_name,
				binaryen.createType([]),
				binaryen.createType([]),
				builder.getLocals().map((var_) => var_.type),
				builder.module.block(null, [...statements]),
			);
			builder.module.addFunctionExport(fn_name, fn_name);

			const validation = builder.module.validate();
			if (!validation) {
				throw new Error('Invalid WebAssembly module.');
			}
			return builder.module;
		}
	}
}

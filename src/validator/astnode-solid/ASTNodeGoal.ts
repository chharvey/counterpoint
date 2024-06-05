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


	readonly #validator: Validator;
	readonly #builder:   Builder;


	constructor(
		start_node: ParseNode,
		override readonly children: readonly ASTNodeStatement[],
		config: SolidConfig,
	) {
		super(start_node, {}, children)
		this.#validator = new Validator(config);
		this.#builder   = new Builder(this.source, config);
	}

	override get validator(): Validator {
		return this.#validator;
	}

	override get builder(): Builder {
		return this.#builder;
	}

	/** @implements Buildable */
	public build(): binaryen.ExpressionRef | binaryen.Module {
		if (!this.children.length) {
			return this.builder.module.nop();
		} else {
			const statements: binaryen.ExpressionRef[] = this.children.map((stmt) => stmt.build()); // must build before calling `.getLocals()`
			const fn_name:    string                   = 'fn0';
			this.builder.module.addFunction(
				fn_name,
				binaryen.none,
				binaryen.none,
				this.builder.getLocals().map((var_) => var_.type),
				this.builder.module.block(null, statements),
			);
			this.builder.module.addFunctionExport(fn_name, fn_name);
			return this.builder.module;
		}
	}
}

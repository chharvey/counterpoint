import * as xjs from 'extrajs';
import binaryen from 'binaryen';
import type {SyntaxNode} from 'tree-sitter';
import {
	Builder,
	ParseError01,
} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {
	TS_PARSER,
	type Serializable,
	to_serializable,
} from '../../parser/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {Decorator} from '../Decorator.ts';
import {Validator} from '../Validator.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {Buildable} from './Buildable.ts';
import type {ASTNodeBlock} from './Block.ts';



function report_syntax_errors(node: SyntaxNode): void {
	xjs.Array.forEachAggregated<SyntaxNode>(node.children, (n) => {
		if (n.type === 'ERROR') {
			throw new ParseError01(to_serializable(n));
		} else if (n.type === 'MISSING' || n.text === '') {
			const serializable: Serializable = to_serializable(n);
			const err = new ParseError01(to_serializable(n));
			// @ts-expect-error --- TODO: write class for `ParseError02`
			err.message = (n.type === 'MISSING')
				? err.message.replace(/Unexpected/, 'Expected')
				: `Expected token: \`${ n.type }\` at line ${ serializable.line_index + 1 } col ${ serializable.col_index + 1 }.`;
			throw err;
		} else if (n.childCount > 0) {
			report_syntax_errors(n);
		}
	});
}



export class ASTNodeGoal extends ASTNodeCP implements Buildable {
	/**
	 * Construct a new ASTNodeGoal from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeGoal representing the given source
	 */
	public static fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ASTNodeGoal {
		const root_node = TS_PARSER.parse(src).rootNode as SyntaxNodeType<'source_file'>;
		report_syntax_errors(root_node);
		return new Decorator(config).decorateTS(root_node);
	}


	readonly #validator: Validator;
	readonly #builder:   Builder;


	public constructor(
		start_node: SyntaxNodeType<'source_file'>,
		public readonly block: ASTNodeBlock | null,
		config: CplConfig,
	) {
		super(start_node, {}, (block) ? [block] : []);
		this.#validator = new Validator(config);
		this.#builder   = new Builder();
	}

	public override get validator(): Validator {
		return this.#validator;
	}

	public override get builder(): Builder {
		return this.#builder;
	}

	/** @implements Buildable */
	@memoizeMethod
	public build(): binaryen.ExpressionRef {
		if (this.block) {
			const block_build: binaryen.ExpressionRef = this.block.build(); // must build before calling `.getLocals()`
			this.builder.setupModule((mod) => {
				const fn_name: string = 'fn0';
				mod.addFunction(
					fn_name,
					binaryen.none,
					binaryen.none,
					this.builder.getAllLocals().map((var_) => var_.type),
					block_build,
				);
				mod.addFunctionExport(fn_name, fn_name);
			});
		}
		return this.builder.module.nop();
	}
}

import * as xjs from 'extrajs';
import binaryen from 'binaryen';
import type {SyntaxNode} from 'tree-sitter';
import {
	Builder,
	ParseError01,
} from '../../index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {
	TS_PARSER,
	type Serializable,
	to_serializable,
} from '../../parser/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {DECORATOR} from '../Decorator.ts';
import {Validator} from '../Validator.ts';
import type {Buildable} from './Buildable.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {ASTNodeStatement} from './ASTNodeStatement.ts';



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
	public static fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeGoal {
		const root_node = TS_PARSER.parse(src).rootNode as SyntaxNodeType<'source_file'>;
		report_syntax_errors(root_node);
		return DECORATOR.decorateTS(root_node, config);
	}


	readonly #validator: Validator;
	readonly #builder:   Builder;


	public constructor(
		start_node: SyntaxNodeType<'source_file'>,
		public override readonly children: readonly ASTNodeStatement[],
		config: CPConfig,
	) {
		super(start_node, {}, children);
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
	public build(): binaryen.ExpressionRef {
		this.builder.setupModule((mod) => {
			if (this.children.length) {
				const statements: binaryen.ExpressionRef[] = this.children.map((stmt) => stmt.build()); // must build before calling `.getLocals()`
				const fn_name:    string                   = 'fn0';
				mod.addFunction(
					fn_name,
					binaryen.none,
					binaryen.none,
					this.builder.getLocals().map((var_) => var_.type),
					mod.block(null, statements),
				);
				mod.addFunctionExport(fn_name, fn_name);
			}
		});
		return this.builder.module.nop();
	}
}

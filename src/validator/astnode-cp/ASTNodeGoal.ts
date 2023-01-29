import * as xjs from 'extrajs';
import binaryen from 'binaryen';
import type {SyntaxNode} from 'tree-sitter';
import {
	Builder,
	ParseError01,
	CPConfig,
	CONFIG_DEFAULT,
	TS_PARSER,
	Serializable,
	to_serializable,
	DECORATOR,
	Validator,
	SyntaxNodeType,
} from './package.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeStatement} from './ASTNodeStatement.js';



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

	private readonly _validator: Validator;
	public constructor(
		start_node: SyntaxNodeType<'source_file'>,
		public override readonly children: readonly ASTNodeStatement[],
		config: CPConfig,
	) {
		super(start_node, {}, children);
		this._validator = new Validator(config);
	}

	public override get validator(): Validator {
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

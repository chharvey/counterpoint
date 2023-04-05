import * as xjs from 'extrajs';
import type binaryen from 'binaryen';
import type {SyntaxNode} from 'tree-sitter';
import {
	type Builder,
	ParseError01,
} from '../../index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import {
	TS_PARSER,
	type Serializable,
	to_serializable,
} from '../../parser/index.js';
import {
	DECORATOR,
	Validator,
} from '../index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeBlock} from './ASTNodeBlock.js';



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
	public build(builder: Builder): binaryen.ExpressionRef | binaryen.Module {
		return this.block?.build(builder) || builder.module.nop();
	}
}

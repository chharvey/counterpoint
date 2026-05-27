import * as xjs from 'extrajs';
import type {SyntaxNode} from 'tree-sitter';
import {
	type Builder,
	OP,
	ParseError01,
} from '../../index.ts';
import {runOnceMethod} from '../../lib/index.ts';
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
import {AstNode} from './AstNode.ts';
import type {Buildable} from './Buildable.ts';
import type {Block} from './Block.ts';



function report_syntax_errors(node: SyntaxNode): void {
	xjs.Array.forEachAggregated<SyntaxNode>(node.children, (n) => {
		if (n.type === 'ERROR') {
			throw new ParseError01(to_serializable(n));
		} else if (n.type === 'MISSING' || n.text === '') {
			const serializable: Serializable = to_serializable(n);
			const err = new ParseError01(serializable);
			// @ts-expect-error --- TODO: write class for `ParseError02`
			err.message = (n.type === 'MISSING')
				? err.message.replace(/Unexpected/, 'Expected')
				: `Expected token: \`${ n.type }\` at line ${ serializable.line_index + 1 } col ${ serializable.col_index + 1 }.`;
			throw err;
		} else if (n.childCount) {
			report_syntax_errors(n);
		}
	});
}



export class Goal extends AstNode implements Buildable {
	/**
	 * Construct a new Goal from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new Goal representing the given source
	 */
	public static fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Goal {
		const root_node = TS_PARSER.parse(src).rootNode as SyntaxNodeType<'source_file'>;
		report_syntax_errors(root_node);
		return new Decorator(config).decorate(root_node);
	}


	readonly #validator: Validator;


	public constructor(
		start_node: SyntaxNodeType<'source_file'>,
		public readonly block: Block | null,
		config: CplConfig,
	) {
		super(start_node, {}, (block) ? [block] : []);
		this.#validator = new Validator(config);
	}

	public override get validator(): Validator {
		return this.#validator;
	}

	/**
	 * @inheritdoc
	 * @implements Buildable
	 */
	@runOnceMethod
	public build(builder: Builder): void {
		this.block?.build(builder);
		builder.terminateBlock(new OP.EndProgram());
		return builder.validate();
	}
}

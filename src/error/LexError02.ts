import type {Serializable} from '../parser/index.js';
import {LexError} from './LexError.js';



/**
 * A LexError02 is thrown when the lexer reaches the end of the file before the end of a token.
 */
// @ts-expect-error --- noUnusedLocals
class LexError02 extends LexError {
	static readonly #CODE = 2;


	/**
	 * Construct a new LexError02 object.
	 * @param token the token that did not finish
	 */
	public constructor(token: Serializable) {
		super(
			`Found end of file before end of ${ token.tagname }: \`${ token.source }\`.`,
			LexError02.#CODE,
			token.line_index,
			token.col_index,
		);
	}
}

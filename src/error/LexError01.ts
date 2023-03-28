import type {Serializable} from '../parser/index.js';
import {LexError} from './LexError.js';



/**
 * A LexError01 is thrown when the lexer reaches an unrecognized character.
 * @final
 */
export class LexError01 extends LexError {
	/**
	 * Construct a new LexError01 object.
	 * @param char the unrecognized character
	 */
	public constructor(char: Serializable) {
		super(
			`Unrecognized character: \`${ char.source }\` at line ${ char.line_index + 1 } col ${ char.col_index + 1 }.`,
			LexError.CODES.get(LexError01),
			char.line_index,
			char.col_index,
		);
	}
}

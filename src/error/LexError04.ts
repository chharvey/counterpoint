import type {Serializable} from '../parser/index.js';
import {LexError} from './LexError.js';



/**
 * A LexError04 is thrown when a numeric separator was found in a number literal but was not expected.
 *
 * The numeric separator is the underscore character, `_` **U+005F LOW LINE**,
 * and may be used to separate the digits in a number literal token to improve readability.
 * This error is thrown when a numeric separator is found where it does not belong.
 * @example
 * 1_000__000; % LexError04: Numeric separator not allowed...
 * 1_000_000_; % LexError04: Numeric separator not allowed...
 */
export class LexError04 extends LexError {
	/**
	 * Construct a new LexError04 object.
	 * @param char - the numeric separator character
	 */
	public constructor(char: Serializable) {
		super(
			`Numeric separator not allowed: at line ${ char.line_index + 1 } col ${ char.col_index + 1 }.`,
			LexError.CODES.get(LexError04),
			char.line_index,
			char.col_index,
		);
	}
}

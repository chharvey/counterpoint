import type {Serializable} from '../parser/index.js';
import {LexError} from './LexError.js';



/**
 * A LexError05 is thrown when a float literal has an invalid format.
 * @example
 * 5.e+2; % LexError05: Invalid floating-point literal format...
 * 5.0E2; % LexError05: Invalid floating-point literal format...
 * 5.0e;  % LexError05: Invalid floating-point literal format...
 */
export class LexError05 extends LexError {
	/**
	 * Construct a new LexError05 object.
	 * @param token - the float literal token
	 */
	public constructor(char: Serializable) {
		super(
			`Invalid exponential notation: at line ${ char.line_index + 1 } col ${ char.col_index + 1 }.`,
			LexError.CODES.get(LexError05),
			char.line_index,
			char.col_index,
		);
	}
}

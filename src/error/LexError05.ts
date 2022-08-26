import type {
	Serializable,
} from './package.js';
import {LexError} from './LexError.js';



/**
 * A LexError05 is thrown when a float literal has an invalid format.
 * @example
 * 5.e+2; % LexError05: Invalid floating-point literal format...
 * 5.0E2; % LexError05: Invalid floating-point literal format...
 * 5.0e;  % LexError05: Invalid floating-point literal format...
 */
export class LexError05 extends LexError {
	/** The number series of this class of errors. */
	static override readonly CODE = 5;
	/**
	 * Construct a new LexError05 object.
	 * @param token - the float literal token
	 */
	constructor(char: Serializable) {
		super(`Invalid exponential notation: at line ${ char.line_index + 1 } col ${ char.col_index + 1 }.`, LexError05.CODE, char.line_index, char.col_index)
	}
}

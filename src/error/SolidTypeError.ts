import {
	ErrorCode,
} from '@chharvey/parser';
import type {
	AST,
} from './package.js';



/**
 * A TypeError is thrown when the validator recognizes a type mismatch.
 */
export class SolidTypeError extends ErrorCode {
	/** The name of this class of errors. */
	static override readonly NAME: string = 'TypeError';
	/** The number series of this class of errors. */
	static readonly CODE: number = 2300
	/**
	 * Construct a new TypeError object.
	 * @param message - a message to the user
	 * @param code    - the error number
	 * @param line    - the line index in source code
	 * @param col     - the column index in source code
	 */
	constructor (message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name       : SolidTypeError.NAME,
			code       : SolidTypeError.CODE + code,
			line_index : line,
			col_index  : col,
		})
	}
}
/**
 * A TypeError06 is thrown when an attempt is made to call a callable object with an incorrect number of arguments.
 * @example
 * type U<V, W> = V | W;
 * type T = U.<V>;                % TypeError06: Got 1 type arguments, but expected 2.
 * func x(y: int): int => y + 42;
 * x.(2, 4);                      % TypeError06: Got 2 arguments, but expected 1.
 */
export class TypeError06 extends SolidTypeError {
	/** The number series of this class of errors. */
	static override readonly CODE = 6;
	/**
	 * Construct a new TypeError06 object.
	 * @param actual   - the number of arguments received
	 * @param expected - the number of arguments expected
	 * @param call     - the function call
	 * @param generic  - whether the arguments are generic arguments (true) or function arguments (false)
	 */
	constructor (actual: bigint, expected: bigint, generic: boolean, call: AST.ASTNodeTypeCall | AST.ASTNodeCall) {
		super(`Got \`${ actual }\` ${ (generic) ? 'type ' : '' }arguments, but expected \`${ expected }\`.`, TypeError06.CODE, call.line_index, call.col_index);
	}
}

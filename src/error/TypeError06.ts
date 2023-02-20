import type {AST} from '../validator/index.js';
import {TypeError} from './TypeError.js';



/**
 * A TypeError06 is thrown when an attempt is made to call a callable object with an incorrect number of arguments.
 * @example
 * type U<V, W> = V | W;
 * type T = U.<V>;                % TypeError06: Got 1 type arguments, but expected 2.
 * func x(y: int): int => y + 42;
 * x.(2, 4);                      % TypeError06: Got 2 arguments, but expected 1.
 */
export class TypeError06 extends TypeError {
	/** The number series of this class of errors. */
	public static override readonly CODE = 6;
	/**
	 * Construct a new TypeError06 object.
	 * @param actual   - the number of arguments received
	 * @param expected - the number of arguments expected
	 * @param generic  - whether the arguments are generic arguments (true) or function arguments (false)
	 * @param call     - the function call
	 */
	public constructor(actual: bigint, expected: bigint, generic: boolean, call: AST.ASTNodeTypeCall | AST.ASTNodeCall) {
		super(`Got \`${ actual }\` ${ (generic) ? 'type ' : '' }arguments, but expected \`${ expected }\`.`, TypeError06.CODE, call.line_index, call.col_index);
	}
}

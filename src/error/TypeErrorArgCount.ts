import type {AST} from '../validator/index.js';
import {TypeError} from './TypeError.js';



/**
 * A TypeErrorArgCount is thrown when an attempt is made to call a callable object with an incorrect number of arguments.
 * @example
 * type U<V, W> = V | W;
 * type T = U.<V>;                % TypeErrorArgCount: Got 1 type arguments, but expected 2.
 * func x(y: int): int => y + 42;
 * x.(2, 4);                      % TypeErrorArgCount: Got 2 arguments, but expected 1.
 */
export class TypeErrorArgCount extends TypeError {
	/** The number series of this class of errors. */
	public static override readonly CODE = 7;
	/**
	 * Construct a new TypeErrorArgCount object.
	 * @param actual   - the number of arguments received
	 * @param expected - the number of arguments expected
	 * @param generic  - whether the arguments are generic arguments (true) or function arguments (false)
	 * @param call     - the function call
	 */
	public constructor(actual: bigint, expected: bigint, generic: boolean, call: AST.ASTNodeTypeCall | AST.ASTNodeCall) {
		super(`Got \`${ actual }\` ${ (generic) ? 'type ' : '' }arguments, but expected \`${ expected }\`.`, TypeErrorArgCount.CODE, call.line_index, call.col_index);
	}
}

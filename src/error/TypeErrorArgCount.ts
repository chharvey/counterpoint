import type {AST} from '../validator/index.ts';
import {TypeError as CplTypeError} from './TypeError.ts';



/**
 * A TypeErrorArgCount is raised when an attempt is made to call a callable object with an incorrect number of arguments.
 * @example
 * type U<V, W> = V | W;
 * type T = U.<V>;       % TypeErrorArgCount: Got 1 generic arguments, but expected 2.
 *
 * func x(y: int): int => y + 42;
 * x.(2, 4);                      % TypeErrorArgCount: Got 2 arguments, but expected 1.
 */
export class TypeErrorArgCount extends CplTypeError {
	/**
	 * Construct a new TypeErrorArgCount object.
	 * @param actual   - the number of arguments received
	 * @param expected - the number of arguments expected
	 * @param opts     - kind of arguments
	 * 	@property generic  - whether the arguments are generic arguments (true) or function   arguments (false)
	 * 	@property named    - whether the arguments are named   arguments (true) or positional arguments (false)
	 * @param call     - the function call
	 */
	public constructor(actual: bigint, expected: bigint, opts: {generic: boolean, named: boolean}, call: AST.TYPE.Call | AST.EXPR.Call) {
		super(
			`Got ${actual} ${opts.named ? 'named ' : ''}${opts.generic ? 'generic ' : ''}arguments, but expected ${expected}.`,
			CplTypeError.CODES.get(TypeErrorArgCount),
			call.line_index,
			call.col_index,
		);
	}
}

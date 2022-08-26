import type {
	AST,
	TYPE,
} from './package.js';
import {TypeError} from './TypeError.js';



/**
 * A TypeError05 is thrown when an attempt is made to call an object that is not callable.
 * @example
 * type U = int;
 * type T = U.<V>;  % TypeError05: Type `U` is not callable.
 * let x: int = 42;
 * x.(24);          % TypeError05: Type `int` is not callable.
 */
export class TypeError05 extends TypeError {
	/** The number series of this class of errors. */
	static override readonly CODE = 5;
	/**
	 * Construct a new TypeError05 object.
	 * @param typ  - the type trying to be called
	 * @param base - the object expression being called
	 */
	constructor(typ: TYPE.Type, base: AST.ASTNodeType | AST.ASTNodeExpression) {
		super(`Type \`${ typ }\` is not callable.`, TypeError05.CODE, base.line_index, base.col_index);
	}
}

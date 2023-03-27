import type {AST} from '../validator/index.js';
import type {TYPE} from '../typer/index.js';
import {TypeError} from './TypeError.js';



/**
 * A TypeErrorNotCallable is thrown when an attempt is made to call an object that is not callable.
 * @example
 * type U = int;
 * type T = U.<V>;  % TypeErrorNotCallable: Type `U` is not callable.
 * let x: int = 42;
 * x.(24);          % TypeErrorNotCallable: Type `int` is not callable.
 */
export class TypeErrorNotCallable extends TypeError {
	/** The number series of this class of errors. */
	public static override readonly CODE = 6;
	/**
	 * Construct a new TypeErrorNotCallable object.
	 * @param typ  - the type trying to be called
	 * @param base - the object expression being called
	 */
	public constructor(typ: TYPE.Type, base: AST.ASTNodeType | AST.ASTNodeExpression) {
		super(`Type \`${ typ }\` is not callable.`, TypeErrorNotCallable.CODE, base.line_index, base.col_index);
	}
}

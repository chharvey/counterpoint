import type {AST} from '../validator/index.ts';
import type {TYPE} from '../typer/index.ts';
import {TypeError} from './TypeError.ts';



/**
 * A TypeErrorNotCallable is thrown when an attempt is made to call an object that is not callable.
 * @example
 * type U = int;
 * type T = U.<V>;  % TypeErrorNotCallable: Type `U` is not callable.
 * val x: int = 42;
 * x.(24);          % TypeErrorNotCallable: Type `int` is not callable.
 */
export class TypeErrorNotCallable extends TypeError {
	/**
	 * Construct a new TypeErrorNotCallable object.
	 * @param typ  - the type trying to be called
	 * @param base - the object expression being called
	 */
	public constructor(typ: TYPE.Type, base: AST.Type | AST.Expression) {
		super(
			`Type \`${ typ }\` is not callable.`,
			TypeError.CODES.get(TypeErrorNotCallable),
			base.line_index,
			base.col_index,
		);
	}
}

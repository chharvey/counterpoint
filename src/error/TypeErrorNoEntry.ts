import type {AST} from '../validator/index.ts';
import type {TYPE} from '../typer/index.ts';
import {TypeError as CplTypeError} from './TypeError.ts';



/**
 * A TypeErrorNoEntry is thrown when an attempt is made to access a non-existent index or key,
 * or when a named argument does not match a known parameter name.
 * @example
 * (42, 420).2;                      % TypeErrorNoEntry: Index `2` does not exist on type `(42, 420)`.
 * (a= 42, b= 420).c;                % TypeErrorNoEntry: Key `c` does not exist on type `(a: 42, b: 420)`.
 * ((x: int): int => x + 1).(y= 42); % TypeErrorNoEntry: Parameter `y` does not exist on type `(x: int) => int`.
 */
export class TypeErrorNoEntry extends CplTypeError {
	/**
	 * Construct a new TypeErrorNoEntry object.
	 * @param manner   - the manner of access, e.g. index, key, or parameter
	 * @param base     - the type of expression to which property access is performed
	 * @param accessor - the accessing index/key/expression
	 */
	public constructor(manner: 'index' | 'key' | 'parameter', base: TYPE.Type, accessor: AST.Index | AST.Key | AST.EXPR.Expression) {
		super(
			`${ manner[0].toUpperCase() }${ manner.slice(1) } \`${ accessor.source }\` does not exist on type \`${ base }\`.`,
			CplTypeError.CODES.get(TypeErrorNoEntry),
			accessor.line_index,
			accessor.col_index,
		);
	}
}

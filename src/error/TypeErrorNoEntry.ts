import type {AST} from '../validator/index.js';
import type {TYPE} from '../typer/index.js';
import {TypeError} from './TypeError.js';



/**
 * A TypeErrorNoEntry is thrown when an attempt is made to access a non-existent index or property,
 * or when a named argument does not match a known parameter name.
 * @example
 * [42, 420].2;                      % TypeErrorNoEntry: Index `2` does not exist on type `[42, 420]`.
 * [a= 42, b= 420].c;                % TypeErrorNoEntry: Property `c` does not exist on type `[a: 42, b: 420]`.
 * ((x: int): int => x + 1).(y= 42); % TypeErrorNoEntry: Parameter `y` does not exist on type `(x: int) => int`.
 */
export class TypeErrorNoEntry extends TypeError {
	/** The number series of this class of errors. */
	public static override readonly CODE = 5;
	/**
	 * Construct a new TypeErrorNoEntry object.
	 * @param kind     - the kind of access
	 * @param accessee - the type of expression to which property access is performed
	 * @param accessor - the property access index/key/expression
	 */
	public constructor(kind: 'index' | 'property' | 'parameter', accessee: TYPE.Type, accessor: AST.ASTNodeIndexType | AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression) {
		super(`${ kind[0].toUpperCase() }${ kind.slice(1) } \`${ accessor.source }\` does not exist on type \`${ accessee }\`.`, TypeErrorNoEntry.CODE, accessor.line_index, accessor.col_index);
	}
}
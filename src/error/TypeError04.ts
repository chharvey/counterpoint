import type {
	AST,
	SolidType,
} from './package.js';
import {SolidTypeError} from './SolidTypeError.js';



/**
 * A TypeError04 is thrown when an attempt is made to access a non-existent index or property,
 * or when a named argument does not match a known parameter name.
 * @example
 * [42, 420].2;                      % TypeError04: Index `2` does not exist on type `[42, 420]`.
 * [a= 42, b= 420].c;                % TypeError04: Property `c` does not exist on type `[a= 42, b= 420]`.
 * ((x: int): int => x + 1).(y= 42); % TypeError04: Parameter `y` does not exist on type `(x: int) => int`.
 */
export class TypeError04 extends SolidTypeError {
	/** The number series of this class of errors. */
	static override readonly CODE = 4;
	/**
	 * Construct a new TypeError04 object.
	 * @param kind     - the kind of access
	 * @param accessee - the type of expression to which property access is performed
	 * @param accessor - the property access index/key/expression
	 */
	constructor (kind: 'index' | 'property' | 'parameter', accessee: SolidType, accessor: AST.ASTNodeIndexType | AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression) {
		super(`${ kind[0].toUpperCase() }${ kind.slice(1) } \`${ accessor.source }\` does not exist on type \`${ accessee }\`.`, TypeError04.CODE, accessor.line_index, accessor.col_index);
	}
}

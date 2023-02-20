import type {AST} from '../validator/index.js';
import {ReferenceError} from './ReferenceError.js';



/**
 * A ReferenceError02 is thrown when the validator encounters a not-yet-declared variable.
 * @example
 * my_var; % ReferenceError02: `my_var` is used before it is declared.
 * % (This is called a Temporal Dead Zone.)
 * let my_var: int = 42;
 */
export class ReferenceError02 extends ReferenceError {
	/** The number series of this class of errors. */
	public static override readonly CODE = 2;
	/**
	 * Construct a new ReferenceError02 object.
	 * @param variable the not-yet-declared variable
	 */
	public constructor(variable: AST.ASTNodeTypeAlias | AST.ASTNodeVariable) {
		super(`\`${ variable.source }\` is used before it is declared.`, ReferenceError02.CODE, variable.line_index, variable.col_index);
	}
}

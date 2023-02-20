import type {AST} from '../validator/index.js';
import {AssignmentError} from './AssignmentError.js';



/**
 * An AssignmentError10 is thrown when attempting to reassign a fixed variable.
 * @example
 * let my_var: int = 42;
 * my_var = 24;          % AssignmentError10: Reassignment of a fixed variable: `my_var`.
 */
export class AssignmentError10 extends AssignmentError {
	/** The number series of this class of errors. */
	public static override readonly CODE = 10;
	/**
	 * Construct a new AssignmentError10 object.
	 * @param variable the undeclared variable
	 */
	public constructor(variable: AST.ASTNodeVariable) {
		super(`Reassignment of a fixed variable: \`${ variable.source }\`.`, AssignmentError10.CODE, variable.line_index, variable.col_index);
	}
}

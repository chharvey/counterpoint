import type {AST} from '../validator/index.js';
import {AssignmentError} from './AssignmentError.js';



/**
 * An AssignmentErrorReassignment is thrown when attempting to reassign a fixed variable.
 * @example
 * let my_var: int = 42;
 * my_var = 24;          % AssignmentErrorReassignment: Reassignment of fixed variable `my_var`.
 */
export class AssignmentErrorReassignment extends AssignmentError {
	/**
	 * Construct a new AssignmentErrorReassignment object.
	 * @param variable the undeclared variable
	 */
	public constructor(variable: AST.ASTNodeVariable) {
		super(
			`Reassignment of fixed variable \`${ variable.source }\`.`,
			AssignmentError.CODES.get(AssignmentErrorReassignment),
			variable.line_index,
			variable.col_index,
		);
	}
}

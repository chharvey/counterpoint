import type {AST} from '../validator/index.ts';
import {AssignmentError} from './AssignmentError.ts';



/**
 * An AssignmentErrorReassignment is thrown when attempting to reassign a read-only variable.
 * @example
 * val my_var: int = 42;
 * set my_var = 24;      % AssignmentErrorReassignment: Reassignment of read-only variable `my_var`.
 */
export class AssignmentErrorReassignment extends AssignmentError {
	/**
	 * Construct a new AssignmentErrorReassignment object.
	 * @param variable the undeclared variable
	 */
	public constructor(variable: AST.EXPR.Variable) {
		super(
			`Reassignment of read-only variable \`${ variable.source }\`.`,
			AssignmentError.CODES.get(AssignmentErrorReassignment),
			variable.line_index,
			variable.col_index,
		);
	}
}

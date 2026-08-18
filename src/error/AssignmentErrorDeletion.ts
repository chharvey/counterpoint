import type {AST} from '../validator/index.ts';
import {AssignmentError} from './AssignmentError.ts';



/**
 * An AssignmentErrorDeletion is thrown when attempting to delete a non-optional variable.
 * @example
 * val mut my_var: int | null = 42;
 * delete my_var;                   % AssignmentErrorDeletion: Deletion of non-optional variable `my_var`.
 */
export class AssignmentErrorDeletion extends AssignmentError {
	/**
	 * Construct a new AssignmentErrorDeletion object.
	 * @param variable the deleted variable
	 */
	public constructor(variable: AST.EXPR.Variable) {
		super(
			`Deletion of non-optional variable \`${ variable.source }\`.`,
			AssignmentError.CODES.get(AssignmentErrorDeletion),
			variable.line_index,
			variable.col_index,
		);
	}
}

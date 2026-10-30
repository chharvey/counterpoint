import type {Functionlike} from '../validator/ast/Functionlike.ts';
import {AssignmentError} from './AssignmentError.ts';



/**
 * An AssignmentErrorFunctionExit is raised when not every control route in a function body exits the function.
 * @example
 * func f(b: bool): str {
 * 	if b then {
 * 		return "true";
 * 	};
 * 	% AssignmentErrorFunctionExit: Function does not exit in every control route.
 * }
 */
export class AssignmentErrorFunctionExit extends AssignmentError {
	/**
	 * Construct a new AssignmentErrorFunctionExit object.
	 * @param fn - the function node
	 */
	public constructor(fn: Functionlike) {
		super(
			`Function \`${fn.source}\` does not exit in every control route.`,
			AssignmentError.CODES.get(AssignmentErrorFunctionExit),
			fn.line_index,
			fn.col_index,
		);
	}
}

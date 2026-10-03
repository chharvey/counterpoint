import type {Functionlike} from '../validator/ast/Functionlike.ts';
import {TypeError as CplTypeError} from './TypeError.ts';



/**
 * A TypeErrorFunctionExit is thrown when not every control route in a function body exits the function.
 * @example
 * func f(b: bool): str {
 * 	if b then {
 * 		return "true";
 * 	};
 * 	% TypeErrorFunctionExit: Function does not exit in every control route.
 * }
 */
export class TypeErrorFunctionExit extends CplTypeError {
	/**
	 * Construct a new TypeErrorFunctionExit object.
	 * @param fn - the function node
	 */
	public constructor(fn: Functionlike) {
		super(
			`Function \`${ fn.source }\` does not exit in every control route.`,
			CplTypeError.CODES.get(TypeErrorFunctionExit),
			fn.line_index,
			fn.col_index,
		);
	}
}

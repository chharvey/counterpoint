import type {AST} from '../validator/index.ts';
import {ReferenceError as CplReferenceError} from './ReferenceError.ts';



/**
 * A ReferenceErrorDeadZone is thrown when the validator encounters a not-yet-declared variable.
 * @example
 * my_var;               % ReferenceErrorDeadZone: `my_var` is used before it is declared.
 * val my_var: int = 42;
 */
export class ReferenceErrorDeadZone extends CplReferenceError {
	/**
	 * Construct a new ReferenceErrorDeadZone object.
	 * @param variable the not-yet-declared variable
	 */
	public constructor(variable: AST.TYPE.TypeAlias | AST.EXPR.Variable) {
		super(
			`\`${ variable.source }\` is used before it is declared.`,
			CplReferenceError.CODES.get(ReferenceErrorDeadZone),
			variable.line_index,
			variable.col_index,
		);
	}
}

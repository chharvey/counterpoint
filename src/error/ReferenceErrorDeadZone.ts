import type {AST} from '../validator/index.js';
import {ReferenceError} from './ReferenceError.js';



/**
 * A ReferenceErrorDeadZone is thrown when the validator encounters a not-yet-declared variable.
 * @example
 * my_var;               % ReferenceErrorDeadZone: `my_var` is used before it is declared.
 * let my_var: int = 42;
 */
export class ReferenceErrorDeadZone extends ReferenceError {
	/**
	 * Construct a new ReferenceErrorDeadZone object.
	 * @param variable the not-yet-declared variable
	 */
	public constructor(variable: AST.ASTNodeTypeAlias | AST.ASTNodeVariable) {
		super(
			`\`${ variable.source }\` is used before it is declared.`,
			ReferenceError.CODES.get(ReferenceErrorDeadZone),
			variable.line_index,
			variable.col_index,
		);
	}
}

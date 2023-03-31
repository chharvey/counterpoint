import type {AST} from '../validator/index.js';
import {ReferenceError} from './ReferenceError.js';



/**
 * A ReferenceError02 is thrown when the validator encounters a not-yet-declared variable.
 * @example
 * my_var;               % ReferenceError02: `my_var` is used before it is declared.
 * let my_var: int = 42;
 */
export class ReferenceError02 extends ReferenceError {
	/**
	 * Construct a new ReferenceError02 object.
	 * @param variable the not-yet-declared variable
	 */
	public constructor(variable: AST.ASTNodeTypeAlias | AST.ASTNodeVariable) {
		super(
			`\`${ variable.source }\` is used before it is declared.`,
			ReferenceError.CODES.get(ReferenceError02),
			variable.line_index,
			variable.col_index,
		);
	}
}

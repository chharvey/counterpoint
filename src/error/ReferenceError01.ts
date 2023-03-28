import type {AST} from '../validator/index.js';
import {ReferenceError} from './ReferenceError.js';



/**
 * A ReferenceError01 is thrown when the validator encounters an undeclared variable.
 * @example
 * my_var; % ReferenceError01: `my_var` is never declared.
 */
export class ReferenceError01 extends ReferenceError {
	/**
	 * Construct a new ReferenceError01 object.
	 * @param variable the undeclared variable
	 */
	public constructor(variable: AST.ASTNodeTypeAlias | AST.ASTNodeVariable) {
		super(
			`\`${ variable.source }\` is never declared.`,
			ReferenceError.CODES.get(ReferenceError01),
			variable.line_index,
			variable.col_index,
		);
	}
}

import type {AST} from '../validator/index.js';
import {ReferenceError} from './ReferenceError.js';



/**
 * A ReferenceErrorUndeclared is thrown when the validator encounters an undeclared variable.
 * @example
 * my_var; % ReferenceErrorUndeclared: `my_var` is never declared.
 */
export class ReferenceErrorUndeclared extends ReferenceError {
	/**
	 * Construct a new ReferenceErrorUndeclared object.
	 * @param variable the undeclared variable
	 */
	public constructor(variable: AST.ASTNodeTypeAlias | AST.ASTNodeVariable) {
		super(
			`\`${ variable.source }\` is never declared.`,
			ReferenceError.CODES.get(ReferenceErrorUndeclared),
			variable.line_index,
			variable.col_index,
		);
	}
}

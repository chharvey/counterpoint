import type {AST} from './package.js';
import {SolidReferenceError} from './SolidReferenceError.js';



/**
 * A ReferenceError01 is thrown when the validator encounters an undeclared variable.
 * @example
 * my_var; % ReferenceError01: `my_var` is never declared.
 */
export class ReferenceError01 extends SolidReferenceError {
	/** The number series of this class of errors. */
	static override readonly CODE = 1;
	/**
	 * Construct a new ReferenceError01 object.
	 * @param variable the undeclared variable
	 */
	constructor (variable: AST.ASTNodeTypeAlias | AST.ASTNodeVariable) {
		super(`\`${ variable.source }\` is never declared.`, ReferenceError01.CODE, variable.line_index, variable.col_index);
	}
}

import type {AST} from './package.js';
import {TypeError} from './TypeError.js';



/**
 * A TypeError01 is thrown when the validator encounters an invalid operation.
 * @example
 * true + false; % TypeError01: Invalid operation.
 */
export class TypeError01 extends TypeError {
	/** The number series of this class of errors. */
	static override readonly CODE = 1;
	/**
	 * Construct a new TypeError01 object.
	 * @param expression - the invalid operation expression
	 */
	constructor(expression: AST.ASTNodeAccess | AST.ASTNodeOperation) {
		super(`Invalid operation: \`${ expression.source }\` at line ${ expression.line_index + 1 } col ${ expression.col_index + 1 }.`, TypeError01.CODE, expression.line_index, expression.col_index);
	}
}

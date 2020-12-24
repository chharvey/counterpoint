import {
	ErrorCode,
} from '@chharvey/parser';

import type {AST} from '../validator/';



/**
 * An AssignmentError is thrown when the validator detects an illegal declaration or assignment.
 */
class AssignmentError extends ErrorCode {
	/** The name of this class of errors. */
	static readonly NAME: string = 'AssignmentError';
	/** The number series of this class of errors. */
	static readonly CODE: number = 2200;
	/**
	 * Construct a new AssignmentError object.
	 * @param message a message to the user
	 * @param code    the error number
	 * @param line    the line index in source code
	 * @param col     the column index in source code
	 */
	constructor (message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name:       AssignmentError.NAME,
			code:       AssignmentError.CODE + code,
			line_index: line,
			col_index:  col,
		});
	}
}


/**
 * A AssignmentError01 is thrown when the validator encounters a duplicate variable declaration.
 * @example
 * let my_var: int = 42;
 * let my_var: int = 24; % AssignmentError01: Duplicate variable declaration: `my_var`.
 */
export class AssignmentError01 extends AssignmentError {
	/** The number series of this class of errors. */
	static readonly CODE = 1;
	/**
	 * Construct a new AssignmentError01 object.
	 * @param identifier the duplicate identifier
	 */
	constructor (identifier: AST.ASTNodeIdentifier) {
		super(`Duplicate variable declaration: \`${ identifier.source }\`.`, AssignmentError01.CODE, identifier.line_index, identifier.col_index);
	}
}
/**
 * A AssignmentError10 is thrown when attempting to reassign a fixed variable.
 * @example
 * let my_var: int = 42;
 * my_var = 24;          % AssignmentError10: Reassignment of a fixed variable: `my_var`.
 */
export class AssignmentError10 extends AssignmentError {
	/** The number series of this class of errors. */
	static readonly CODE = 10;
	/**
	 * Construct a new AssignmentError10 object.
	 * @param identifier the undeclared identifier
	 */
	constructor (identifier: AST.ASTNodeIdentifier) {
		super(`Reassignment of a fixed variable: \`${ identifier.source }\`.`, AssignmentError10.CODE, identifier.line_index, identifier.col_index);
	}
}

import {
	ErrorCode,
} from '@chharvey/parser';

import type {AST} from '../validator/';



/**
 * A ReferenceError is thrown when the validator fails to dereference an identifier.
 */
export default class SolidReferenceError extends ErrorCode {
	/** The name of this class of errors. */
	static readonly NAME: string = 'ReferenceError';
	/** The number series of this class of errors. */
	static readonly CODE: number = 2100;
	/**
	 * Construct a new ReferenceError object.
	 * @param message a message to the user
	 * @param code    the error number
	 * @param line    the line index in source code
	 * @param col     the column index in source code
	 */
	constructor (message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name:       SolidReferenceError.NAME,
			code:       SolidReferenceError.CODE + code,
			line_index: line,
			col_index:  col,
		});
	}
}


/**
 * A ReferenceError01 is thrown when the validator encounters an undeclared variable.
 * @example
 * my_var; % ReferenceError01: `my_var` is never declared.
 */
export class ReferenceError01 extends SolidReferenceError {
	/** The number series of this class of errors. */
	static readonly CODE = 1;
	/**
	 * Construct a new ReferenceError01 object.
	 * @param identifier the undeclared identifier
	 */
	constructor (identifier: AST.SemanticNodeIdentifier) {
		super(`\`${ identifier.source }\` is never declared.`, ReferenceError01.CODE, identifier.line_index, identifier.col_index);
	}
}
/**
 * A ReferenceError02 is thrown when the validator encounters a not-yet-declared variable.
 * @example
 * my_var;               % ReferenceError02: `my_var` is used before it is declared.
 * % (This is called a Temporal Dead Zone.)
 * let my_var: int = 42;
 */
export class ReferenceError02 extends SolidReferenceError {
	/** The number series of this class of errors. */
	static readonly CODE = 2;
	/**
	 * Construct a new ReferenceError02 object.
	 * @param identifier the not-yet-declared identifier
	 */
	constructor (identifier: AST.SemanticNodeIdentifier) {
		super(`\`${ identifier.source }\` is used before it is declared.`, ReferenceError02.CODE, identifier.line_index, identifier.col_index);
	}
}

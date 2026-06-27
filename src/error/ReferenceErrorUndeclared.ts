import type {AST} from '../validator/index.ts';
import {ReferenceError as CplReferenceError} from './ReferenceError.ts';



/**
 * A ReferenceErrorUndeclared is thrown when the validator encounters an undeclared variable.
 * @example
 * my_var; % ReferenceErrorUndeclared: `my_var` is never declared.
 */
export class ReferenceErrorUndeclared extends CplReferenceError {
	/**
	 * Construct a new ReferenceErrorUndeclared object.
	 * @param variable the undeclared variable
	 */
	public constructor(variable: AST.TYPE.TypeAlias | AST.EXPR.Variable) {
		super(
			`\`${ variable.source }\` is never declared.`,
			CplReferenceError.CODES.get(ReferenceErrorUndeclared),
			variable.line_index,
			variable.col_index,
		);
	}
}

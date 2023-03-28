import type {AST} from '../validator/index.js';
import {TypeError} from './TypeError.js';



/**
 * A TypeErrorInvalidOperation is thrown when the validator encounters an invalid operation.
 * @example
 * true + false; % TypeErrorInvalidOperation: Invalid operation.
 */
export class TypeErrorInvalidOperation extends TypeError {
	/**
	 * Construct a new TypeErrorInvalidOperation object.
	 * @param expression - the invalid operation expression
	 */
	public constructor(expression: AST.ASTNodeTypeOperation | AST.ASTNodeAccess | AST.ASTNodeOperation) {
		super(
			`Invalid operation: \`${ expression.source }\` at line ${ expression.line_index + 1 } col ${ expression.col_index + 1 }.`,
			TypeError.CODES.get(TypeErrorInvalidOperation),
			expression.line_index,
			expression.col_index,
		);
	}
}

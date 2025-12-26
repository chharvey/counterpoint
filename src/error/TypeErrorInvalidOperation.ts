import type {AST} from '../validator/index.ts';
import {TypeError} from './TypeError.ts';



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
	public constructor(expression: AST.TypeAccess | AST.TypeOperation | AST.Access | AST.Operation) {
		super(
			`Invalid operation: \`${ expression.source }\` at line ${ expression.line_index + 1 } col ${ expression.col_index + 1 }.`,
			TypeError.CODES.get(TypeErrorInvalidOperation),
			expression.line_index,
			expression.col_index,
		);
	}
}

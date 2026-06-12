import type {AST} from '../validator/index.ts';
import {AssignmentError} from './AssignmentError.ts';



/**
 * An AssignmentErrorDuplicateDeclaration is thrown when the validator encounters a duplicate declaration.
 * @example
 * val my_var: int = 42;
 * val my_var: int = 24; % AssignmentErrorDuplicateDeclaration: Duplicate declaration of `my_var`.
 * @example
 * type MyType = int;
 * type MyType = float; % AssignmentErrorDuplicateDeclaration: Duplicate declaration of `MyType`.
 */
export class AssignmentErrorDuplicateDeclaration extends AssignmentError {
	/**
	 * Construct a new AssignmentErrorDuplicateDeclaration object.
	 * @param symbol the duplicate symbol
	 */
	public constructor(symbol: AST.TYPE.TypeAlias | AST.EXPR.Variable) {
		super(
			`Duplicate declaration of \`${ symbol.source }\`.`,
			AssignmentError.CODES.get(AssignmentErrorDuplicateDeclaration),
			symbol.line_index,
			symbol.col_index,
		);
	}
}

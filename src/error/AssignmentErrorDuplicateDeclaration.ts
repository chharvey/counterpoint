import type {AST} from '../validator/index.js';
import {AssignmentError} from './AssignmentError.js';



/**
 * An AssignmentErrorDuplicateDeclaration is thrown when the validator encounters a duplicate declaration.
 * @example
 * let my_var: int = 42;
 * let my_var: int = 24; % AssignmentErrorDuplicateDeclaration: Duplicate declaration of `my_var`.
 * @example
 * type MyType = int;
 * type MyType = float; % AssignmentErrorDuplicateDeclaration: Duplicate declaration of `MyType`.
 */
export class AssignmentErrorDuplicateDeclaration extends AssignmentError {
	/**
	 * Construct a new AssignmentErrorDuplicateDeclaration object.
	 * @param symbol the duplicate symbol
	 */
	public constructor(symbol: AST.ASTNodeTypeAlias | AST.ASTNodeVariable) {
		super(
			`Duplicate declaration of \`${ symbol.source }\`.`,
			AssignmentError.CODES.get(AssignmentErrorDuplicateDeclaration),
			symbol.line_index,
			symbol.col_index,
		);
	}
}

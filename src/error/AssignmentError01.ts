import type {AST} from '../validator/index.js';
import {AssignmentError} from './AssignmentError.js';



/**
 * An AssignmentError01 is thrown when the validator encounters a duplicate declaration.
 * @example
 * let my_var: int = 42;
 * let my_var: int = 24; % AssignmentError01: Duplicate declaration: `my_var` is already declared.
 * @example
 * type MyType = int;
 * type MyType = float; % AssignmentError01: Duplicate declaration: `MyType` is already declared.
 */
export class AssignmentError01 extends AssignmentError {
	/**
	 * Construct a new AssignmentError01 object.
	 * @param symbol the duplicate symbol
	 */
	public constructor(symbol: AST.ASTNodeTypeAlias | AST.ASTNodeVariable) {
		super(
			`Duplicate declaration: \`${ symbol.source }\` is already declared.`,
			AssignmentError.CODES.get(AssignmentError01),
			symbol.line_index,
			symbol.col_index,
		);
	}
}

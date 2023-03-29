import type {AST} from '../validator/index.js';
import {AssignmentError} from './AssignmentError.js';



/**
 * An AssignmentError02 is thrown when the validator encounters a duplicate key in a record literal or record type literal.
 * @example
 * [foo= "a", foo= "b"]; % AssignmentError02: Duplicate record key `foo`.
 * @example
 * type MyType = [bar: int, bar: str]; % AssignmentError02: Duplicate record key `bar`.
 */
export class AssignmentError02 extends AssignmentError {
	/**
	 * Construct a new AssignmentError02 object.
	 * @param key the duplicate key
	 */
	public constructor(key: AST.ASTNodeKey) {
		super(
			`Duplicate record key \`${ key.source }\`.`,
			AssignmentError.CODES.get(AssignmentError02),
			key.line_index,
			key.col_index,
		);
	}
}

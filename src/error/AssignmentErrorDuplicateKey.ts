import type {AST} from '../validator/index.js';
import {AssignmentError} from './AssignmentError.js';



/**
 * An AssignmentErrorDuplicateKey is thrown when the validator encounters a duplicate key in a record literal or record type literal.
 * @example
 * [foo= "a", foo= "b"]; % AssignmentErrorDuplicateKey: Duplicate record key `foo`.
 * @example
 * type MyType = [bar: int, bar: str]; % AssignmentErrorDuplicateKey: Duplicate record key `bar`.
 */
export class AssignmentErrorDuplicateKey extends AssignmentError {
	/**
	 * Construct a new AssignmentErrorDuplicateKey object.
	 * @param key the duplicate key
	 */
	public constructor(key: AST.ASTNodeKey) {
		super(
			`Duplicate record key \`${ key.source }\`.`,
			AssignmentError.CODES.get(AssignmentErrorDuplicateKey),
			key.line_index,
			key.col_index,
		);
	}
}

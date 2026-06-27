import type {AST} from '../validator/index.ts';
import {AssignmentError} from './AssignmentError.ts';



/**
 * An AssignmentErrorDuplicateKey is thrown when the validator encounters a duplicate key in a record type, record literal, or dict literal.
 * @example
 * type MyType = (bar: int, bar: str); % AssignmentErrorDuplicateKey: Duplicate record/dict key `bar`.
 * @example
 * (foo= "a", foo= "b"); % AssignmentErrorDuplicateKey: Duplicate record/dict key `foo`.
 * [foo= "a", foo= "b"]; % AssignmentErrorDuplicateKey: Duplicate record/dict key `foo`.
 */
export class AssignmentErrorDuplicateKey extends AssignmentError {
	/**
	 * Construct a new AssignmentErrorDuplicateKey object.
	 * @param key the duplicate key
	 */
	public constructor(key: AST.Key) {
		super(
			`Duplicate record/dict key \`${ key.source }\`.`,
			AssignmentError.CODES.get(AssignmentErrorDuplicateKey),
			key.line_index,
			key.col_index,
		);
	}
}

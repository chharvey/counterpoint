import type {AST} from './package.js';
import {AssignmentError} from './AssignmentError.js';



/**
 * An AssignmentError02 is thrown when the validator encounters a duplicate key in a record literal or record type literal.
 * @example
 * [foo= 'a', foo= 'b']; % AssignmentError02: Duplicate record key: `foo` is already set.
 * @example
 * type MyType = [bar: int, bar: str]; % AssignmentError02: Duplicate record key: `bar` is already set.
 */
export class AssignmentError02 extends AssignmentError {
	/** The number series of this class of errors. */
	public static override readonly CODE = 2;
	/**
	 * Construct a new AssignmentError02 object.
	 * @param key the duplicate key
	 */
	public constructor(key: AST.ASTNodeKey) {
		super(`Duplicate record key: \`${ key.source }\` is already set.`, AssignmentError02.CODE, key.line_index, key.col_index);
	}
}

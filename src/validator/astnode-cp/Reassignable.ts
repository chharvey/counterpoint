import type {TYPE} from '../../index.ts';
import type {ASTNodeExpression} from './ASTNodeExpression.ts';



/**
 * Known implementers:
 * - ASTNodeVariable
 * - ASTNodeAccess
 */
export interface Reassignable extends ASTNodeExpression {
	/**
	 * Give the write-type of the symbol being reassigned (assuming that is allowed).
	 * @return the write-type
	 */
	writeType(): TYPE.Type;
}

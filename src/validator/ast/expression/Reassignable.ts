import type {TYPE} from '../../../typer/index.ts';
import type {Expression} from './Expression.ts';



/**
 * Known implementers:
 * - Variable
 * - Access
 */
export interface Reassignable extends Expression {
	/**
	 * Give the write-type of the symbol being reassigned (assuming that is allowed).
	 * @return the write-type
	 */
	writeType(): TYPE.Type;
}

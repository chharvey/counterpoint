import type {AST} from '../validator/index.js';
import type {TYPE} from '../typer/index.js';
import {MutabilityError} from './MutabilityError.js';



/**
 * A MutabilityError01 is thrown when the an item or property of an immutable object is reassigned.
 * @example
 * let x: [a: int] = [a= 42];
 * x.a = 43;                  % MutabilityError01: Mutation of an object of immutable type `[a: int]`.
 */
export class MutabilityError01 extends MutabilityError {
	/**
	 * Construct a new MutabilityError01 object.
	 * @param typ  the type that is being mutated
	 * @param node the reassignment node where it happens
	 */
	public constructor(typ: TYPE.Type, node: AST.ASTNodeAssignment) {
		super(
			`Mutation of an object of immutable type \`${ typ }\`.`,
			MutabilityError.CODES.get(MutabilityError01),
			node.line_index,
			node.col_index,
		);
	}
}

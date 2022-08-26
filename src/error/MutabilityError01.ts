import type {
	AST,
	TYPE,
} from './package.js';
import {MutabilityError} from './MutabilityError.js';



/**
 * A MutabilityError01 is thrown when the an item or property of an immutable object is reassigned.
 * @example
 * let x: [a: int] = [a= 42];
 * x.a = 43; % MutabilityError01: Mutation of an object of immutable type `[a: int]`.
 */
export class MutabilityError01 extends MutabilityError {
	/** The number series of this class of errors. */
	static override readonly CODE = 1;
	/**
	 * Construct a new MutabilityError01 object.
	 * @param typ  the type that is being mutated
	 * @param node the reassignment node where it happens
	 */
	constructor(typ: TYPE.Type, node: AST.ASTNodeAssignment) {
		super(`Mutation of an object of immutable type \`${ typ }\`.`, MutabilityError01.CODE, node.line_index, node.col_index);
	}
}

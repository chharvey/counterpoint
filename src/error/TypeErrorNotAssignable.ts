import type {AST} from '../validator/index.js';
import type {TYPE} from '../typer/index.js';
import {TypeError} from './TypeError.js';



/**
 * A TypeErrorNotAssignable is thrown when an expression is assigned to a type to which it is not assignable,
 * or when an argument is assigned to a parameter to which it is not assignable.
 * @example
 * let x: int = true;             % TypeErrorNotAssignable: Expression of type `true` is not assignable to type `int`.
 * ((x: int): int => x + 1)(4.2); % TypeErrorNotAssignable: Expression of type `4.2` is not assignable to type `int`.
 */
export class TypeErrorNotAssignable extends TypeError {
	/** The number series of this class of errors. */
	public static override readonly CODE = 3;
	/**
	 * Construct a new TypeErrorNotAssignable object.
	 * @param assigned_type - the type of the expression
	 * @param assignee_type - the type to which the expression is assigned
	 * @param assignment    - the node where the assignment took place
	 */
	public constructor(assigned_type: TYPE.Type, assignee_type: TYPE.Type, assignment: AST.ASTNodeCP) {
		super(`Expression of type ${ assigned_type } is not assignable to type ${ assignee_type }.`, TypeErrorNotAssignable.CODE, assignment.line_index, assignment.col_index);
	}
}

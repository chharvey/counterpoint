import type {AST} from '../validator/index.ts';
import type {TYPE} from '../typer/index.ts';
import {TypeError} from './TypeError.ts';



/**
 * A TypeErrorNotAssignable is thrown when an expression is assigned to a type to which it is not assignable,
 * or when an argument is assigned to a parameter to which it is not assignable.
 * @example
 * val x: int = true;               % TypeErrorNotAssignable: Expression `true` is not assignable to type `int`.
 * (\(x: int): int => x + 1).(4.2); % TypeErrorNotAssignable: Expression `4.2` is not assignable to type `int`.
 */
export class TypeErrorNotAssignable extends TypeError {
	/**
	 * Construct a new TypeErrorNotAssignable object.
	 * @param assigned      - the expression being assigned
	 * @param assignee_type - the type to which the expression is assigned
	 * @param assignment    - the node where the assignment took place
	 */
	public constructor(assigned: AST.ASTNodeExpression, assignee_type: TYPE.Type, assignment: AST.ASTNodeCP = assigned) {
		super(
			`Expression \`${ assigned.source }\` is not assignable to type \`${ assignee_type }\`.`,
			TypeError.CODES.get(TypeErrorNotAssignable),
			assignment.line_index,
			assignment.col_index,
		);
	}
}

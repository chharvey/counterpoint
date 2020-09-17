import type {
	SemanticNodeOperation,
	SemanticNodeDeclarationVariable,
	SolidLanguageType,
} from '../validator/'
import SolidError from './SolidError.class'



/**
 * A TypeError is thrown when the validator recognizes a type mismatch.
 */
export default class SolidTypeError extends SolidError {
	/** The name of this class of errors. */
	static readonly NAME: string = 'TypeError'
	/** The number series of this class of errors. */
	static readonly CODE: number = 2300
	/**
	 * Construct a new TypeError object.
	 * @param message - a message to the user
	 * @param code    - the error number
	 * @param line    - the line index in source code
	 * @param col     - the column index in source code
	 */
	constructor (message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name       : SolidTypeError.NAME,
			code       : SolidTypeError.CODE + code,
			line_index : line,
			col_index  : col,
		})
	}
}


/**
 * A TypeError01 is thrown when the parser encounters an invalid operation.
 */
export class TypeError01 extends SolidTypeError {
	/** The number series of this class of errors. */
	static readonly CODE = 1
	/**
	 * Construct a new TypeError01 object.
	 * @param expression - the invalid operation expression
	 */
	constructor (expression: SemanticNodeOperation) {
		super(`Invalid operation: \`${ expression.source }\` at line ${ expression.line_index + 1 } col ${ expression.col_index + 1 }.`, TypeError01.CODE, expression.line_index, expression.col_index)
	}
}
/**
 * A TypeError02 is thrown when an expression is assigned to a type to which it is not assignable.
 */
export class TypeError02 extends SolidTypeError {
	/** The number series of this class of errors. */
	static readonly CODE = 2
	/**
	 * Construct a new TypeError02 object.
	 * @param assignment    - the node where the assignment took place
	 * @param assignee_type - the type to which the expression is assigned
	 * @param assigned_type - the type of the expression
	 */
	constructor (assignment: SemanticNodeDeclarationVariable, assignee_type: SolidLanguageType, assigned_type: SolidLanguageType) {
		super(`Expression of type ${ assigned_type } is not assignable to type ${ assignee_type }`, TypeError02.CODE, assignment.line_index, assignment.col_index)
	}
}

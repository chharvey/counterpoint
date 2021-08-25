import {
	ErrorCode,
} from '@chharvey/parser';
import type {AST} from '../validator/index.js';
import type {SolidType} from '../typer/index.js';



/**
 * A TypeError is thrown when the validator recognizes a type mismatch.
 */
class SolidTypeError extends ErrorCode {
	/** The name of this class of errors. */
	static override readonly NAME: string = 'TypeError';
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
 * A TypeError01 is thrown when the validator encounters an invalid operation.
 * @example
 * true + false; % TypeError01: Invalid operation.
 */
export class TypeError01 extends SolidTypeError {
	/** The number series of this class of errors. */
	static override readonly CODE = 1;
	/**
	 * Construct a new TypeError01 object.
	 * @param expression - the invalid operation expression
	 */
	constructor (expression: AST.ASTNodeAccess | AST.ASTNodeOperation) {
		super(`Invalid operation: \`${ expression.source }\` at line ${ expression.line_index + 1 } col ${ expression.col_index + 1 }.`, TypeError01.CODE, expression.line_index, expression.col_index)
	}
}
/**
 * A TypeError02 is thrown when one type is expected to narrow another type, but does not.
 * A general error used for different cases, such as compound types’s components, generic constraints, or throwing non-Exceptions.
 */
export class TypeError02 extends SolidTypeError {
	/** The number series of this class of errors. */
	static override readonly CODE = 2;
	/**
	 * Construct a new TypeError02 object.
	 * @param subtype   - the expected subtype
	 * @param supertype - the supertype
	 */
	constructor (subtype: SolidType, supertype: SolidType, line_index: number, col_index: number) {
		super(`Type ${ subtype } is not a subtype of type ${ supertype }.`, TypeError02.CODE, line_index, col_index)
	}
}
/**
 * A TypeError03 is thrown when an expression is assigned to a type to which it is not assignable,
 * or when an argument is assigned to a parameter to which it is not assignable.
 * @example
 * let x: int = true;             % TypeError03: Expression of type `true` is not assignable to type `int`.
 * ((x: int): int => x + 1)(4.2); % TypeError03: Expression of type `4.2` is not assignable to type `int`.
 */
export class TypeError03 extends SolidTypeError {
	/** The number series of this class of errors. */
	static override readonly CODE = 3;
	/**
	 * Construct a new TypeError03 object.
	 * @param assignment    - the node where the assignment took place
	 * @param assignee_type - the type to which the expression is assigned
	 * @param assigned_type - the type of the expression
	 */
	constructor (assignment: AST.ASTNodeDeclarationVariable | AST.ASTNodeAssignment, assignee_type: SolidType, assigned_type: SolidType) {
		super(`Expression of type ${ assigned_type } is not assignable to type ${ assignee_type }.`, TypeError03.CODE, assignment.line_index, assignment.col_index)
	}
}
/**
 * A TypeError04 is thrown when an attempt is made to access a non-existent index or property,
 * or when a named argument does not match a known parameter name.
 * @example
 * [42, 420].2;                     % TypeError04: Index `2` does not exist on type `[42, 420]`.
 * [a= 42, b= 420].c;               % TypeError04: Property `c` does not exist on type `[a= 42, b= 420]`.
 * ((x: int): int => x + 1)(y= 42); % TypeError04: Parameter `y` does not exist on type `(x: int) -> {int}`.
 */
export class TypeError04 extends SolidTypeError {
	/** The number series of this class of errors. */
	static override readonly CODE = 4;
	/**
	 * Construct a new TypeError04 object.
	 * @param kind     - the kind of access
	 * @param accessee - the type of expression to which property access is performed
	 * @param accessor - the property access index/key/expression
	 */
	constructor (kind: 'index' | 'property' | 'parameter', accessee: SolidType, accessor: AST.ASTNodeIndexType | AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression) {
		super(`${ kind[0].toUpperCase() }${ kind.slice(1) } \`${ accessor.source }\` does not exist on type \`${ accessee }\`.`, TypeError04.CODE, accessor.line_index, accessor.col_index);
	}
}
/**
 * A TypeError05 is thrown when an attempt is made to call an object that is not callable.
 * @example
 * type U = int;
 * type T = U.<V>;  % TypeError05: Type `U` is not callable.
 * let x: int = 42;
 * x.(24);          % TypeError05: Type `int` is not callable.
 */
export class TypeError05 extends SolidTypeError {
	/** The number series of this class of errors. */
	static override readonly CODE = 5;
	/**
	 * Construct a new TypeError05 object.
	 * @param typ  - the type trying to be called
	 * @param base - the object expression being called
	 */
	constructor (typ: SolidType, base: AST.ASTNodeType | AST.ASTNodeExpression) {
		super(`Type \`${ typ }\` is not callable.`, TypeError05.CODE, base.line_index, base.col_index);
	}
}
/**
 * A TypeError06 is thrown when an attempt is made to call a callable object with an incorrect number of arguments.
 * @example
 * type U<V, W> = V | W;
 * type T = U.<V>;                % TypeError06: Got 1 type arguments, but expected 2.
 * func x(y: int): int => y + 42;
 * x.(2, 4);                      % TypeError06: Got 2 arguments, but expected 1.
 */
export class TypeError06 extends SolidTypeError {
	/** The number series of this class of errors. */
	static override readonly CODE = 6;
	/**
	 * Construct a new TypeError06 object.
	 * @param actual   - the number of arguments received
	 * @param expected - the number of arguments expected
	 * @param call     - the function call
	 * @param generic  - whether the arguments are generic arguments (true) or function arguments (false)
	 */
	constructor (actual: bigint, expected: bigint, generic: boolean, call: AST.ASTNodeTypeCall | AST.ASTNodeCall) {
		super(`Got \`${ actual }\` ${ (generic) ? 'type ' : '' }arguments, but expected \`${ expected }\`.`, TypeError06.CODE, call.line_index, call.col_index);
	}
}

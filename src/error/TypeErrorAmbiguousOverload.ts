import {AST} from '../validator/index.ts';
import {TypeError as CplTypeError} from './TypeError.ts';



/**
 * A TypeErrorAmbiguousOverload is raised when identical function overloads are declared
 * or when no (or several) compatible function overloads are found.
 * @example
 * func f(s: str): bool => true;
 * func f(s: str): int  => 42; % TypeErrorAmbiguousOverload: Duplicate function overload declared.
 *
 * func g(a: Animal, b: Cat): void { return; }
 * func g(a: Cat, b: Animal): void { return; }
 * g(Cat(), Cat()); % TypeErrorAmbiguousOverload: No overload matches this call.
 */
export class TypeErrorAmbiguousOverload extends CplTypeError {
	/**
	 * Construct a new TypeErrorAmbiguousOverload object.
	 * @param node  - the function declaration node or call node
	 * @param cause - any sub-error providing more details
	 */
	public constructor(node: AST.STMT.DeclarationFunction);
	public constructor(node: AST.EXPR.Call, cause?: Error);
	public constructor(node: AST.STMT.DeclarationFunction | AST.EXPR.Call, cause?: Error) {
		super(
			node instanceof AST.STMT.DeclarationFunction
				? 'Duplciate function overload declared.'
				: `No unique overload matches this call.${cause ? `\n${cause.message}` : ''}`,
			CplTypeError.CODES.get(TypeErrorAmbiguousOverload),
			node.line_index,
			node.col_index,
		);
		this.cause = cause;
	}
}

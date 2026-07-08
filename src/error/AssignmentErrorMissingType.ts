import type {AST} from '../validator/index.ts';
import {AssignmentError} from './AssignmentError.ts';



/**
 * An AssignmentErrorMissingType is thrown when a variable/parameter/field is declared without a type annotation
 * and it is not eligible for type inference.
 * @example
 * val a = 42 + 1;                 % AssignmentErrorMissingType: Variable `a` is missing a type annotation.
 * func f(b? = 42 + 1): int => -b; % AssignmentErrorMissingType: Parameter `b` is missing a type annotation.
 * class Foo {
 * 	public c = 42 + 1; % AssignmentErrorMissingType: Field `c` is missing a type annotation.
 * }
 */
export class AssignmentErrorMissingType extends AssignmentError {
	/**
	 * Construct a new AssignmentErrorMissingType object.
	 * @param declaration the variable/parameter/field declaration
	 */
	public constructor(declaration: AST.STMT.DeclarationVariable) {
		const symbol_kind: 'Variable' | 'Parameter' | 'Field' = 'Variable';
		const symbol_name: string | undefined                 = declaration.assignee?.source;
		super(
			`${ symbol_kind }${ symbol_name ? ` \`${ symbol_name }\`` : '' } is missing a type annotation.`,
			AssignmentError.CODES.get(AssignmentErrorMissingType),
			declaration.line_index,
			declaration.col_index,
		);
	}
}

import type {
	AST,
	SymbolKind,
} from '../validator/index.js';
import {ReferenceError} from './ReferenceError.js';



/**
 * A ReferenceErrorKind is thrown when a symbol of the wrong kind is used.
 * @example
 * let FOO: int = 42;
 * type T = FOO | float; % ReferenceErrorKind: `FOO` refers to a value, but is used as a type.
 * @example
 * type BAR = int;
 * 42 || BAR;      % ReferenceErrorKind: `BAR` refers to a type, but is used as a value.
 */
export class ReferenceErrorKind extends ReferenceError {
	/**
	 * Construct a new ReferenceErrorKind object.
	 * @param symbol    the referenced symbol
	 * @param refers_to what the symbol was declared as
	 * @param used_as   what the symbol is used as
	 */
	public constructor(symbol: AST.ASTNodeTypeAlias | AST.ASTNodeVariable, refers_to: SymbolKind, used_as: SymbolKind) {
		super(
			`\`${ symbol.source }\` refers to a ${ refers_to }, but is used as a ${ used_as }.`,
			ReferenceError.CODES.get(ReferenceErrorKind),
			symbol.line_index,
			symbol.col_index,
		);
	}
}
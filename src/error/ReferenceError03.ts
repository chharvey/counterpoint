import type {
	SymbolKind,
	AST,
} from './package.js';
import {ReferenceError} from './ReferenceError.js';



/**
 * A ReferenceError03 is thrown when a symbol of the wrong kind is used.
 * @example
 * let FOO: int = 42;
 * type T = FOO | float; % ReferenceError03: `FOO` refers to a value, but is used as a type.
 * @example
 * type FOO = int;
 * 42 || FOO;      % ReferenceError03: `FOO` refers to a type, but is used as a value.
 */
export class ReferenceError03 extends ReferenceError {
	/** The number series of this class of errors. */
	public static override readonly CODE = 3;
	/**
	 * Construct a new ReferenceError03 object.
	 * @param symbol    the referenced symbol
	 * @param refers_to what the symbol was declared as
	 * @param used_as   what the symbol is used as
	 */
	public constructor(symbol: AST.ASTNodeTypeAlias | AST.ASTNodeVariable, refers_to: SymbolKind, used_as: SymbolKind) {
		super(`\`${ symbol.source }\` refers to a ${ refers_to }, but is used as a ${ used_as }.`, ReferenceError03.CODE, symbol.line_index, symbol.col_index);
	}
}

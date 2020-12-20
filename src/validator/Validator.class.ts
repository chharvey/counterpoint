import SolidConfig, {CONFIG_DEFAULT} from '../SolidConfig';
import type SolidLanguageType from './SolidLanguageType.class'



/** Kinds of symbols. */
export enum SymbolKind {
	/** A value variable (a variable holding a Solid Language Value). */
	VALUE,
	/** A type variable / type alias. */
	TYPE,
}



/** An object containing symbol information. */
type SymbolInfo = {
	/** The unique identifier of the symbol, the cooked value of the token. */
	readonly id: bigint;
	/** The kind of declaration: value variable or type variable. */
	readonly kind: SymbolKind;
	/** If `kind` is `VALUE`, the variable’s Type. If `kind` is `TYPE`, the value of the type alias. */
	readonly type: SolidLanguageType;
	/** May the symbol be reassigned? */
	readonly unfixed: boolean;
	/** The 0-based line index of where the symbol was declared. */
	readonly line: number;
	/** Tthe 0-based column index of where the symbol was declared. */
	readonly col: number;
};



/**
 * The Validator is responsible for semantically analyzing, type-checking, and validating source code.
 *
 * Part of semantic analysis is the Decorator, which transforms concrete parse nodes into abstract semantic nodes.
 * It prepares the nodes for the Validator by performing certian operations such as:
 * - removing unnecessary nested nodes, e.g. `(unary (unit (prim 2)))` becomes `(const 2)`
 * - replacing certain syntaxes with data, e.g.
 * 	from `(additive (additive (... 2)) (token '+') (multiplicative (... 3)))`
 * 	to `(sum (const 2) (const 3))`
 */
export default class Validator {
	/** A symbol table, which keeps tracks of variables. */
	private readonly symbol_table: Map<bigint, SymbolInfo> = new Map();

	/**
	 * Construct a new Validator object.
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		readonly config: SolidConfig = CONFIG_DEFAULT,
	) {
	}

	/**
	 * Add a symbol representing a value variable to this Validator’s symbol table.
	 * @param id      the unique identifier of the symbol, the cooked value of the token
	 * @param type    the variable’s Type
	 * @param unfixed may the symbol be reassigned?
	 * @param line    the line   number of the symbol’s declaration
	 * @param col     the column number of the symbol’s declaration
	 * @returns this
	 */
	addVariableSymbol(
		id:      SymbolInfo['id'],
		type:    SymbolInfo['type'],
		unfixed: SymbolInfo['unfixed'],
		line:    SymbolInfo['line'],
		col:     SymbolInfo['col'],
	): this {
		this.symbol_table.set(id, {
			id,
			kind: SymbolKind.VALUE,
			type,
			unfixed,
			line,
			col,
		});
		return this
	}
	/**
	 * Add a symbol representing a type variable to this Validator’s symbol table.
	 * @param id      the unique identifier of the symbol, the cooked value of the token
	 * @param type    the value of the type variable
	 * @param line    the line   number of the symbol’s declaration
	 * @param col     the column number of the symbol’s declaration
	 * @returns this
	 */
	addTypeSymbol(
		id:   SymbolInfo['id'],
		type: SymbolInfo['type'],
		line: SymbolInfo['line'],
		col:  SymbolInfo['col'],
	): this {
		this.symbol_table.set(id, {
			id,
			kind: SymbolKind.TYPE,
			type,
			unfixed: false,
			line,
			col,
		});
		return this;
	}
	/**
	 * Remove a symbol from this Validator’s symbol table.
	 * @param id the id of the symbol to remove
	 * @returns this
	 */
	removeSymbol(id: bigint): this {
		this.symbol_table.delete(id);
		return this
	}
	/**
	 * Check whether this Validator’s symbol table has the symbol.
	 * @param id the symbol id to check
	 * @returns Does the symbol table have a symbol with the given id?
	 */
	hasSymbol(id: bigint): boolean {
		return this.symbol_table.has(id);
	}
	/**
	 * Return the information of a symbol in this Validator’s symbol table.
	 * @param id the symbol id to check
	 * @returns the symbol information of `id`, or `null` if there is no corresponding entry
	 */
	getSymbolInfo(id: bigint): SymbolInfo | null {
		return this.symbol_table.get(id) || null;
	}
	/**
	 * Remove all symbols from this Validator’s symbol table.
	 * @returns this
	 */
	clearSymbols(): this {
		this.symbol_table.clear();
		return this;
	}
}

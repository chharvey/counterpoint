import SolidConfig, {CONFIG_DEFAULT} from '../SolidConfig';
import {
	ParserSolid as Parser,
	PARSER,
} from '../parser/'
import {Decorator} from './Decorator';
import type {
	SemanticNodeGoal,
} from './SemanticNode.class'
import type SolidLanguageType from './SolidLanguageType.class'



/**
 * An object containing symbol information.
 * A “symbol” is a variable or other declaration in source code.
 * - id: the unique identifier of the variable, the cooked value of the token
 * - type: the type of the variable
 * - unfixed: may the variable be reassigned?
 * - line: the 0-based line   index of where the varible was declared
 * - col:  the 0-based column index of where the varible was declared
 */
type SymbolInfo = {
	id: bigint;
	type: SolidLanguageType;
	unfixed: boolean;
	line: number;
	col:  number;
}



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
	 * Add a symbol to this Validator’s symbol table.
	 * @param id    the id of the symbol to add
	 * @param type_ the symbol type
	 * @param unfixed may the symbol be reassigned?
	 * @param line  the line   number of the symbol’s declaration
	 * @param col   the column number of the symbol’s declaration
	 * @returns this
	 */
	addSymbol(
		id: bigint,
		type_: SolidLanguageType,
		unfixed: boolean,
		line: number,
		col: number,
	): this {
		this.symbol_table.set(id, {id, type: type_, unfixed, line, col});
		return this
	}
	/**
	 * Remove a symbol from this Validator’s symbol table.
	 * @param id the id of the symbol to remove
	 * @returns this
	 */
	removeSymbool(id: bigint): this {
		this.symbol_table.delete(id);
		return this
	}
	/**
	 * Check whether this Validator’s symbol table has the symbol.
	 * @param id the symbol id to check
	 * @returns Doees the symbol table have a symbol with the given id?
	 */
	hasSymbol(id: bigint): boolean {
		return this.symbol_table.has(id);
	}
	/**
	 * Return the information of a symol in this Validator’s symbol table.
	 * @param id the symbol id to check
	 * @returns the symbol information of `id`, or `null` if there is no corresponding entry
	 */
	getSymbolInfo(id: bigint): SymbolInfo | null {
		return this.symbol_table.get(id) || null;
	}
}

import type SolidConfig from '../SolidConfig'
import type {
	ParseNodeGoal,
} from '../parser/'
import {Builder} from '../builder/'
import type {
	SemanticNodeGoal,
} from './SemanticNode.class'
import type SolidLanguageType from './SolidLanguageType.class'



/**
 * An object containing symbol information.
 * A “symbol” is a variable or other declaration in source code.
 * - name: the identifier string
 * - type: the type of the variable
 * - line: the 0-based line   index of where the varible was declared
 * - col:  the 0-based column index of where the varible was declared
 */
type SymbolInfo = {
	name: string;
	type: SolidLanguageType;
	line: number;
	col:  number;
}


/**
 * The Validator is responsible for semantically analyzing, type-checking, and validating source code.
 */
export default class Valdator {
	/** A symbol table, which keeps tracks of variables. */
	private readonly symbol_table: Map<string, SymbolInfo> = new Map()

	/**
	 * Construct a new Validator object.
	 * @param parsegoal - A syntactic goal produced by a parser.
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		private readonly parsegoal: ParseNodeGoal,
		private readonly config: SolidConfig,
	) {
	}

	/**
	 * Add a symbol to this Validator’s symbol table.
	 * @param name  the symbol name to add
	 * @param type_ the symbol type
	 * @param line  the line   number of the symbol’s declaration
	 * @param col   the column number of the symbol’s declaration
	 * @returns this
	 */
	addSymbol(name: string, type_: SolidLanguageType, line: number, col: number): this {
		this.symbol_table.set(name, {name, type: type_, line, col})
		return this
	}
	/**
	 * Remove a symbol from this Validator’s symbol table.
	 * @param name the symbol name to remove
	 * @returns this
	 */
	removeSymbool(name: string): this {
		this.symbol_table.delete(name)
		return this
	}
	/**
	 * Check whether this Validator’s symbol table has the symbol.
	 * @param name the symbol name to check
	 * @returns Doees the symbol table have a symbol called `name`?
	 */
	hasSymbol(name: string): boolean {
		return this.symbol_table.has(name)
	}
	/**
	 * Return the information of a symol in this Validator’s symbol table.
	 * @param name the symbol name to check
	 * @returns the symbol information of `name`, or `null` if there is no corresponding entry
	 */
	getSymbolInfo(name: string): SymbolInfo | null {
		return this.symbol_table.get(name) || null
	}

	/**
	 * Type-check the entire source.
	 * Assert that there are no type errors, and then return a semantic goal symbol.
	 * @return the decorated goal parse node
	 */
	validate(): SemanticNodeGoal {
		const semantic_goal: SemanticNodeGoal = this.parsegoal.decorate(this)
		semantic_goal.typeCheck(this.config.compilerOptions) // assert does not throw
		return semantic_goal
	}

	/**
	 * Construct a new Builder object from this Validator.
	 * @return a new Builder with this Validator as its argument
	 */
	get builder(): Builder {
		return new Builder(this.validate(), this.config)
	}
}

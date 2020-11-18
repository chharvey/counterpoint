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
 *
 * Part of semantic analysis is the Decorator, which transforms concrete parse nodes into abstract semantic nodes.
 * It prepares the nodes for the Validator by performing certian operations such as:
 * - removing unnecessary nested nodes, e.g. `(unary (unit (prim 2)))` becomes `(const 2)`
 * - replacing certain syntaxes with data, e.g.
 * 	from `(additive (additive (... 2)) (token '+') (multiplicative (... 3)))`
 * 	to `(sum (const 2) (const 3))`
 */
export default class Validator {
	/** A syntactic goal produced by a parser. */
	private readonly parsegoal: PARSER.ParseNodeGoal;
	/** A symbol table, which keeps tracks of variables. */
	private readonly symbol_table: Map<string, SymbolInfo> = new Map()

	/**
	 * Construct a new Validator object.
	 * @param source - the source text
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		source: string,
		private readonly config: SolidConfig = CONFIG_DEFAULT,
	) {
		this.parsegoal = new Parser(source, config).parse();
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
		const semantic_goal: SemanticNodeGoal = Decorator.decorate(this.parsegoal);
		semantic_goal.typeCheck(this.config.compilerOptions) // assert does not throw
		return semantic_goal
	}
}

import {
	SolidConfig,
	CONFIG_DEFAULT,
	Punctuator,
	Keyword,
	TOKEN_SOLID as TOKEN,
} from './package.js';
import type {SymbolStructure} from './index.js';



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
export class Validator {
	/**
	 * Give the unique integer identifier of a punctuator token.
	 * The id is determined by the language specification.
	 * @param source the token’s text
	 * @return       the unique id identifying the token
	 */
	static cookTokenPunctuator(source: Punctuator): bigint {
		const index: number = TOKEN.TokenPunctuator.PUNCTUATORS.indexOf(source);
		if (0 <= index && index < TOKEN.TokenPunctuator.PUNCTUATORS.length) {
			return BigInt(index) + TOKEN.TokenPunctuator.MINIMUM_VALUE;
		} else {
			throw new RangeError(`Token \`${ source }\` is not a valid punctuator.`);
		}
	}

	/**
	 * Give the unique integer identifier of a reserved keyword token.
	 * The id is determined by the language specification.
	 * @param source the token’s text
	 * @return       the unique id identifying the token
	 */
	static cookTokenKeyword(source: Keyword): bigint {
		const index: number = TOKEN.TokenKeyword.KEYWORDS.indexOf(source);
		if (0 <= index && index < TOKEN.TokenKeyword.KEYWORDS.length) {
			return BigInt(index) + TOKEN.TokenKeyword.MINIMUM_VALUE;
		} else {
			throw new RangeError(`Token \`${ source }\` is not a valid keyword.`);
		}
	}

	/**
	 * Give the numeric value of a number token.
	 * @param source the token’s text
	 * @return       the numeric value, cooked
	 */
	static cookTokenNumber(source: string): ReturnType<typeof TOKEN.TokenNumber.prototype.cook> {
		const is_float:  boolean = source.indexOf(TOKEN.TokenNumber.POINT) > 0;
		const has_unary: boolean = (TOKEN.TokenNumber.UNARY as readonly string[]).includes(source[0]);
		const has_radix: boolean = (has_unary) ? source[1] === TOKEN.TokenNumber.ESCAPER : source[0] === TOKEN.TokenNumber.ESCAPER;
		const radix = (has_radix)
			? TOKEN.TokenNumber.BASES.get((has_unary)
				? source[2]
				: source[1]
			)!
			: TOKEN.TokenNumber.RADIX_DEFAULT;
		return TOKEN.TokenNumber.prototype.cook.call({
			source,
			isFloat: is_float,
			has_unary,
			has_radix,
			radix,
			allow_separators: true,
		});
	}

	/**
	 * Give the text value of a string token.
	 * @param source the token’s text
	 * @return       the text value, cooked
	 */
	static cookTokenString(source: string): ReturnType<typeof TOKEN.TokenString.prototype.cook> {
		return TOKEN.TokenString.prototype.cook.call({
			source,
			allow_comments: true,
			allow_separators: true,
		});
	}

	/**
	 * Give the text value of a template token.
	 * @param source the token’s text
	 * @return       the text value, cooked
	 */
	static cookTokenTemplate(source: string): ReturnType<typeof TOKEN.TokenTemplate.prototype.cook> {
		return TOKEN.TokenTemplate.prototype.cook.call({
			source,
			delim_start: (
				(source.slice(0, 3) === TOKEN.TokenTemplate.DELIM)            ? TOKEN.TokenTemplate.DELIM :
				(source.slice(0, 2) === TOKEN.TokenTemplate.DELIM_INTERP_END) ? TOKEN.TokenTemplate.DELIM_INTERP_END :
				''
			),
			delim_end: (
				(source.slice(-3) === TOKEN.TokenTemplate.DELIM)              ? TOKEN.TokenTemplate.DELIM :
				(source.slice(-2) === TOKEN.TokenTemplate.DELIM_INTERP_START) ? TOKEN.TokenTemplate.DELIM_INTERP_START :
				''
			),
		});
	}


	/** A symbol table, which keeps tracks of variables. */
	private readonly symbol_table: Map<bigint, SymbolStructure> = new Map();

	/**
	 * A bank of unique identifier names.
	 * COMBAK: Note that this is only temporary, until we have identifiers bound to object and lexical environments.
	 */
	private readonly identifiers: Set<string> = new Set();

	/**
	 * Construct a new Validator object.
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		readonly config: SolidConfig = CONFIG_DEFAULT,
	) {
	}

	/**
	 * Add a symbol representing a value variable or type variable to this Validator’s symbol table.
	 * @param symbol the object encoding data of the symbol
	 * @returns this
	 */
	addSymbol(symbol: SymbolStructure): this {
		this.symbol_table.set(symbol.id, symbol);
		return this
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
	getSymbolInfo(id: bigint): SymbolStructure | null {
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

	/**
	 * Give a uniquely-generated integer identifier of a custom identifier token.
	 * @param source the token’s text
	 * @return       the unique id identifying the token
	 */
	cookTokenIdentifier(source: string): bigint {
		this.identifiers.add(source);
		return BigInt([...this.identifiers].indexOf(source)) + TOKEN.TokenIdentifier.MINIMUM_VALUE;
	}
}

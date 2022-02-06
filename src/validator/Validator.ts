import {
	LexError01,
	SolidConfig,
	CONFIG_DEFAULT,
	Punctuator,
	PUNCTUATORS,
	Keyword,
	KEYWORDS,
	TOKEN_SOLID as TOKEN,
} from './package.js';
import type {SymbolStructure} from './index.js';



type RadixType = 2n | 4n | 8n | 10n | 16n | 36n;
const RADIX_DEFAULT = 10n;
const ESCAPER       = '\\';
const SEPARATOR     = '_';
const POINT         = '.';
const EXPONENT      = 'e';



function tokenWorthInt(
	text: string,
	radix: RadixType = RADIX_DEFAULT,
	allow_separators: SolidConfig['languageFeatures']['numericSeparators'] = CONFIG_DEFAULT.languageFeatures.numericSeparators,
): number {
	if (text.length === 0) { throw new Error('Cannot compute mathematical value of empty string.'); }
	if (allow_separators && text[text.length - 1] === SEPARATOR) {
		text = text.slice(0, -1);
	}
	if (text.length === 1) {
		const digitvalue: number = parseInt(text, Number(radix));
		if (Number.isNaN(digitvalue)) {
			throw new Error(`Invalid number format: \`${ text }\``);
		}
		return digitvalue;
	}
	return Number(radix)
		* tokenWorthInt(text.slice(0, -1),     radix, allow_separators)
		+ tokenWorthInt(text[text.length - 1], radix, allow_separators);
}
function tokenWorthFloat(
	text: string,
	allow_separators: SolidConfig['languageFeatures']['numericSeparators'] = CONFIG_DEFAULT.languageFeatures.numericSeparators,
): number {
	const base:       number = Number(RADIX_DEFAULT);
	const pointindex: number = text.indexOf(POINT);
	const expindex:   number = text.indexOf(EXPONENT);
	const wholepart:  string = text.slice(0, pointindex);
	const fracpart:   string = (expindex < 0) ? text.slice(pointindex + 1) : text.slice(pointindex + 1, expindex);
	const exppart:    string = (expindex < 0) ? '0'                        : text.slice(expindex   + 1);
	const wholevalue: number = tokenWorthInt(wholepart, RADIX_DEFAULT, allow_separators);
	const fracvalue:  number = tokenWorthInt(fracpart,  RADIX_DEFAULT, allow_separators) * base ** -fracpart.length;
	const expvalue:   number = parseFloat( // HACK: `` parseFloat(`1e${ ... }`) `` is more accurate than `base ** tokenWorthInt(...)`
		(exppart[0] === Punctuator.AFF) ? `1e+${ tokenWorthInt(exppart.slice(1), RADIX_DEFAULT, allow_separators) }` :
		(exppart[0] === Punctuator.NEG) ? `1e-${ tokenWorthInt(exppart.slice(1), RADIX_DEFAULT, allow_separators) }` :
		                                  `1e${  tokenWorthInt(exppart,          RADIX_DEFAULT, allow_separators) }`,
	);
	return (wholevalue + fracvalue) * expvalue;
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
export class Validator {
	/** The minimum allowed cooked value of a punctuator token. */
	private static readonly MIN_VALUE_PUNCTUATOR = 0n;

	/** The minimum allowed cooked value of a keyword token. */
	private static readonly MIN_VALUE_KEYWORD = 0x80n;

	/** The minimum allowed cooked value of an identifier token. */
	private static readonly MIN_VALUE_IDENTIFIER = 0x100n;

	/**
	 * Give the unique integer identifier of a punctuator token.
	 * The id is determined by the language specification.
	 * @param source the token’s text
	 * @return       the unique id identifying the token
	 */
	static cookTokenPunctuator(source: Punctuator): bigint {
		const index: number = PUNCTUATORS.indexOf(source);
		if (0 <= index && index < PUNCTUATORS.length) {
			return BigInt(index) + Validator.MIN_VALUE_PUNCTUATOR;
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
		const index: number = KEYWORDS.indexOf(source);
		if (0 <= index && index < KEYWORDS.length) {
			return BigInt(index) + Validator.MIN_VALUE_KEYWORD;
		} else {
			throw new RangeError(`Token \`${ source }\` is not a valid keyword.`);
		}
	}

	/**
	 * Give the numeric value of a number token.
	 * @param source the token’s text
	 * @return       the numeric value, cooked
	 */
	static cookTokenNumber(source: string, config: SolidConfig): [number, boolean] {
		const is_float:   boolean   = source.indexOf(POINT) > 0;
		const has_unary:  boolean   = ([Punctuator.AFF, Punctuator.NEG] as string[]).includes(source[0]);
		const multiplier: number    = (has_unary && source[0] === Punctuator.NEG) ? -1 : 1;
		const has_radix:  boolean   = (has_unary) ? source[1] === ESCAPER : source[0] === ESCAPER;
		const radix:      RadixType = (has_radix) ? new Map<string, RadixType>([
			['b',  2n],
			['q',  4n],
			['o',  8n],
			['d', 10n],
			['x', 16n],
			['z', 36n],
		]).get((has_unary) ? source[2] : source[1])! : RADIX_DEFAULT;
		if (has_radix && !config.languageFeatures.integerRadices) {
			// @ts-expect-error
			throw new LexError01({
				source,
				line_index: -1,
				col_index:  -1,
			});
		}
		if (has_unary) source = source.slice(1); // cut off unary, if any
		if (has_radix) source = source.slice(2); // cut off radix, if any
		return [
			multiplier * ((is_float)
				? tokenWorthFloat(source,        config.languageFeatures.numericSeparators)
				: tokenWorthInt  (source, radix, config.languageFeatures.numericSeparators)
			),
			is_float,
		];
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
		return BigInt([...this.identifiers].indexOf(source)) + Validator.MIN_VALUE_IDENTIFIER;
	}
}

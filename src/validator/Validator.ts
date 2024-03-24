import utf8 from 'utf8'; // need `tsconfig.json#compilerOptions.allowSyntheticDefaultImports = true`
import {LexError01} from '../index.js';
import {
	type CodeUnit,
	throw_expression,
} from '../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../core/index.js';
import {
	Punctuator,
	type Keyword,
	KEYWORDS,
	type Serializable,
} from '../parser/index.js';
import type {SymbolStructure} from './index.js';
import {utf8Encode} from './utils-private.js';



type RadixType = 2n | 4n | 6n | 8n | 10n | 16n | 36n;



const RADIX_DEFAULT      = 10n;
const ESCAPER            = '\\';
const SEPARATOR          = '_';
const POINT              = '.';
const EXPONENT           = 'e';
const DELIM_STRING       = '"';
const DELIM_TEMPLATE     = '"""';
const DELIM_INTERP_START = '{{';
const DELIM_INTERP_END   = '}}';
const COMMENTER_LINE     = '%';
const COMMENTER_MULTI    = '%%';



function tokenWorthInt(
	text: string,
	radix: RadixType = RADIX_DEFAULT,
	allow_separators: CPConfig['languageFeatures']['numericSeparators'] = CONFIG_DEFAULT.languageFeatures.numericSeparators,
): number {
	if (text.length === 0) {
		throw new Error('Cannot compute mathematical value of empty string.');
	}
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
	allow_separators: CPConfig['languageFeatures']['numericSeparators'] = CONFIG_DEFAULT.languageFeatures.numericSeparators,
): number {
	const base:       number = Number(RADIX_DEFAULT);
	const pointindex: number = text.indexOf(POINT);
	const expindex:   number = text.indexOf(EXPONENT);
	const wholepart:  string = text.slice(0, pointindex);
	const fracpart:   string = (expindex < 0) ? text.slice(pointindex + 1) : text.slice(pointindex + 1, expindex);
	const exppart:    string = (expindex < 0) ? '0'                        : text.slice(expindex   + 1);
	const wholevalue: number = tokenWorthInt(wholepart, RADIX_DEFAULT, allow_separators);
	const fracvalue:  number = tokenWorthInt(fracpart,  RADIX_DEFAULT, allow_separators) * base ** -fracpart.length;
	const expvalue:   number = parseFloat(( // HACK: `` parseFloat(`1e${ ... }`) `` is more accurate than `base ** tokenWorthInt(...)`
		(exppart[0] === Punctuator.AFF) ? `1e+${ tokenWorthInt(exppart.slice(1), RADIX_DEFAULT, allow_separators) }` :
		(exppart[0] === Punctuator.NEG) ? `1e-${ tokenWorthInt(exppart.slice(1), RADIX_DEFAULT, allow_separators) }` :
		                                  `1e${  tokenWorthInt(exppart,          RADIX_DEFAULT, allow_separators) }`
	));
	return (wholevalue + fracvalue) * expvalue;
}



function tokenWorthString(
	text: string,
	allow_comments:   CPConfig['languageFeatures']['comments']          = CONFIG_DEFAULT.languageFeatures.comments,
	allow_separators: CPConfig['languageFeatures']['numericSeparators'] = CONFIG_DEFAULT.languageFeatures.numericSeparators,
): CodeUnit[] {
	if (text.length === 0) {
		return [];
	}
	if (text[0] === ESCAPER) {
		/* possible escape or line continuation */
		if ([
			DELIM_STRING,
			ESCAPER,
			COMMENTER_LINE,
			's', 't', 'n', 'r', // eslint-disable-line array-element-newline
		].includes(text[1])) {
			/* an escaped character literal */
			return [
				...new Map([
					[DELIM_STRING,   utf8Encode(DELIM_STRING   .codePointAt(0)!)],
					[ESCAPER,        utf8Encode(ESCAPER        .codePointAt(0)!)],
					[COMMENTER_LINE, utf8Encode(COMMENTER_LINE .codePointAt(0)!)],
					['s',            utf8Encode(0x20)],
					['t',            utf8Encode(0x09)],
					['n',            utf8Encode(0x0a)],
					['r',            utf8Encode(0x0d)],
				]).get(text[1])!,
				...tokenWorthString(text.slice(2), allow_comments, allow_separators),
			];
		} else if (`${ text[1] }${ text[2] }` === 'u{') {
			/* an escape sequence */
			const sequence: RegExpMatchArray = text.match(/\\u{[0-9a-f_]*}/) !;
			return [
				...utf8Encode(tokenWorthInt(sequence[0].slice(3, -1) || '0', 16n, allow_separators)),
				...tokenWorthString(text.slice(sequence[0].length), allow_comments, allow_separators),
			];
		} else if (text[1] === '\n') {
			/* a line continuation (LF) */
			return [
				...utf8Encode(0x20),
				...tokenWorthString(text.slice(2), allow_comments, allow_separators),
			];
		} else {
			/* a backslash escapes the following character */
			return [
				...utf8Encode(text.codePointAt(1)!),
				...tokenWorthString([...text].slice(2).join('')/* UTF-16 */, allow_comments, allow_separators),
			];
		}
	} else if (allow_comments && `${ text[0] }${ text[1] }` === COMMENTER_MULTI) {
		/* an in-string multiline comment */
		const match: string = text.match(/%%(?:%?[^'%])*(?:%%)?/)![0];
		return tokenWorthString(text.slice(match.length), allow_comments, allow_separators);
	} else if (allow_comments && text[0] === COMMENTER_LINE) {
		/* an in-string line comment */
		const match: string = text.match(/%[^'\n]*\n?/)![0];
		const rest: CodeUnit[] = tokenWorthString(text.slice(match.length), allow_comments, allow_separators);
		return (match[match.length - 1] === '\n') // COMBAK `match.lastItem`
			? [...utf8Encode(0x0a), ...rest]
			: rest;
	} else {
		return [
			...utf8Encode(text.codePointAt(0)!),
			...tokenWorthString([...text].slice(1).join('')/* UTF-16 */, allow_comments, allow_separators),
		];
	}
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
	/** The minimum allowed cooked value of a keyword token. */
	private static readonly MIN_VALUE_KEYWORD = 0x80n;

	/** The minimum allowed cooked value of an identifier token. */
	private static readonly MIN_VALUE_IDENTIFIER = 0x100n;

	/**
	 * Give the unique integer identifier of a reserved keyword token.
	 * The id is determined by the language specification.
	 * @param source the token’s text
	 * @return       the unique id identifying the token
	 */
	public static cookTokenKeyword(source: Keyword): bigint {
		const index: number = KEYWORDS.indexOf(source);
		return (0 <= index && index < KEYWORDS.length)
			? BigInt(index) + Validator.MIN_VALUE_KEYWORD
			: throw_expression(new RangeError(`Token \`${ source }\` is not a valid keyword.`));
	}

	/**
	 * Give the numeric value of a number token.
	 * @param source the token’s text
	 * @param config configuration settings
	 * @return       the numeric value, cooked, along with whether the cooked value is a float
	 */
	public static cookTokenNumber(source: string, config: CPConfig): [number, boolean] {
		const is_float:   boolean   = source.indexOf(POINT) > 0;
		const has_unary:  boolean   = ([Punctuator.AFF, Punctuator.NEG] as string[]).includes(source[0]);
		const multiplier: number    = (has_unary && source[0] === Punctuator.NEG) ? -1 : 1;
		const has_radix:  boolean   = (has_unary) ? source[1] === ESCAPER : source[0] === ESCAPER;
		const radix:      RadixType = (has_radix) ? new Map<string, RadixType>([
			['b',  2n],
			['q',  4n],
			['s',  6n],
			['o',  8n],
			['d', 10n],
			['x', 16n],
			['z', 36n],
		]).get((has_unary) ? source[2] : source[1])! : RADIX_DEFAULT;
		if (has_radix && !config.languageFeatures.integerRadices) {
			throw new LexError01({
				source,
				line_index: -1,
				col_index:  -1,
			} as Serializable);
		}
		/* eslint-disable curly */
		if (has_unary) source = source.slice(1); // cut off unary, if any
		if (has_radix) source = source.slice(2); // cut off radix, if any
		/* eslint-enable curly */
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
	 * @param config configuration settings
	 * @return       the text value, cooked
	 */
	public static cookTokenString(source: string, config: CPConfig): CodeUnit[] {
		return tokenWorthString(
			source.slice(DELIM_STRING.length, -DELIM_STRING.length),
			config.languageFeatures.comments,
			config.languageFeatures.numericSeparators,
		);
	}

	/**
	 * Give the text value of a template token.
	 * @param source the token’s text
	 * @return       the text value, cooked
	 */
	public static cookTokenTemplate(source: string): CodeUnit[] {
		const delim_start = (
			(source.slice(0, 3) === DELIM_TEMPLATE)   ? DELIM_TEMPLATE   :
			(source.slice(0, 2) === DELIM_INTERP_END) ? DELIM_INTERP_END :
			''
		);
		const delim_end = (
			(source.slice(-3) === DELIM_TEMPLATE)     ? DELIM_TEMPLATE     :
			(source.slice(-2) === DELIM_INTERP_START) ? DELIM_INTERP_START :
			''
		);
		return [...utf8.encode(source.slice(delim_start.length, -delim_end.length))].map((ch) => ch.codePointAt(0)!);
	}


	/** A symbol table, which keeps tracks of variables. */
	private readonly symbol_table = new Map<bigint, SymbolStructure>();

	/**
	 * A bank of unique identifier names.
	 * COMBAK: Note that this is only temporary, until we have identifiers bound to object and lexical environments.
	 */
	private readonly identifiers = new Set<string>();

	/**
	 * Construct a new Validator object.
	 * @param config - The configuration settings for an instance program.
	 */
	public constructor(public readonly config: CPConfig = CONFIG_DEFAULT) {
	}

	/**
	 * Add a symbol representing a value variable or type variable to this Validator’s symbol table.
	 * @param symbol the object encoding data of the symbol
	 * @returns this
	 */
	public addSymbol(symbol: SymbolStructure): this {
		this.symbol_table.set(symbol.id, symbol);
		return this;
	}

	/**
	 * Remove a symbol from this Validator’s symbol table.
	 * @param id the id of the symbol to remove
	 * @returns this
	 */
	public removeSymbol(id: bigint): this {
		this.symbol_table.delete(id);
		return this;
	}

	/**
	 * Check whether this Validator’s symbol table has the symbol.
	 * @param id the symbol id to check
	 * @returns Does the symbol table have a symbol with the given id?
	 */
	public hasSymbol(id: bigint): boolean {
		return this.symbol_table.has(id);
	}

	/**
	 * Return the information of a symbol in this Validator’s symbol table.
	 * @param id the symbol id to check
	 * @returns the symbol information of `id`, or `null` if there is no corresponding entry
	 */
	public getSymbolInfo(id: bigint): SymbolStructure | null {
		return this.symbol_table.get(id) || null;
	}

	/**
	 * Remove all symbols from this Validator’s symbol table.
	 * @returns this
	 */
	public clearSymbols(): this {
		this.symbol_table.clear();
		return this;
	}

	/**
	 * Give a uniquely-generated integer identifier of a custom identifier token.
	 * @param source the token’s text
	 * @return       the unique id identifying the token
	 */
	public cookTokenIdentifier(source: string): bigint {
		this.identifiers.add(source);
		return BigInt([...this.identifiers].indexOf(source)) + Validator.MIN_VALUE_IDENTIFIER;
	}
}

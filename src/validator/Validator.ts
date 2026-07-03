import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../core/index.ts';
import {
	Punctuator,
	type Keyword,
	KEYWORDS,
} from '../parser/index.ts';
import type {SymbolSchema} from './index.ts';
import {
	type SyntaxNodeType,
	isSyntaxNodeType,
} from './utils-private.ts';
import {
	ValidIntrinsicName,
	ValidFunctionName,
} from './ast/utils-private.ts';



type RadixType = 2n | 4n | 6n | 8n | 10n | 16n | 36n;



/**
 * A code point is an integer within the closed interval [0, 0x10_ffff] that represents
 * the index of a character in the Unicode Universal Character Set.
 */
type CodePoint = number;



/**
 * A code unit is an integer within the closed interval [0, 0xff] that represents
 * a byte of an encoded Unicode code point.
 */
type CodeUnit = number;



/**
 * An encoded character is a sequence of code units
 * that corresponds to a single code point in the UTF-8 encoding.
 */
type EncodedChar = (
	| [CodeUnit]
	| [CodeUnit, CodeUnit]
	| [CodeUnit, CodeUnit, CodeUnit]
	| [CodeUnit, CodeUnit, CodeUnit, CodeUnit]
);



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



const PRIME = 0x00000100000001b3n; // 64-bit FNV_prime
const SEED  = 0x48617368416c676fn; // 'HashAlgo' in UTF-8
//             H a s h A l g o



/**
 * The UTF-8 encoding of a numeric code point value.
 * @param   codepoint a Unicode code point
 * @returns           a code unit sequence representing the code point
 */
export function utf8Encode(codepoint: CodePoint): EncodedChar {
	xjs.Number.assertType(codepoint, xjs.NumericType.NATURAL);
	return [...new TextEncoder().encode(String.fromCodePoint(codepoint))] as EncodedChar;
}



function tokenWorthInt(
	text: string,
	radix: RadixType = RADIX_DEFAULT,
): bigint {
	if (text.length === 0) {
		throw new Error('Cannot compute mathematical value of empty string.');
	}
	if (text.endsWith(SEPARATOR)) {
		text = text.slice(0, -1);
	}
	if (text.length === 1) {
		const digitvalue: number = parseInt(text, Number(radix));
		if (Number.isNaN(digitvalue)) {
			throw new Error(`Invalid number format: \`${ text }\``);
		}
		return BigInt(digitvalue);
	}
	const tens: bigint = tokenWorthInt(text.slice(0, -1),     radix);
	const ones: bigint = tokenWorthInt(text[text.length - 1], radix);
	return radix * tens + ones;
}



function tokenWorthFloat(text: string): number {
	const base:       number = Number(RADIX_DEFAULT);
	const pointindex: number = text.indexOf(POINT);
	const expindex:   number = text.indexOf(EXPONENT);
	const wholepart:  string = text.slice(0, pointindex);
	const fracpart:   string = (expindex < 0) ? text.slice(pointindex + 1) : text.slice(pointindex + 1, expindex);
	const exppart:    string = (expindex < 0) ? '0'                        : text.slice(expindex   + 1);
	const wholevalue: number = Number(tokenWorthInt(wholepart, RADIX_DEFAULT));
	const fracvalue:  number = Number(tokenWorthInt(fracpart,  RADIX_DEFAULT)) * base ** -fracpart.length;
	const expvalue:   number = parseFloat(( // HACK: `` parseFloat(`1e${ ... }`) `` is more accurate than `base ** tokenWorthInt(...)`
		exppart.startsWith(Punctuator.AFF) ? `1e+${ tokenWorthInt(exppart.slice(1), RADIX_DEFAULT) }` :
		exppart.startsWith(Punctuator.NEG) ? `1e-${ tokenWorthInt(exppart.slice(1), RADIX_DEFAULT) }` :
		                                     `1e${  tokenWorthInt(exppart,          RADIX_DEFAULT) }` // eslint-disable-line @stylistic/indent
	));
	return (wholevalue + fracvalue) * expvalue;
}



function tokenWorthString(text: string): CodeUnit[] {
	if (text.length === 0) {
		return [];
	}
	if (text.startsWith(ESCAPER)) {
		/* possible escape or line continuation */
		if ([
			DELIM_STRING,
			ESCAPER,
			COMMENTER_LINE,
			's', 't', 'n', 'r', // eslint-disable-line @stylistic/array-element-newline
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
				...tokenWorthString(text.slice(2)),
			];
		} else if (`${ text[1] }${ text[2] }` === 'u{') {
			/* an escape sequence */
			const sequence: RegExpMatchArray = text.match(/\\u{[0-9a-f_]*}/)!;
			return [
				...utf8Encode(Number(tokenWorthInt(sequence[0].slice(3, -1) || '0', 16n))),
				...tokenWorthString(text.slice(sequence[0].length)),
			];
		} else if (text[1] === '\n') {
			/* a line continuation (LF) */
			return [
				...utf8Encode(0x20),
				...tokenWorthString(text.slice(2)),
			];
		} else {
			/* a backslash escapes the following character */
			return [
				...utf8Encode(text.codePointAt(1)!),
				...tokenWorthString([...text].slice(2).join('')/* UTF-16 */),
			];
		}
	} else if (`${ text[0] }${ text[1] }` === COMMENTER_MULTI) {
		/* an in-string multiline comment */
		const match: string = text.match(/%%(?:%?[^'%])*(?:%%)?/)![0];
		return tokenWorthString(text.slice(match.length));
	} else if (text.startsWith(COMMENTER_LINE)) {
		/* an in-string line comment */
		const match: string = text.match(/%[^'\n]*\n?/)![0];
		const rest: CodeUnit[] = tokenWorthString(text.slice(match.length));
		return match.endsWith('\n')
			? [...utf8Encode(0x0a), ...rest]
			: rest;
	} else {
		return [
			...utf8Encode(text.codePointAt(0)!),
			...tokenWorthString([...text].slice(1).join('')/* UTF-16 */),
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
	/** A bank of unique intrinsic identifier names. */
	private static readonly INTRINSICS: ReadonlySet<string> = new Set<string>([
		ValidIntrinsicName.OBJECT,
		ValidFunctionName.INTEGER,
		ValidFunctionName.NATURAL,
		ValidFunctionName.FLOAT,
		ValidFunctionName.STRING,
		ValidFunctionName.LIST,
		ValidFunctionName.DICT,
		ValidFunctionName.SET,
		ValidFunctionName.MAP,
	]);

	/** The minimum allowed cooked value of a reserved keyword token. */
	private static readonly MIN_VALUE_KEYWORD = 0x40n;

	/** The minimum allowed cooked value of an intrinsic identifier token. */
	private static readonly MIN_VALUE_INTRINSIC = 0x80n;

	/** The minimum allowed cooked value of a user-defined identifier token. */
	private static readonly MIN_VALUE_IDENTIFIER = 0x100n;

	/** Hash function for strings. */
	private static hashString(s: string): bigint {
		return [SEED, ...new TextEncoder().encode(s)].map((n) => BigInt(n)).reduce((a, b) => BigInt.asUintN(64, (a ^ b) * PRIME));
	}

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
			: assert.fail(new RangeError(`Token \`${ source }\` is not a valid keyword.`));
	}

	/**
	 * Give a uniquely-generated integer identifier of a custom language identifier token.
	 * @param source the token’s text
	 * @return       the unique id identifying the token
	 */
	public static cookTokenIdentifier(source: string): bigint {
		if (Validator.INTRINSICS.has(source)) {
			return Validator.MIN_VALUE_INTRINSIC + BigInt([...Validator.INTRINSICS].indexOf(source));
		}
		return Validator.MIN_VALUE_IDENTIFIER + Validator.hashString(source);
	}

	/**
	 * Give the numeric value of a number token.
	 * If the returned value is a native `bigint`, it represents either a Counterpoint Integer or Natural language value;
	 * if the returned value is a native `number`, it represents a Counterpoint Float language value.
	 * @param source the token’s text
	 * @return       the numeric value, cooked
	 */
	public static cookTokenNumber(source: string): {type: 'int' | 'nat', value: bigint} | {type: 'float', value: number} {
		const has_unary:  boolean   = ([Punctuator.AFF, Punctuator.NEG] as string[]).includes(source[0]);
		const multiplier: number    = (has_unary && source.startsWith(Punctuator.NEG)) ? -1 : 1;
		const has_radix:  boolean   = (has_unary) ? source[1] === ESCAPER : source.startsWith(ESCAPER);
		const radix:      RadixType = (has_radix) ? new Map<string, RadixType>([
			['b',  2n],
			['q',  4n],
			['s',  6n],
			['o',  8n],
			['d', 10n],
			['x', 16n],
			['z', 36n],
		]).get((has_unary) ? source[2] : source[1])! : RADIX_DEFAULT;

		const typ: 'int' | 'nat' | 'float' = source.includes(POINT) ? 'float' : has_unary && multiplier === 1 ? 'nat' : 'int';

		/* eslint-disable curly */
		if (has_unary) source = source.slice(1); // cut off unary, if any
		if (has_radix) source = source.slice(2); // cut off radix, if any
		/* eslint-enable curly */
		return typ === 'float'
			? {type: typ, value:        multiplier  * tokenWorthFloat(source)}
			: {type: typ, value: BigInt(multiplier) * tokenWorthInt  (source, radix)};
	}

	/**
	 * Give the text value of a string token.
	 * @param source the token’s text
	 * @return       the text value, cooked
	 */
	public static cookTokenString(source: string): Uint8Array {
		return new Uint8Array(tokenWorthString(source.slice(DELIM_STRING.length, -DELIM_STRING.length)));
	}

	/**
	 * Give the text value of a template token.
	 * @param source the token’s text
	 * @return       the text value, cooked
	 */
	public static cookTokenTemplate(source: string): Uint8Array {
		const delim_start = (
			source.startsWith(DELIM_TEMPLATE)   ? DELIM_TEMPLATE   :
			source.startsWith(DELIM_INTERP_END) ? DELIM_INTERP_END :
			''
		);
		const delim_end = (
			source.endsWith(DELIM_TEMPLATE)     ? DELIM_TEMPLATE     :
			source.endsWith(DELIM_INTERP_START) ? DELIM_INTERP_START :
			''
		);
		return new TextEncoder().encode(source.slice(delim_start.length, -delim_end.length));
	}


	/** A symbol table, which keeps tracks of variables. */
	private readonly symbol_table = new Map<bigint, SymbolSchema>();

	/**
	 * Construct a new Validator object.
	 * @param config - The configuration settings for an instance program.
	 * @param parent - a parent validator from which to inherit symbols
	 */
	public constructor(
		public  readonly config:  CplConfig = CONFIG_DEFAULT,
		private readonly parent?: Validator,
	) {
	}

	/**
	 * Add a symbol representing a value variable or type variable to this Validator’s symbol table.
	 * @param symbol the object encoding data of the symbol
	 * @returns this
	 */
	public addSymbol(symbol: SymbolSchema): this {
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
		return this.symbol_table.has(id) || (this.parent?.hasSymbol(id) ?? false);
	}

	/**
	 * Return the information of a symbol in this Validator’s symbol table.
	 * @param id the symbol id to check
	 * @returns the symbol information of `id`, or `undefined` if there is no corresponding entry
	 */
	public getSymbol(id: bigint): SymbolSchema | undefined {
		return this.symbol_table.get(id) ?? this.parent?.getSymbol(id);
	}

	/**
	 * Return a copy of this Validator’s symbols.
	 * @return the symbols in a new map
	 */
	public getAllSymbols(): Map<bigint, SymbolSchema> {
		return new Map([...(this.parent?.symbol_table ?? []), ...this.symbol_table]);
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
	 * Return the integer identifier (ID) of a given word,
	 * whether it be a reserved keyword, the name of a constant, or a language identifier.
	 * @param word the SyntaxNode to get the ID of
	 * @return     if the word is reserved or has already been cooked, its existing ID; else a new ID
	 */
	public wordNodeID(word: SyntaxNodeType<'word'>): bigint {
		return isSyntaxNodeType(word.children[0], 'identifier')
			? Validator.cookTokenIdentifier(word.children[0].text)
			: isSyntaxNodeType(word.children[0], 'keyword_type') || isSyntaxNodeType(word.children[0], 'keyword_value')
				? Validator.cookTokenKeyword(word.children[0].children[0].text as Keyword)
				: Validator.cookTokenKeyword(word.children[0].text as Keyword);
	}
}

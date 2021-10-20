import type {
	Char,
} from '@chharvey/parser';
import * as xjs from 'extrajs';
import utf8 from 'utf8';
import {
	NonemptyArray,
	CodeUnit,
	SolidConfig,
	CONFIG_DEFAULT,
} from './package.js';
import {TokenCommentLine} from './TokenCommentLine.js';
import {TokenCommentMulti} from './TokenCommentMulti.js';
import {TokenSolid} from './TokenSolid.js';
import {TokenNumber} from './TokenNumber.js';



/**
 * A code point is a number within [0, 0x10_ffff] that represents
 * the index of a character in the Unicode Universal Character Set.
 */
type CodePoint = number;



/**
 * An encoded character is a sequence of code units
 * that corresponds to a single code point in the UTF-8 encoding.
 */
type EncodedChar =
	| [CodeUnit]
	| [CodeUnit, CodeUnit]
	| [CodeUnit, CodeUnit, CodeUnit]
	| [CodeUnit, CodeUnit, CodeUnit, CodeUnit]
;



export class TokenString extends TokenSolid {
	static readonly DELIM:   '\'' = '\''
	static readonly ESCAPER: '\\' = '\\'
	static readonly ESCAPES: readonly string[] = [
		TokenString.DELIM,
		TokenString.ESCAPER,
		TokenCommentLine.DELIM_START,
		's', 't', 'n', 'r',
	];
	/**
	 * The UTF-8 encoding of a numeric code point value.
	 * @param   codepoint a positive integer within [0x0, 0x10_ffff]
	 * @returns           a code unit sequence representing the code point
	 */
	private static utf8Encode(codepoint: CodePoint): EncodedChar {
		xjs.Number.assertType(codepoint, xjs.NumericType.NATURAL);
		return [...utf8.encode(String.fromCodePoint(codepoint))].map((ch) => ch.codePointAt(0)!) as EncodedChar;
	}
	/**
	 * Compute the token worth of a `TokenString` token or any segment of such token.
	 * @param   text - the string to compute
	 * @param   allow_comments - Should in-string comments be allowed?
	 * @param   allow_separators - Should numeric separators be allowed?
	 * @returns        the string value of the argument, a sequence of code units
	 */
	private static tokenWorth(
		text: string,
		allow_comments:   SolidConfig['languageFeatures']['comments']          = CONFIG_DEFAULT.languageFeatures.comments,
		allow_separators: SolidConfig['languageFeatures']['numericSeparators'] = CONFIG_DEFAULT.languageFeatures.numericSeparators,
	): CodeUnit[] {
		if (text.length === 0) return []
		if (TokenString.ESCAPER === text[0]) {
			/* possible escape or line continuation */
			if (TokenString.ESCAPES.includes(text[1])) {
				/* an escaped character literal */
				return [
					...new Map<string, Readonly<EncodedChar>>([
						[TokenString      .DELIM,       TokenString.utf8Encode(TokenString      .DELIM       .codePointAt(0)!)],
						[TokenString      .ESCAPER,     TokenString.utf8Encode(TokenString      .ESCAPER     .codePointAt(0)!)],
						[TokenCommentLine .DELIM_START, TokenString.utf8Encode(TokenCommentLine .DELIM_START .codePointAt(0)!)],
						['s',                           TokenString.utf8Encode(0x20)],
						['t',                           TokenString.utf8Encode(0x09)],
						['n',                           TokenString.utf8Encode(0x0a)],
						['r',                           TokenString.utf8Encode(0x0d)],
					]).get(text[1]) !,
					...TokenString.tokenWorth(text.slice(2), allow_comments, allow_separators),
				]

			} else if ('u{' === `${text[1]}${text[2]}`) {
				/* an escape sequence */
				const sequence: RegExpMatchArray = text.match(/\\u{[0-9a-f_]*}/) !
				return [
					...TokenString.utf8Encode(TokenNumber.tokenWorthInt(sequence[0].slice(3, -1) || '0', 16n, allow_separators)),
					...TokenString.tokenWorth(text.slice(sequence[0].length), allow_comments, allow_separators),
				]

			} else if ('\n' === text[1]) {
				/* a line continuation (LF) */
				return [
					...TokenString.utf8Encode(0x20),
					...TokenString.tokenWorth(text.slice(2), allow_comments, allow_separators),
				];

			} else {
				/* a backslash escapes the following character */
				return [
					...TokenString.utf8Encode(text.codePointAt(1)!),
					...TokenString.tokenWorth([...text].slice(2).join('')/* UTF-16 */, allow_comments, allow_separators),
				]
			}

		} else if (allow_comments && TokenCommentMulti.DELIM_START === `${ text[0] }${ text[1] }`) {
			/* an in-string multiline comment */
			const match: string = text.match(/\%\%(?:\%?[^\'\%])*(?:\%\%)?/)![0];
			return TokenString.tokenWorth(text.slice(match.length), allow_comments, allow_separators);

		} else if (allow_comments && TokenCommentLine.DELIM_START === text[0]) {
			/* an in-string line comment */
			const match: string = text.match(/\%[^\'\n]*\n?/)![0];
			const rest: CodeUnit[] = TokenString.tokenWorth(text.slice(match.length), allow_comments, allow_separators);
			return (match[match.length - 1] === '\n') // COMBAK `match.lastItem`
				? [...TokenString.utf8Encode(0x0a), ...rest]
				: rest
			;

		} else {
			return [
				...TokenString.utf8Encode(text.codePointAt(0)!),
				...TokenString.tokenWorth([...text].slice(1).join('')/* UTF-16 */, allow_comments, allow_separators),
			];
		};
	}
	constructor (
		private readonly allow_comments:   SolidConfig['languageFeatures']['comments']          = CONFIG_DEFAULT.languageFeatures.comments,
		private readonly allow_separators: SolidConfig['languageFeatures']['numericSeparators'] = CONFIG_DEFAULT.languageFeatures.numericSeparators,
		...chars: NonemptyArray<Char>
	) {
		super('STRING', ...chars);
	}
	cook(): CodeUnit[] {
		return TokenString.tokenWorth(
			this.source.slice(TokenString.DELIM.length, -TokenString.DELIM.length),
			this.allow_comments,
			this.allow_separators,
		);
	}
}

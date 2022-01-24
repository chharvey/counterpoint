import {
	NonemptyArray,
	Keyword,
	Char,
} from './package.js';
import {TokenSolid} from './TokenSolid.js';



export class TokenKeyword extends TokenSolid {
	/** The minimum allowed cooked value of a keyword token. */
	static readonly MINIMUM_VALUE = 0x80n;

	static readonly CHAR: RegExp = /^[a-z]$/
	static readonly KEYWORDS: readonly Keyword[] = [...new Set<Keyword>( // remove duplicates
		Object.values(Keyword),
	)]
	// declare readonly source: Keyword; // NB: https://github.com/microsoft/TypeScript/issues/40220
	constructor (...chars: NonemptyArray<Char>) {
		super('KEYWORD', ...chars);
	}

	/** @deprecated This method is going away soon. Use {@link Validator.cookTokenKeyword} instead. */
	override cook(): bigint {
		return BigInt(TokenKeyword.KEYWORDS.indexOf(this.source as Keyword)) + TokenKeyword.MINIMUM_VALUE
	}
}

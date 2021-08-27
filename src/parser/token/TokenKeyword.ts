import type {
	Char,
	Lexer,
} from '@chharvey/parser';
import {Keyword} from './package.js';
import {TokenSolid} from './TokenSolid.js';



export class TokenKeyword extends TokenSolid {
	private static readonly MINIMUM_VALUE: 0x80n = 0x80n
	static readonly CHAR: RegExp = /^[a-z]$/
	static readonly KEYWORDS: readonly Keyword[] = [...new Set<Keyword>( // remove duplicates
		Object.values(Keyword),
	)]
	// declare readonly source: Keyword; // NB: https://github.com/microsoft/TypeScript/issues/40220
	constructor (lexer: Lexer, start_char: Char, ...more_chars: Char[]) {
		super('KEYWORD', lexer, start_char, ...more_chars)
	}
	cook(): bigint {
		return BigInt(TokenKeyword.KEYWORDS.indexOf(this.source as Keyword)) + TokenKeyword.MINIMUM_VALUE
	}
}

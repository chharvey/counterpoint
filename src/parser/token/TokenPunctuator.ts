import type {Lexer} from '@chharvey/parser';
import {
	Dev,
	Punctuator,
} from './package.js';
import {TokenSolid} from './TokenSolid.js';



export class TokenPunctuator extends TokenSolid {
	static readonly PUNCTUATORS: readonly Punctuator[] = [...new Set( // remove duplicates
		Object.values(Punctuator).filter((p) => Dev.supports('literalCollection') ? true : ![
			Punctuator.BRAK_OPN,
			Punctuator.BRAK_CLS,
			Punctuator.COMMA,
			Punctuator.MAPTO,
		].includes(p))
	)]
	// declare readonly source: Punctuator; // NB: https://github.com/microsoft/TypeScript/issues/40220
	constructor (lexer: Lexer, count: 1n | 2n | 3n | 4n = 1n) {
		super('PUNCTUATOR', lexer, ...lexer.advance())
		if (count >= 4n) {
			this.advance(3n)
		} else if (count >= 3n) {
			this.advance(2n)
		} else if (count >= 2n) {
			this.advance()
		}
	}
	cook(): bigint {
		return BigInt(TokenPunctuator.PUNCTUATORS.indexOf(this.source as Punctuator))
	}
}

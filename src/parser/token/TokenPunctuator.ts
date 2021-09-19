import type {
	NonemptyArray,
	Char,
} from '@chharvey/parser';
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
	constructor (...chars: NonemptyArray<Char>) {
		super('PUNCTUATOR', ...chars);
	}
	cook(): bigint {
		return BigInt(TokenPunctuator.PUNCTUATORS.indexOf(this.source as Punctuator))
	}
}

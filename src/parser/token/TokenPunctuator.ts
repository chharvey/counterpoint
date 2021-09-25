import type {
	NonemptyArray,
	Char,
} from '@chharvey/parser';
import {
	Punctuator,
} from './package.js';
import {TokenSolid} from './TokenSolid.js';



export class TokenPunctuator extends TokenSolid {
	static readonly PUNCTUATORS: readonly Punctuator[] = [...new Set( // remove duplicates
		Object.values(Punctuator),
	)]
	// declare readonly source: Punctuator; // NB: https://github.com/microsoft/TypeScript/issues/40220
	constructor (...chars: NonemptyArray<Char>) {
		super('PUNCTUATOR', ...chars);
	}
	cook(): bigint {
		return BigInt(TokenPunctuator.PUNCTUATORS.indexOf(this.source as Punctuator))
	}
}

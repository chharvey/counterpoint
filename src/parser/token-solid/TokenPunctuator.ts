import {
	NonemptyArray,
	Punctuator,
	PUNCTUATORS,
	Char,
} from './package.js';
import {TokenSolid} from './TokenSolid.js';



export class TokenPunctuator extends TokenSolid {
	/** The minimum allowed cooked value of a punctuator token. */
	private static readonly MINIMUM_VALUE = 0n;

	// declare readonly source: Punctuator; // NB: https://github.com/microsoft/TypeScript/issues/40220
	constructor (...chars: NonemptyArray<Char>) {
		super('PUNCTUATOR', ...chars);
	}

	/** @deprecated This method is going away soon. Use {@link Validator.cookTokenPunctuator} instead. */
	override cook(): bigint {
		return BigInt(PUNCTUATORS.indexOf(this.source as Punctuator)) + TokenPunctuator.MINIMUM_VALUE;
	}
}

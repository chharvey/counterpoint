import type {
	NonemptyArray,
	Char,
} from '@chharvey/parser';
import {TokenSolid} from './TokenSolid.js';



export abstract class TokenIdentifier extends TokenSolid {
	private static readonly MINIMUM_VALUE: 0x100n = 0x100n
	/**
	 * The cooked value of this Token.
	 * If the token is a keyword, the cooked value is its contents.
	 * If the token is an identifier, the cooked value is set by a {@link Screener},
	 * which indexes unique identifier tokens.
	 */
	private _cooked: bigint|null;
	constructor (...chars: NonemptyArray<Char>) {
		super('IDENTIFIER', ...chars);
		this._cooked = null
	}
	/**
	 * Set the numeric integral value of this Token.
	 * The value must be 128 or higher.
	 * This operation can only be done once.
	 * @param value - the value to set, unique among all identifiers in a program
	 */
	/** @final */ setValue(value: bigint): void {
		if (this._cooked === null) {
			this._cooked = value + TokenIdentifier.MINIMUM_VALUE
		}
	}
	/** @final */ cook(): bigint|null {
		return this._cooked
	}
}

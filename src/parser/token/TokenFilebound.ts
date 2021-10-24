import type {
	Char,
} from '@chharvey/parser';
import {
	NonemptyArray,
	Filebound,
} from './package.js';
import {Token} from './Token.js';



/** @final */
export class TokenFilebound extends Token {
	static readonly CHARS: readonly Filebound[] = [Filebound.SOT, Filebound.EOT];
	// declare readonly source: Filebound; // NB: https://github.com/microsoft/TypeScript/issues/40220


	constructor (...chars: NonemptyArray<Char>) {
		super('FILEBOUND', ...chars);
	}
}

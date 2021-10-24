import type {
	Char,
} from '@chharvey/parser';
import type {NonemptyArray} from './package.js';
import {Token} from './Token.js';



/** @final */
export class TokenWhitespace extends Token {
	static readonly CHARS: readonly string[] = [' ', '\t', '\n'];


	constructor (...chars: NonemptyArray<Char>) {
		super('WHITESPACE', ...chars);
	}
}

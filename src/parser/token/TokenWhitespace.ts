import {
	NonemptyArray,
	Char,
	Token,
} from './package.js';



/** @final */
export class TokenWhitespace extends Token {
	static readonly CHARS: readonly string[] = [' ', '\t', '\n'];


	constructor (...chars: NonemptyArray<Char>) {
		super('WHITESPACE', ...chars);
	}
}

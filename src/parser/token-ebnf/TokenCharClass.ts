import {
	NonemptyArray,
	Char,
	Token,
} from './package.js';



export class TokenCharClass extends Token {
	static readonly DELIM_START: '[' = '[';
	static readonly DELIM_END:   ']' = ']';
	constructor (...chars: NonemptyArray<Char>) {
		super('CHARCLASS', ...chars);
	}
}

import {
	NonemptyArray,
	Char,
	Token,
} from './package.js';



export class TokenIden extends Token {
	static readonly START: RegExp = /^[A-Z]$/;
	static readonly REST:  RegExp = /^[A-Za-z0-9_]+$/;
	constructor (...chars: NonemptyArray<Char>) {
		super('IDENTIFIER', ...chars);
	}
}

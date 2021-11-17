import {
	NonemptyArray,
	Char,
	Token,
} from './package.js';



export class TokenCharCode extends Token {
	static readonly START: '#x' = '#x';
	static readonly REST:  RegExp = /^[0-9a-f]+$/;
	constructor (...chars: NonemptyArray<Char>) {
		super('CHARCODE', ...chars);
	}
}

import {
	NonemptyArray,
	Char,
	Token,
} from './package.js';



export class TokenStr extends Token {
	static readonly DELIM: '"' = '"';
	constructor (...chars: NonemptyArray<Char>) {
		super('STRING', ...chars);
	}
}

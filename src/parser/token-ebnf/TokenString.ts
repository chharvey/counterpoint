import {
	NonemptyArray,
	Char,
	Token,
} from './package.js';



export class TokenString extends Token {
	static readonly DELIM: '"' = '"';
	constructor (...chars: NonemptyArray<Char>) {
		super('STRING', ...chars);
	}
}

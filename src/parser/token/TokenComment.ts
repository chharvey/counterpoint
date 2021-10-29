import {
	NonemptyArray,
	Char,
	Token,
} from './package.js';



export class TokenComment extends Token {
	constructor (...chars: NonemptyArray<Char>) {
		super('COMMENT', ...chars);
	}
}

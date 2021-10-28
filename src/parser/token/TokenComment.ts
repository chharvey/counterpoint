import type {
	NonemptyArray,
	Char,
} from './package.js';
import {Token} from './Token.js';



export class TokenComment extends Token {
	constructor (...chars: NonemptyArray<Char>) {
		super('COMMENT', ...chars);
	}
}

import type {
	Char,
} from '@chharvey/parser';
import type {NonemptyArray} from './package.js';
import {Token} from './Token.js';



export class TokenComment extends Token {
	constructor (...chars: NonemptyArray<Char>) {
		super('COMMENT', ...chars);
	}
}

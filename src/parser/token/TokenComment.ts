import {
	Char,
	Token,
} from '@chharvey/parser';
import type {NonemptyArray} from './package.js';



export class TokenComment extends Token {
	constructor (...chars: NonemptyArray<Char>) {
		super('COMMENT', ...chars);
	}
}

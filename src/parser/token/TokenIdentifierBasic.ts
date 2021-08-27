import type {
	Char,
	Lexer,
} from '@chharvey/parser';
import {TokenIdentifier} from './TokenIdentifier.js';



export class TokenIdentifierBasic extends TokenIdentifier {
	static readonly CHAR_START: RegExp = /^[A-Za-z_]$/
	static readonly CHAR_REST : RegExp = /^[A-Za-z0-9_]$/
	constructor (lexer: Lexer, start_char?: Char, ...more_chars: Char[]) {
		if (start_char) {
			super(lexer, start_char, ...more_chars)
		} else {
			super(lexer, ...lexer.advance())
			while (!this.lexer.isDone && TokenIdentifierBasic.CHAR_REST.test(this.lexer.c0.source)) {
				this.advance()
			}
		}
	}
}

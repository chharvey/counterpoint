import type {
	NonemptyArray,
} from './package.js';
import {Char} from './Char.js';
import type {Token} from './Token.js';
import * as TOKEN from './token-ebnf/index.js';
import {Lexer} from './Lexer.js';



export class LexerEbnf extends Lexer {
	protected override generate_do(): Token | null {
		if (Char.inc(TOKEN.TokenPunctuator.PUNCTUATORS_4, this.c0, this.c1, this.c2, this.c3)) {
			return new TOKEN.TokenPunctuator(...this.advance(4n));

		} else if (Char.inc(TOKEN.TokenPunctuator.PUNCTUATORS_3, this.c0, this.c1, this.c2)) {
			return new TOKEN.TokenPunctuator(...this.advance(3n));

		} else if (Char.inc(TOKEN.TokenPunctuator.PUNCTUATORS_2, this.c0, this.c1)) {
			return new TOKEN.TokenPunctuator(...this.advance(2n));

		} else if (Char.inc(TOKEN.TokenPunctuator.PUNCTUATORS_1, this.c0)) {
			if (Char.eq(TOKEN.TokenCharCode.START, this.c0, this.c1)) {
				/* we found a char code */
				const buffer: NonemptyArray<Char> = [...this.advance(2n)];
				while (!this.isDone && TOKEN.TokenCharCode.REST.test(this.c0.source)) {
					buffer.push(...this.advance());
				};
				return new TOKEN.TokenCharCode(...buffer);

			} else {
				/* we found a Kleene hash or another punctuator */
				return new TOKEN.TokenPunctuator(...this.advance());
			}

		} else if (TOKEN.TokenIdentifier.START.test(this.c0.source)) {
			const buffer: NonemptyArray<Char> = [...this.advance()];
			while (!this.isDone && TOKEN.TokenIdentifier.REST.test(this.c0.source)) {
				buffer.push(...this.advance());
			}
			return new TOKEN.TokenIdentifier(...buffer);

		} else if (Char.eq(TOKEN.TokenString.DELIM, this.c0)) {
			return new TOKEN.TokenString(...this.lexQuoted(TOKEN.TokenString.DELIM));

		} else if (Char.eq(TOKEN.TokenCharClass.DELIM_START, this.c0)) {
			return new TOKEN.TokenCharClass(...this.lexQuoted(
				TOKEN.TokenCharClass.DELIM_START,
				TOKEN.TokenCharClass.DELIM_END,
			));

		} else if (Char.eq(TOKEN.TokenCommentEbnf.DELIM_START, this.c0, this.c1)) {
			return new TOKEN.TokenCommentEbnf(...this.lexQuoted(
				TOKEN.TokenCommentEbnf.DELIM_START,
				TOKEN.TokenCommentEbnf.DELIM_END,
			));

		} else {
			return null;
		}
	}
}


export const LEXER: LexerEbnf = new LexerEbnf();

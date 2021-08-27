import {Char} from '@chharvey/parser';
import {TokenNumber} from '../Token.js'; // TEMP
import {
	LexError04,
	LexerSolid,
} from './package.js';
import {TokenSolid} from './TokenSolid.js';



export abstract class NumberOrStringToken extends TokenSolid {
	constructor (tagname: string,
		protected override readonly lexer: LexerSolid,
		...chars: [Char, ...Char[]]
	) {
		super(tagname, lexer, ...chars);
	}
	/**
	 * Lex a numeric digit sequence, advancing this token as necessary.
	 * @param digits the digit sequence to lex
	 * @return       a cargo of source text for any error-reporting
	 * @throws {LexError04} if an unexpected numeric separator was found
	 * @final
	 */
	protected lexDigitSequence(digits: readonly string[]): string {
		let cargo: string = '';
		const allowedchars: string[] = [
			...digits,
			...(this.lexer.config.languageFeatures.numericSeparators ? [TokenNumber.SEPARATOR] : [])
		];
		while (!this.lexer.isDone && Char.inc(allowedchars, this.lexer.c0)) {
			if (Char.inc(digits, this.lexer.c0)) {
				cargo += this.lexer.c0.source;
				this.advance();
			} else if (this.lexer.config.languageFeatures.numericSeparators && Char.eq(TokenNumber.SEPARATOR, this.lexer.c0)) {
				if (Char.inc(digits, this.lexer.c1)) {
					cargo += `${ this.lexer.c0.source }${ this.lexer.c1!.source }`;
					this.advance(2n);
				} else {
					throw new LexError04(Char.eq(TokenNumber.SEPARATOR, this.lexer.c1) ? this.lexer.c1! : this.lexer.c0);
				};
			} else {
				break;
			};
		};
		return cargo;
	}
}

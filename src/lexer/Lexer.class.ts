import {
	Char,
	Token,
	Lexer,
} from '@chharvey/parser';

import SolidConfig, {CONFIG_DEFAULT} from '../SolidConfig';
import Dev from '../class/Dev.class'
import {
	Punctuator,
	TokenPunctuator,
	TokenKeyword,
	TokenIdentifier,
	TokenIdentifierBasic,
	TokenIdentifierUnicode,
	TokenNumber,
	TokenString,
	TokenTemplate,
	TokenCommentLine,
	TokenCommentMulti,
} from './Token.class'

import {
	LexError03,
} from '../error/LexError.class'



export class LexerSolid extends Lexer {
	private static readonly PUNCTUATORS_3: readonly Punctuator[] = TokenPunctuator.PUNCTUATORS.filter((p) => p.length === 3)
	private static readonly PUNCTUATORS_2: readonly Punctuator[] = TokenPunctuator.PUNCTUATORS.filter((p) => p.length === 2)
	private static readonly PUNCTUATORS_1: readonly Punctuator[] = TokenPunctuator.PUNCTUATORS.filter((p) => p.length === 1)
	private static readonly BASES_KEYS: readonly string[] = [...TokenNumber.BASES.keys()]
	private static readonly DIGITS_DEFAULT: readonly string[] = TokenNumber.DIGITS.get(TokenNumber.RADIX_DEFAULT)!


	/** A set of all unique identifiers in the program, for optimization purposes. */
	private _ids: Set<string> = new Set()

	/**
	 * Construct a new LexerSolid object.
	 * @param source - the source text
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		source: string,
		readonly config: SolidConfig = CONFIG_DEFAULT,
	) {
		super(source)
	}

	protected generate_do(): Token | null {
			let token: Token;
			if (Char.inc(LexerSolid.PUNCTUATORS_3, this.c0, this.c1, this.c2)) {
				token = new TokenPunctuator(this, 3n)
			} else if (Char.inc(LexerSolid.PUNCTUATORS_2, this.c0, this.c1)) {
				token = new TokenPunctuator(this, 2n)
			} else if (Char.inc(LexerSolid.PUNCTUATORS_1, this.c0)) {
				/* we found a punctuator or a number literal prefixed with a unary operator */
				if (Char.inc(TokenNumber.UNARY, this.c0)) {
					if (Char.inc(LexerSolid.DIGITS_DEFAULT, this.c1)) {
						/* a number literal with a unary operator and without an explicit radix */
						token = new TokenNumber(this, true)
					} else if (this.config.languageFeatures.integerRadices && Char.eq(TokenNumber.ESCAPER, this.c1)) {
						if (Char.inc(LexerSolid.BASES_KEYS, this.c2)) {
							/* a number literal with a unary operator and with an explicit radix */
							token = new TokenNumber(this, true, true)
						} else {
							throw new LexError03(`${ this.c0.source }${ this.c1 && this.c1.source || '' }${ this.c2 && this.c2.source || '' }`, this.c0.line_index, this.c0.col_index)
						}
					} else {
						/* a punctuator "+" or "-" */
						token = new TokenPunctuator(this)
					}
				} else {
					/* a different punctuator */
					token = new TokenPunctuator(this)
				}

			} else if (TokenKeyword.CHAR.test(this.c0.source)) {
				/* we found a keyword or a basic identifier */
				const buffer: Char[] = [this.c0]
				this.advance()
				while (!this.isDone && (Dev.supports('variables') ? TokenIdentifierBasic.CHAR_REST : TokenKeyword.CHAR).test(this.c0.source)) {
					buffer.push(this.c0)
					this.advance()
				}
				const bufferstring: string = buffer.map((char) => char.source).join('')
				if ((TokenKeyword.KEYWORDS as string[]).includes(bufferstring)) {
					token = new TokenKeyword        (this, buffer[0], ...buffer.slice(1))
				} else if (Dev.supports('variables')) {
					token = new TokenIdentifierBasic(this, buffer[0], ...buffer.slice(1))
					this.setIdentifierValue(token as TokenIdentifierBasic);
				} else {
					throw new Error(`Identifier \`${ bufferstring }\` not yet allowed.`)
				}
			} else if (Dev.supports('variables') && TokenIdentifierBasic.CHAR_START.test(this.c0.source)) {
				/* we found a basic identifier */
				token = new TokenIdentifierBasic(this)
				this.setIdentifierValue(token as TokenIdentifierBasic);
			} else if (Dev.supports('variables') && Char.eq(TokenIdentifierUnicode.DELIM, this.c0)) {
				/* we found a unicode identifier */
				token = new TokenIdentifierUnicode(this)
				this.setIdentifierValue(token as TokenIdentifierUnicode);

			} else if (Char.inc(LexerSolid.DIGITS_DEFAULT, this.c0)) {
				/* a number literal without a unary operator and without an explicit radix */
				token = new TokenNumber(this, false)
			} else if (this.config.languageFeatures.integerRadices && Char.eq(TokenNumber.ESCAPER, this.c0)) {
				if (Char.inc(LexerSolid.BASES_KEYS, this.c1)) {
					/* a number literal without a unary operator and with an explicit radix */
					token = new TokenNumber(this, false, true)
				} else {
					throw new LexError03(`${this.c0.source}${this.c1 && this.c1.source || ''}`, this.c0.line_index, this.c0.col_index)
				}

			} else if (Dev.supports('literalTemplate') && Char.eq(TokenTemplate.DELIM, this.c0, this.c1, this.c2)) {
				/* we found a template literal full or head */
				token = new TokenTemplate(this, TokenTemplate.DELIM)
			} else if (Dev.supports('literalTemplate') && Char.eq(TokenTemplate.DELIM_INTERP_END, this.c0, this.c1)) {
				/* we found a template literal middle or tail */
				token = new TokenTemplate(this, TokenTemplate.DELIM_INTERP_END)
			} else if (Dev.supports('literalString') && Char.eq(TokenString.DELIM, this.c0)) {
				/* we found a string literal */
				token = new TokenString(this)

			} else if (this.config.languageFeatures.comments && Char.eq(TokenCommentMulti.DELIM_START, this.c0, this.c1)) {
				/* we found a multiline comment */
				token = new TokenCommentMulti(this)
			} else if (this.config.languageFeatures.comments && Char.eq(TokenCommentLine.DELIM_START, this.c0)) {
				/* we found a single-line comment */
				token = new TokenCommentLine(this)

			} else {
				return null
			}
			return token
	}

	/**
	 * Sets a unique integer value to an Identifier token to optimize performance.
	 * @param id_token the Identifier token
	 */
	private setIdentifierValue(id_token: TokenIdentifier): void {
		this._ids.add(id_token.source);
		return id_token.setValue(BigInt([...this._ids].indexOf(id_token.source)));
	}
}

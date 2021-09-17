import {
	NonemptyArray,
	Filebound,
	Char,
	Token,
	Lexer,
	LexError02,
} from '@chharvey/parser';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
} from '../core/index.js';
import {
	LexError03,
	LexError04,
	LexError05,
} from '../error/index.js';
import {
	Punctuator,
} from './Punctuator.js';
import {
	RadixType,
	TemplatePosition,
} from './Token.js';
import * as TOKEN from './Token.js';



export class LexerSolid extends Lexer {
	private static readonly PUNCTUATORS_3: readonly Punctuator[] = TOKEN.TokenPunctuator.PUNCTUATORS.filter((p) => p.length === 3)
	private static readonly PUNCTUATORS_2: readonly Punctuator[] = TOKEN.TokenPunctuator.PUNCTUATORS.filter((p) => p.length === 2)
	private static readonly PUNCTUATORS_1: readonly Punctuator[] = TOKEN.TokenPunctuator.PUNCTUATORS.filter((p) => p.length === 1)
	private static readonly BASES_KEYS: readonly string[] = [...TOKEN.TokenNumber.BASES.keys()]
	private static readonly DIGITS_DEFAULT: readonly string[] = TOKEN.TokenNumber.DIGITS.get(TOKEN.TokenNumber.RADIX_DEFAULT)!


	/** A set of all unique identifiers in the program, for optimization purposes. */
	private _ids: Set<string> = new Set()

	/**
	 * Construct a new LexerSolid object.
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		readonly config: SolidConfig = CONFIG_DEFAULT,
	) {
		super();
	}

	protected override generate_do(): Token | null {
			let token: Token;
			if (Char.inc(LexerSolid.PUNCTUATORS_3, this.c0, this.c1, this.c2)) {
				token = new TOKEN.TokenPunctuator(...this.advance(3n));
			} else if (Char.inc(LexerSolid.PUNCTUATORS_2, this.c0, this.c1)) {
				token = new TOKEN.TokenPunctuator(...this.advance(2n));
			} else if (Char.inc(LexerSolid.PUNCTUATORS_1, this.c0) && (!Dev.supports('literalTemplate-lex') || !Char.eq(Punctuator.BRAC_CLS, this.c0))) {
				/* we found a punctuator or a number literal prefixed with a unary operator; the punctuator is not a closing brace `}` */
				if (Char.inc(TOKEN.TokenNumber.UNARY, this.c0)) {
					if (Char.inc(LexerSolid.DIGITS_DEFAULT, this.c1)) {
						/* a number literal with a unary operator and without an explicit radix */
						token = this.newTokenNumber(true, false);
					} else if (this.config.languageFeatures.integerRadices && Char.eq(TOKEN.TokenNumber.ESCAPER, this.c1)) {
						if (Char.inc(LexerSolid.BASES_KEYS, this.c2)) {
							/* a number literal with a unary operator and with an explicit radix */
							token = this.newTokenNumber(true, true);
						} else {
							throw new LexError03(`${ this.c0.source }${ this.c1 && this.c1.source || '' }${ this.c2 && this.c2.source || '' }`, this.c0.line_index, this.c0.col_index)
						}
					} else {
						/* a punctuator "+" or "-" */
						token = new TOKEN.TokenPunctuator(...this.advance());
					}
				} else {
					/* a different punctuator */
					token = new TOKEN.TokenPunctuator(...this.advance());
				}

			} else if (TOKEN.TokenKeyword.CHAR.test(this.c0.source)) {
				/* we found a keyword or a basic identifier */
				const buffer: NonemptyArray<Char> = [this.c0];
				this.advance()
				while (!this.isDone && TOKEN.TokenIdentifierBasic.CHAR_REST.test(this.c0.source)) {
					buffer.push(this.c0)
					this.advance()
				}
				const bufferstring: string = buffer.map((char) => char.source).join('')
				if ((TOKEN.TokenKeyword.KEYWORDS as string[]).includes(bufferstring)) {
					token = new TOKEN.TokenKeyword(...buffer);
				} else {
					token = new TOKEN.TokenIdentifierBasic(...buffer);
					this.setIdentifierValue(token as TOKEN.TokenIdentifierBasic);
				}
			} else if (TOKEN.TokenIdentifierBasic.CHAR_START.test(this.c0.source)) {
				/* we found a basic identifier */
				const buffer: NonemptyArray<Char> = [this.c0];
				this.advance();
				while (!this.isDone && TOKEN.TokenIdentifierBasic.CHAR_REST.test(this.c0.source)) {
					buffer.push(this.c0);
					this.advance();
				}
				token = new TOKEN.TokenIdentifierBasic(...buffer);
				this.setIdentifierValue(token as TOKEN.TokenIdentifierBasic);
			} else if (Char.eq(TOKEN.TokenIdentifierUnicode.DELIM, this.c0)) {
				/* we found a unicode identifier */
				token = new TOKEN.TokenIdentifierUnicode(...this.lexQuoted(TOKEN.TokenIdentifierUnicode.DELIM));
				this.setIdentifierValue(token as TOKEN.TokenIdentifierUnicode);

			} else if (Char.inc(LexerSolid.DIGITS_DEFAULT, this.c0)) {
				/* a number literal without a unary operator and without an explicit radix */
				token = this.newTokenNumber(false, false);
			} else if (this.config.languageFeatures.integerRadices && Char.eq(TOKEN.TokenNumber.ESCAPER, this.c0)) {
				if (Char.inc(LexerSolid.BASES_KEYS, this.c1)) {
					/* a number literal without a unary operator and with an explicit radix */
					token = this.newTokenNumber(false, true);
				} else {
					throw new LexError03(`${this.c0.source}${this.c1 && this.c1.source || ''}`, this.c0.line_index, this.c0.col_index)
				}

			} else if (Dev.supports('literalTemplate-lex') && Char.eq(TOKEN.TokenTemplate.DELIM, this.c0, this.c1, this.c2)) {
				/* we found a template literal full or head */
				token = this.newTokenTemplate(TOKEN.TokenTemplate.DELIM);
			} else if (Dev.supports('literalTemplate-lex') && Char.eq(TOKEN.TokenTemplate.DELIM_INTERP_END, this.c0, this.c1)) {
				/* we found a template literal middle or tail */
				token = this.newTokenTemplate(TOKEN.TokenTemplate.DELIM_INTERP_END);
			} else if (Dev.supports('literalString-lex') && Char.eq(TOKEN.TokenString.DELIM, this.c0)) {
				/* we found a string literal */
				token = new TOKEN.TokenString(
					this.config.languageFeatures.comments,
					this.config.languageFeatures.numericSeparators,
					...this.lexTokenString(),
				);
			} else if (Dev.supports('literalString-lex') && Char.eq(Punctuator.BRAC_CLS, this.c0)) {
				/* we found a closing brace `}` */
				token = new TOKEN.TokenPunctuator(...this.advance());

			} else if (this.config.languageFeatures.comments && Char.eq(TOKEN.TokenCommentMulti.DELIM_START, this.c0, this.c1)) {
				/* we found a multiline comment */
				token = new TOKEN.TokenCommentMulti(...this.lexQuoted(
					TOKEN.TokenCommentMulti.DELIM_START,
					TOKEN.TokenCommentMulti.DELIM_END,
				));
			} else if (this.config.languageFeatures.comments && Char.eq(TOKEN.TokenCommentLine.DELIM_START, this.c0)) {
				/* we found a single-line comment */
				token = new TOKEN.TokenCommentLine(...this.lexQuoted(
					TOKEN.TokenCommentLine.DELIM_START,
					TOKEN.TokenCommentLine.DELIM_END,
				));

			} else {
				return null
			}
			return token
	}

	/**
	 * Sets a unique integer value to an Identifier token to optimize performance.
	 * @param id_token the Identifier token
	 */
	private setIdentifierValue(id_token: TOKEN.TokenIdentifier): void {
		this._ids.add(id_token.source);
		return id_token.setValue(BigInt([...this._ids].indexOf(id_token.source)));
	}

	/**
	 * Lex a numeric digit sequence, advancing this token as necessary.
	 * @param  allowed_digits the digit sequence to lex
	 * @return                a cargo of source text for any error-reporting
	 * @throws {LexError04}   if an unexpected numeric separator was found
	 * @final
	 */
	private lexDigitSequence(allowed_digits: readonly string[]): Char[] {
		const buffer: Char[] = [];
		const allowedchars: string[] = [
			...allowed_digits,
			...(this.config.languageFeatures.numericSeparators ? [TOKEN.TokenNumber.SEPARATOR] : []),
		];
		while (!this.isDone && Char.inc(allowedchars, this.c0)) {
			if (Char.inc(allowed_digits, this.c0)) {
				buffer.push(...this.advance());
			} else if (this.config.languageFeatures.numericSeparators && Char.eq(TOKEN.TokenNumber.SEPARATOR, this.c0)) {
				if (Char.inc(allowed_digits, this.c1)) {
					buffer.push(...this.advance(2n));
				} else {
					throw new LexError04(Char.eq(TOKEN.TokenNumber.SEPARATOR, this.c1) ? this.c1! : this.c0);
				};
			} else {
				break;
			};
		};
		return buffer;
	}

	/**
	 * Lex a string token.
	 * @return the characters from which to construct a new TokenString
	 */
	private lexTokenString(): NonemptyArray<Char> {
		const buffer: NonemptyArray<Char> = [...this.advance(BigInt(TOKEN.TokenString.DELIM.length))]; // starting delim
		while (!this.isDone && !Char.eq(TOKEN.TokenString.DELIM, this.c0)) {
			if (Char.eq(Filebound.EOT, this.c0)) {
				throw new LexError02(new Token('STRING', ...buffer));
			}
			if (Char.eq(TOKEN.TokenString.ESCAPER, this.c0)) {
				/* possible escape or line continuation */
				if (Char.inc(TOKEN.TokenString.ESCAPES, this.c1)) {
					/* an escaped character literal */
					buffer.push(...this.advance(2n));

				} else if (Char.eq('u{', this.c1, this.c2)) {
					/* an escape sequence */
					const allowed_digits: readonly string[] = TOKEN.TokenNumber.DIGITS.get(16n)!;
					let next: Char[] = this.advance(3n);
					buffer.push(...next);
					const err_cargo: NonemptyArray<Char> = next.slice() as NonemptyArray<Char>;
					if (Char.inc(allowed_digits, this.c0)) {
						next = this.advance();
						buffer   .push(...next);
						err_cargo.push(...next);
						next = this.lexDigitSequence(allowed_digits);
						buffer   .push(...next);
						err_cargo.push(...next);
					}
					// add ending escape delim
					if (Char.eq('}', this.c0)) {
						next = this.advance();
						buffer   .push(...next);
						err_cargo.push(...next);
					} else {
						throw new LexError03(err_cargo.map((char) => char.source).join(''), this.c0.line_index, this.c0.col_index);
					}

				} else if (Char.eq('\n', this.c1)) {
					/* a line continuation (LF) */
					buffer.push(...this.advance(2n));

				} else {
					/* a backslash escapes the following character */
					buffer.push(...this.advance(2n));
				}

			} else if (this.config.languageFeatures.comments && Char.eq(TOKEN.TokenCommentMulti.DELIM_START, this.c0, this.c1)) {
				/* an in-string multiline comment */
				buffer.push(...this.advance(BigInt(TOKEN.TokenCommentMulti.DELIM_START.length)));
				while (
					   !this.isDone
					&& !Char.eq(TOKEN.TokenString.DELIM, this.c0)
					&& !Char.eq(TOKEN.TokenCommentMulti.DELIM_END, this.c0, this.c1)
				) {
					if (Char.eq(Filebound.EOT, this.c0)) {
						throw new LexError02(new Token('STRING', ...buffer));
					};
					buffer.push(...this.advance());
				};
				if (Char.eq(TOKEN.TokenString.DELIM, this.c0)) {
					// do nothing, as the ending string delim is not included in the in-string comment
				} else if (Char.eq(TOKEN.TokenCommentMulti.DELIM_END, this.c0, this.c1)) {
					// add ending comment delim to in-string comment
					buffer.push(...this.advance(BigInt(TOKEN.TokenCommentMulti.DELIM_END.length)));
				};

			} else if (this.config.languageFeatures.comments && Char.eq(TOKEN.TokenCommentLine.DELIM_START, this.c0)) {
				/* an in-string line comment */
				buffer.push(...this.advance(BigInt(TOKEN.TokenCommentLine.DELIM_START.length)));
				while (!this.isDone && !Char.inc([
					TOKEN.TokenString.DELIM,
					TOKEN.TokenCommentLine.DELIM_END,
				], this.c0)) {
					if (Char.eq(Filebound.EOT, this.c0)) {
						throw new LexError02(new Token('STRING', ...buffer));
					};
					buffer.push(...this.advance());
				};
				if (Char.eq(TOKEN.TokenString.DELIM, this.c0)) {
					// do nothing, as the ending string delim is not included in the in-string comment
				} else if (Char.eq(TOKEN.TokenCommentLine.DELIM_END, this.c0)) {
					// add ending comment delim to in-string comment
					buffer.push(...this.advance(BigInt(TOKEN.TokenCommentLine.DELIM_END.length)));
				};

			} else {
				buffer.push(...this.advance());
			}
		}
		// add ending delim to token
		buffer.push(...this.advance(BigInt(TOKEN.TokenString.DELIM.length)));
		return buffer;
	}

	/**
	 * Construct a new TokenNumber instance.
	 * @param has_unary does the token start with a unary operator?
	 * @param has_radix does the token have an explicit radix specified?
	 * @return          a new instance of TokenNumber
	 */
	private newTokenNumber(has_unary: boolean, has_radix: boolean): TOKEN.TokenNumber {
		const buffer: Char[] = [];
		if (has_unary) { // prefixed with leading unary operator "+" or "-"
			buffer.push(...this.advance());
		}
		const radix: RadixType = (has_radix)
			? TOKEN.TokenNumber.BASES.get(this.c1!.source)!
			: TOKEN.TokenNumber.RADIX_DEFAULT;
		const allowed_digits: readonly string[] = TOKEN.TokenNumber.DIGITS.get(radix)!;
		if (has_radix) { // an explicit base
			if (!Char.inc(allowed_digits, this.c2)) {
				throw new LexError03(`${ this.c0.source }${ this.c1!.source }`, this.c0.line_index, this.c0.col_index);
			}
			buffer.push(...this.advance(3n));
		} else { // implicit default base
			buffer.push(...this.advance());
		}
		buffer.push(...this.lexDigitSequence(allowed_digits));
		if (!has_radix && Char.eq(TOKEN.TokenNumber.POINT, this.c0)) { // decimal point
			buffer.push(...this.advance());
			if (Char.inc(allowed_digits, this.c0)) { // [0-9]
				buffer.push(...this.lexDigitSequence(allowed_digits));
				if (Char.eq(TOKEN.TokenNumber.EXPONENT, this.c0)) { // exponent symbol
					const exp_char: Char = this.c0;
					buffer.push(...this.advance());
					if (Char.inc(TOKEN.TokenNumber.UNARY, this.c0) && Char.inc(allowed_digits, this.c1)) { // [+\-][0-9]
						buffer.push(
							...this.advance(2n),
							...this.lexDigitSequence(allowed_digits),
						);
					} else if (Char.inc(allowed_digits, this.c0)) { // [0-9]
						buffer.push(
							...this.advance(),
							...this.lexDigitSequence(allowed_digits),
						);
					} else {
						throw new LexError05(exp_char);
					}
				}
			}
		}
		return new TOKEN.TokenNumber(
			has_unary,
			has_radix,
			radix,
			this.config.languageFeatures.numericSeparators,
			buffer[0],
			...buffer.slice(1),
		);
	}

	/**
	 * Construct a new TokenTemplate instance.
	 * @param delim_start the starting delimiter
	 * @return            a new instance of TokenTemplate
	 */
	private newTokenTemplate(
		delim_start: typeof TOKEN.TokenTemplate.DELIM | typeof TOKEN.TokenTemplate.DELIM_INTERP_END,
	): TOKEN.TokenTemplate {
		const buffer: NonemptyArray<Char> = [...this.advance(BigInt(delim_start.length))]; // starting delim
		const positions: Set<TemplatePosition> = new Set<TemplatePosition>();
		if (delim_start === TOKEN.TokenTemplate.DELIM) {
			positions.add(TemplatePosition.FULL).add(TemplatePosition.HEAD);
		} else /* (delim_start === TOKEN.TokenTemplate.DELIM_INTERP_END) */ {
			positions.add(TemplatePosition.MIDDLE).add(TemplatePosition.TAIL)
		}
		let delim_end: typeof TOKEN.TokenTemplate.DELIM | typeof TOKEN.TokenTemplate.DELIM_INTERP_START;
		while (!this.isDone) {
			if (Char.eq(Filebound.EOT, this.c0)) {
				throw new LexError02(new Token('TEMPLATE', ...buffer));
			}
			if (Char.eq(TOKEN.TokenTemplate.DELIM, this.c0, this.c1, this.c2)) {
				/* end string template full/tail */
				delim_end = TOKEN.TokenTemplate.DELIM;
				positions.delete(TOKEN.TemplatePosition.HEAD);
				positions.delete(TOKEN.TemplatePosition.MIDDLE);
				buffer.push(...this.advance(BigInt(delim_end.length))); // ending delim
				break;
			} else if (Char.eq(TOKEN.TokenTemplate.DELIM_INTERP_START, this.c0, this.c1)) {
				/* end string template head/middle */
				delim_end = TOKEN.TokenTemplate.DELIM_INTERP_START;
				positions.delete(TOKEN.TemplatePosition.FULL);
				positions.delete(TOKEN.TemplatePosition.TAIL);
				buffer.push(...this.advance(BigInt(delim_end.length))); // ending delim
				break;
			} else {
				buffer.push(...this.advance());
			}
		}
		return new TOKEN.TokenTemplate(delim_start, delim_end!, [...positions][0], ...buffer);
	}
}


export const LEXER: LexerSolid = new LexerSolid();

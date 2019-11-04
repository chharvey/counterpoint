import Serializable from '../iface/Serializable.iface'

import Scanner, {Char, STX, ETX} from './Scanner.class'


/**
 * A Token object is the kind of thing that the Lexer returns.
 * It holds:
 * - the text of the token (self.cargo)
 * - the type of token that it is
 * - the line number and column index where the token starts
 *
 * @see http://parsingintro.sourceforge.net/#contents_item_6.4
 */
export abstract class Token implements Serializable {
	/** All the characters in this Token. */
	private _cargo: string;
	/** Zero-based line number of the first character (first line is line 0). */
	readonly line_index: number;
	/** Zero-based column number of the first character (first col is col 0). */
	readonly col_index: number;

	/**
	 * Construct a new Token object.
	 *
	 * @param tagname    - the name of the type of this Token
	 * @param start_char - the starting character of this Token
	 */
	constructor(
		private readonly tagname: string,
		start_char: Char,
	) {
		this._cargo     = start_char.cargo
		this.line_index = start_char.line_index
		this.col_index  = start_char.col_index
	}

	/**
	 * Get this Token’s cargo.
	 * @returns All the characters in this Token.
	 */
	get cargo(): string {
		return this._cargo
	}

	/**
	 * Add to this Token’s cargo.
	 * @param cargo the string to append
	 */
	add(cargo: string): void {
		this._cargo += cargo
	}

	/**
	 * @implements Serializable
	 */
	serialize(): string {
		const tagname: string = this.tagname
		const attributes: string = (this.cargo !== STX && this.cargo !== ETX) ? ' ' + [
			`line="${this.line_index+1}"`,
			`col="${this.col_index+1}"`,
		].join(' ') : ''
		const contents: string = new Map<string, string>([
			[STX, '\u2402' /* SYMBOL FOR START OF TEXT */],
			[ETX, '\u2403' /* SYMBOL FOR END OF TEXT   */],
		]).get(this.cargo) || this.cargo
		return `<${tagname}${attributes}>${contents}</${tagname}>`
	}
}
export class TokenFilebound extends Token {
	static readonly TAGNAME: string = 'FILEBOUND'
	static readonly CHARACTERS: readonly string[] = [STX, ETX]
	constructor(start_char: Char) {
		super(TokenFilebound.TAGNAME, start_char)
	}
}
export class TokenWhitespace extends Token {
	static readonly TAGNAME: string = 'WHITESPACE'
	static readonly CHARACTERS: readonly string[] = [' ', '\t', '\n', '\r']
	constructor(start_char: Char) {
		super(TokenWhitespace.TAGNAME, start_char)
	}
}
export class TokenComment extends Token {
	static readonly TAGNAME: string = 'COMMENT'
	constructor(start_char: Char) {
		super(TokenComment.TAGNAME, start_char)
	}
}
export class TokenString extends Token {
	static readonly TAGNAME: string = 'STRING'
	constructor(start_char: Char) {
		super(TokenString.TAGNAME, start_char)
	}
}
export class TokenNumber extends Token {
	static readonly TAGNAME: string = 'NUMBER'
	static readonly CHARACTERS: readonly string[] = '0 1 2 3 4 5 6 7 8 9'.split(' ')
	constructor(start_char: Char) {
		super(TokenNumber.TAGNAME, start_char)
	}
}
export class TokenWord extends Token {
	static readonly TAGNAME: string = 'WORD'
	static readonly CHARACTERS_START: readonly string[] = ''.split(' ')
	static readonly CHARACTERS_REST : readonly string[] = ''.split(' ')
	constructor(start_char: Char) {
		super(TokenWord.TAGNAME, start_char)
	}
}
export class TokenPunctuator extends Token {
	static readonly TAGNAME: string = 'PUNCTUATOR'
	static readonly CHARACTERS_1: readonly string[] = '+ - * / ^ ( )'.split(' ')
	static readonly CHARACTERS_2: readonly string[] = ''.split(' ')
	static readonly CHARACTERS_3: readonly string[] = ''.split(' ')
	constructor(start_char: Char) {
		super(TokenPunctuator.TAGNAME, start_char)
	}
}


/**
 * A lexer (aka: Tokenizer, Lexical Analyzer)
 * @see http://parsingintro.sourceforge.net/#contents_item_6.5
 */
export default class Lexer {
	/** The scanner returning characters for each iteration. */
	private readonly scanner: Iterator<Char>;
	/** The result of the scanner iterator. */
	private iterator_result_char: IteratorResult<Char>;

	/** The current character’s cargo. */
	private c0: string;
	/** The lookahead(1) character’s cargo. */
	private c1: string|null;
	/** The lookahead(2) character’s cargo. */
	private c2: string|null;

	/**
	 * Construct a new Lexer object.
	 * @param   source_text - the entire source text
	 */
	constructor(
		private readonly source_text: string,
	) {
		this.scanner = new Scanner(this.source_text).generate()
		this.iterator_result_char = this.scanner.next()

		this.c0 = this.iterator_result_char.value.cargo
		const l1: Char|null = this.iterator_result_char.value.lookahead()
		const l2: Char|null = this.iterator_result_char.value.lookahead(2)
		this.c1 = l1 && l1.cargo
		this.c2 = l2 && l2.cargo
	}

	/**
	 * Advance this Lexer, scanning the next character and reassigning variables.
	 * @param   n the number of times to advance
	 * @throws  {RangeError} if the argument is not a positive integer
	 */
	private advance(n: number = 1): void {
		if (n % 1 !== 0 || n <= 0) throw new RangeError('Argument must be a positive integer.')
		if (n === 1) {
			this.iterator_result_char = this.scanner.next()
			if (!this.iterator_result_char.done) {
				this.c0 = this.iterator_result_char.value.cargo
				const l1 = this.iterator_result_char.value.lookahead()
				const l2 = this.iterator_result_char.value.lookahead(2)
				this.c1 = l1 && l1.cargo
				this.c2 = l2 && l2.cargo
			}
		} else {
			this.advance(n - 1)
			this.advance()
		}
	}

	/**
	 * Construct and return the next token in the source text.
	 * @returns the next token, if it does not contain whitespace
	 */
	* generate(): Iterator<Token> {
		while (!this.iterator_result_char.done) {
			if (TokenWhitespace.CHARACTERS.includes(this.c0)) {
				const wstoken: TokenWhitespace = new TokenWhitespace(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && TokenWhitespace.CHARACTERS.includes(this.c0)) {
					wstoken.add(this.c0)
					this.advance()
				}
				// yield wstoken // only if we want the lexer to return whitespace
				continue;
			}

			let token: Token;
			if (TokenFilebound.CHARACTERS.includes(this.c0)) {
				token = new TokenFilebound(this.iterator_result_char.value)
				this.advance()
			} else if (TokenNumber.CHARACTERS.includes(this.c0)) {
				token = new TokenNumber(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && TokenNumber.CHARACTERS.includes(this.c0)) {
					token.add(this.c0)
					this.advance()
				}
			} else if (TokenWord.CHARACTERS_START.includes(this.c0)) {
				token = new TokenWord(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && TokenWord.CHARACTERS_REST.includes(this.c0)) {
					token.add(this.c0)
					this.advance()
				}
			} else if (TokenPunctuator.CHARACTERS_1.includes(this.c0)) {
				token = new TokenPunctuator(this.iterator_result_char.value)
				let first_char: string = this.c0
				this.advance() // read past the first character
				// TODO clean this up when we get to multi-char punctuators
				if (TokenPunctuator.CHARACTERS_2.includes(first_char + this.c0)) {
					token.add(this.c0)
					let second_char: string = this.c0
					this.advance() // read past the second character
					if (TokenPunctuator.CHARACTERS_3.includes(first_char + second_char + this.c0)) {
						token.add(this.c0)
						this.advance() // read past the third character
					}
				}
			} else {
				throw new Error(`I found a character or symbol that I do not recognize:
${this.c0} on ${this.iterator_result_char.value.line_index + 1}:${this.iterator_result_char.value.col_index + 1}.`)
			}
			yield token
		}
	}
}

import Serializable from '../iface/Serializable.iface'

import Scanner, {Char, STX, ETX} from './Scanner.class'

const whitespace: readonly string[] = [' ', '\t', '\n', '\r']

const COMMENT_MULTI_START: '"'   = '"'
const COMMENT_MULTI_END  : '."'  = '."'
const COMMENT_DOC_START  : '...' = '...'
const COMMENT_DOC_END    : '...' = COMMENT_DOC_START
const COMMENT_LINE       : '..'  = '..'

const STRING_LITERAL_DELIM: '\'' = `'`
const STRING_TEMPLATE_DELIM: '`' = '`'
const STRING_TEMPLATE_INTERP_START: '{{' = '{{'
const STRING_TEMPLATE_INTERP_END  : '}}' = '}}'

const digits_dec: readonly string[] = `0 1 2 3 4 5 6 7 8 9`.split(' ')

const word_starts: readonly string[] = ``.split(' ')
const word_chars: readonly string[] = ``.split(' ')

const punctuators1: readonly string[] = `+ - * / ^ ( )`.split(' ')
const punctuators2: readonly string[] = ``.split(' ')
const punctuators3: readonly string[] = ``.split(' ')


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
	 * @param start_char - the starting character of this Token
	 * @param tagname    - the name of the type of this Token
	 */
	constructor(private readonly tagname: string, start_char: Char) {
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
export class TokenFilebound  extends Token { constructor(start_char: Char) { super('FILEBOUND' , start_char) } }
export class TokenWhitespace extends Token { constructor(start_char: Char) { super('WHITESPACE', start_char) } }
export class TokenComment    extends Token { constructor(start_char: Char) { super('COMMENT'   , start_char) } }
export class TokenString     extends Token { constructor(start_char: Char) { super('STRING'    , start_char) } }
export class TokenNumber     extends Token { constructor(start_char: Char) { super('NUMBER'    , start_char) } }
export class TokenWord       extends Token { constructor(start_char: Char) { super('WORD'      , start_char) } }
export class TokenPunctuator extends Token { constructor(start_char: Char) { super('PUNCTUATOR', start_char) } }


/**
 * A lexer (aka: Tokenizer, Lexical Analyzer)
 * @see http://parsingintro.sourceforge.net/#contents_item_6.5
 */
export default class Lexer {
	/** The scanner returning characters for each iteration. */
	private readonly scanner: Iterator<Char>;
	/** The result of the scanner iterator. */
	private iterator_result_char: IteratorResult<Char>;

	/** Did this Lexer just pass a token that contains `\n`? */
	private state_newline: boolean = false
	/** How many levels of nested multi-line comments are we in? */
	private comment_multiline_level: number /* bigint */ = 0
	/** How many levels of nested string templates are we in? */
	private template_level: number /* bigint */ = 0

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
	constructor(private readonly source_text: string) {
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
	private advance(n: number /* bigint */ = 1): void {
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
			if (whitespace.includes(this.c0)) {
				const wstoken: TokenWhitespace = new TokenWhitespace(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && whitespace.includes(this.c0)) {
					wstoken.add(this.c0)
					this.advance()
				}
				this.state_newline = [...wstoken.cargo].includes('\n')
				// yield wstoken // only if we want the lexer to return whitespace
				continue;
			}

			let token: Token;
			if (this.c0 === STX || this.c0 === ETX) {
				token = new TokenFilebound(this.iterator_result_char.value)
				this.advance()
			} else if ((this.c0 as string) === COMMENT_MULTI_START) { // we found a multi-line comment
				token = new TokenComment(this.iterator_result_char.value)
				this.advance(COMMENT_MULTI_START.length)
				this.comment_multiline_level++;
				while (this.comment_multiline_level !== 0) {
					while (!this.iterator_result_char.done && this.c0 + this.c1 !== COMMENT_MULTI_END) {
						if (this.c0 === ETX) throw new Error('Found end of file before end of comment')
						if (this.c0 === COMMENT_MULTI_START) this.comment_multiline_level++
						token.add(this.c0)
						this.advance()
					}
					// add COMMENT_MULTI_END to token
					token.add(COMMENT_MULTI_END)
					this.advance(COMMENT_MULTI_END.length)
					this.comment_multiline_level--;
				}
			} else if (this.c0 + this.c1 === COMMENT_LINE) { // we found either a doc comment or a single-line comment
				token = new TokenComment(this.iterator_result_char.value)
				token.add(this.c1 !)
				this.advance(COMMENT_LINE.length)
				if (this.state_newline && this.c0 + this.c1 === COMMENT_DOC_START.slice(COMMENT_LINE.length) + '\n') { // we found a doc comment
					token.add(this.c0 + this.c1 !)
					this.advance(2)
					while (!this.iterator_result_char.done) {
						if (this.c0 === ETX) throw new Error('Found end of file before end of comment')
						if (this.c0 + this.c1 + this.c2 === COMMENT_DOC_END) {
							const l3: Char|null = this.iterator_result_char.value.lookahead(3)
							const c3: string|null = l3 && l3.cargo
							const only_indented: boolean = token.cargo.slice(token.cargo.lastIndexOf('\n') + 1).trim() === ''
							if (c3 === '\n' && only_indented) {
								break;
							}
						}
						token.add(this.c0)
						this.advance()
					}
					// add COMMENT_DOC_END to token
					token.add(COMMENT_DOC_END)
					this.advance(COMMENT_DOC_END.length)
				} else { // we found a single-line comment
					while (!this.iterator_result_char.done && this.c0 !== '\n') {
						if (this.c0 === ETX) throw new Error('Found end of file before end of comment')
						token.add(this.c0)
						this.advance()
					}
					// do not add '\n' to token
				}
			} else if ((this.c0 as string) === STRING_LITERAL_DELIM) {
				token = new TokenString(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && this.c0 !== STRING_LITERAL_DELIM) {
					if (this.c0 === ETX) throw new Error('Found end of file before end of string')
					if (this.c0 + this.c1 === '\\' + STRING_LITERAL_DELIM) { // we found an escaped string delimiter
						token.add(this.c0 + this.c1)
						this.advance(2)
						continue;
					}
					token.add(this.c0)
					this.advance()
				}
				// add ending delim to token
				token.add(this.c0)
				this.advance()
			} else if (this.c0 === STRING_TEMPLATE_DELIM || this.c0 + this.c1 === STRING_TEMPLATE_INTERP_END && this.template_level) {
				token = new TokenString(this.iterator_result_char.value)
				this.advance()
				this.template_level++;
				while (!this.iterator_result_char.done) {
					if (this.c0 === ETX) throw new Error('Found end of file before end of string')
					if (this.c0 + this.c1 === '\\' + STRING_TEMPLATE_DELIM) { // we found an escaped string delimiter
						token.add(this.c0 + this.c1)
						this.advance(2)
						continue;
					}
					if (this.c0 + this.c1 === STRING_TEMPLATE_INTERP_START) {
						// add interpolation delims to token, end the token
						token.add(STRING_TEMPLATE_INTERP_START)
						this.advance(STRING_TEMPLATE_INTERP_START.length)
						break;
					}
					if (this.c0 === STRING_TEMPLATE_DELIM) {
						// add ending delim to token
						token.add(this.c0)
						this.advance()
						this.template_level--;
						break;
					}
					token.add(this.c0)
					this.advance()
				}
			} else if (digits_dec.includes(this.c0)) {
				token = new TokenNumber(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && digits_dec.includes(this.c0)) {
					token.add(this.c0)
					this.advance()
				}
			} else if (word_starts.includes(this.c0)) {
				token = new TokenWord(this.iterator_result_char.value)
				this.advance()
				while (!this.iterator_result_char.done && word_chars.includes(this.c0)) {
					token.add(this.c0)
					this.advance()
				}
			} else if (punctuators1.includes(this.c0)) {
				token = new TokenPunctuator(this.iterator_result_char.value)
				let first_char: string = this.c0
				this.advance() // read past the first character
				// TODO clean this up when we get to multi-char punctuators
				if (punctuators2.includes(first_char + this.c0)) {
					token.add(this.c0)
					let second_char: string = this.c0
					this.advance() // read past the second character
					if (punctuators3.includes(first_char + second_char + this.c0)) {
						token.add(this.c0)
						this.advance() // read past the third character
					}
				}
			} else {
				throw new Error(`I found a character or symbol that I do not recognize:
${this.c0} on ${this.iterator_result_char.value.line_index + 1}:${this.iterator_result_char.value.col_index + 1}.`)
			}
			this.state_newline = false
			yield token
		}
	}
}

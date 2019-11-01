import Scanner, { Char } from './Scanner.class'

/** ENDMARK character signifies end of file. */
const ENDMARK: '\u0003' = '\u0003'

const one_char_symbols: readonly string[] = `+ *`.split(' ')
const two_char_symbols: readonly string[] = ``.split(' ')
const three_char_symbols: readonly string[] = ``.split(' ')

const keywords: readonly string[] = ``.split(' ')
const identifier_chars: readonly string[] = `0 1 2 3 4 5 6 7 8 9`.split(' ')
const identifier_starts: readonly string[] = `0 1 2 3 4 5 6 7 8 9`.split(' ')
const whitespace: readonly string[] = [' ', '\t', '\n']

const COMMENT_MULTI_START: '"'   = '"'
const COMMENT_MULTI_END  : '."'  = '."'
const COMMENT_DOC_START  : '...' = '...'
const COMMENT_DOC_END    : '...' = COMMENT_DOC_START
const COMMENT_LINE       : '..'  = '..'

const STRING_LITERAL_DELIM: '\'' = `'`
const STRING_TEMPLATE_DELIM: '`' = '`'
const STRING_TEMPLATE_INTERP_START: '{{' = '{{'
const STRING_TEMPLATE_INTERP_END  : '}}' = '}}'


/**
 * The different possible types of tokens.
 */
export enum TokenType {
	SYMBOL,
	KEYWORD,
	STRING,
	IDENTIFIER,
	NUMBER,
	WHITESPACE,
	COMMENT,
	EOF,
}


/**
 * A Token object is the kind of thing that the Lexer returns.
 * It holds:
 * - the text of the token (self.cargo)
 * - the type of token that it is
 * - the line number and column index where the token starts
 *
 * @see http://parsingintro.sourceforge.net/#contents_item_6.4
 */
export class Token {
	/** All the characters in this Token. */
	private _cargo: string;
	/** Zero-based line number of the first character (first line is line 0). */
	readonly lineIndex: number;
	/** Zero-based column number of the first character (first col is col 0). */
	readonly colIndex: number;
	/** The token type. */
	type: TokenType|null;

	/**
	 * Construct a new Token object.
	 *
	 * @param startChar  The starting character of this Token.
	 */
	constructor(startChar: Char) {
		this._cargo     = startChar.cargo
		this.lineIndex  = startChar.lineIndex
		this.colIndex   = startChar.colIndex
		this.type       = null
	}

	/**
	 * Get this Token’s cargo.
	 * @returns All the characters in this Token.
	 */
	get cargo(): string {
		return this._cargo
	}

	add(cargo: string): void {
		this._cargo += cargo
	}

	/**
	 * Return a row that describes this token in a table.
	 * @returns a string representation of this token’s data
	 */
	show(show_line_numbers: boolean = false) {
		const s: string = (show_line_numbers)
			? `    ${this.lineIndex+1}    ${this.colIndex+1}    ` // for some dumb reason, lines and cols start at 1 instad of 0
			: ''
		return s  + `${TokenType[this.type || TokenType.SYMBOL]}: ${this._cargo}`
	}
}


/**
 * A lexer (aka: Tokenizer, Lexical Analyzer)
 * @see http://parsingintro.sourceforge.net/#contents_item_6.5
 */
export default class Lexer {
	/**
	 * Construct and return the next token in the sourceText.
	 * @param   sourceText - the entire source text
	 * @returns the next token, if it does not contain whitespace
	 */
	static * generate(sourceText: string): Iterator<Token> {
		const scanner: Iterator<Char> = Scanner.generate(sourceText)
		/**
		 * Did the lexer just pass a token that contains `\n`?
		 */
		let state_newline: boolean = false;
		/**
		 * How many levels of nested multi-line comments are we in?
		 */
		let comment_multiline_level: number /* bigint */ = 0;
		/**
		 * How many levels of nested string templates are we in?
		 */
		let template_level: number /* bigint */ = 0;
		let character: IteratorResult<Char> = scanner.next()
		let c0: string = character.value.cargo
		let l1: Char|null = character.value.lookahead()
		let l2: Char|null = character.value.lookahead(2)
		let c1: string|null = l1 && l1.cargo
		let c2: string|null = l2 && l2.cargo
		/**
		 * Advance the lexer, scanning the next character and reassigning variables.
		 * @param   n the number of times to advance
		 * @throws  {RangeError} if the argument is not a positive integer
		 */
		function advance(n: number = 1): void {
			if (n % 1 !== 0 || n <= 0) throw new RangeError('Argument must be a positive integer.')
			if (n === 1) {
				character = scanner.next()
				if (!character.done) {
					c0 = character.value.cargo
					l1 = character.value.lookahead()
					l2 = character.value.lookahead(2)
					c1 = l1 && l1.cargo
					c2 = l2 && l2.cargo
				}
			} else {
				advance(n - 1)
				advance()
			}
		}
		while (!character.done) {
			if (whitespace.includes(c0)) {
				const wstoken = new Token(character.value)
				wstoken.type = TokenType.WHITESPACE
				advance()
				while (!character.done && whitespace.includes(c0)) {
					wstoken.add(c0)
					advance()
				}
				state_newline = [...wstoken.cargo].includes('\n')
				// yield wstoken // only if we want the lexer to return whitespace
				continue;
			}

			const token = new Token(character.value)
			if (c0 === ENDMARK) {
				token.type = TokenType.EOF
				advance()
			} else if ((c0 as string) === COMMENT_MULTI_START) { // we found a multi-line comment
				token.type = TokenType.COMMENT
				advance(COMMENT_MULTI_START.length)
				comment_multiline_level++;
				while (comment_multiline_level !== 0) {
					while (!character.done && c0 + c1 !== COMMENT_MULTI_END) {
						if (c0 === ENDMARK) throw new Error('Found end of file before end of comment')
						if (c0 === COMMENT_MULTI_START) comment_multiline_level++
						token.add(c0)
						advance()
					}
					// add COMMENT_MULTI_END to token
					token.add(COMMENT_MULTI_END)
					advance(COMMENT_MULTI_END.length)
					comment_multiline_level--;
				}
			} else if (c0 + c1 === COMMENT_LINE) { // we found either a doc comment or a single-line comment
				token.type = TokenType.COMMENT
				token.add(c1 !)
				advance(COMMENT_LINE.length)
				if (state_newline && c0 + c1 === COMMENT_DOC_START.slice(COMMENT_LINE.length) + '\n') { // we found a doc comment
					token.add(c0 + c1 !)
					advance(2)
					while (!character.done) {
						if (c0 === ENDMARK) throw new Error('Found end of file before end of comment')
						if (c0 + c1 + c2 === COMMENT_DOC_END) {
							const l3: Char|null = character.value.lookahead(3)
							const c3: string|null = l3 && l3.cargo
							const only_indented: boolean = token.cargo.slice(token.cargo.lastIndexOf('\n') + 1).trim() === ''
							if (c3 === '\n' && only_indented) {
								break;
							}
						}
						token.add(c0)
						advance()
					}
					// add COMMENT_DOC_END to token
					token.add(COMMENT_DOC_END)
					advance(COMMENT_DOC_END.length)
				} else { // we found a single-line comment
					while (!character.done && c0 !== '\n') {
						if (c0 === ENDMARK) throw new Error('Found end of file before end of comment')
						token.add(c0)
						advance()
					}
					// do not add '\n' to token
				}
			} else if (c0 === STRING_LITERAL_DELIM) {
				token.type = TokenType.STRING
				advance()
				while (!character.done && c0 !== STRING_LITERAL_DELIM) {
					if (c0 === ENDMARK) throw new Error('Found end of file before end of string')
					if (c0 + c1 === '\\' + STRING_LITERAL_DELIM) {
						token.add(c0 + c1)
						advance(2)
						continue;
					}
					token.add(c0)
					advance()
				}
				// add ending delim to token
				token.add(c0)
				advance()
			} else if (c0 === STRING_TEMPLATE_DELIM || c0 + c1 === STRING_TEMPLATE_INTERP_END && template_level) {
				token.type = TokenType.STRING
				advance()
				template_level++;
				while (!character.done) {
					if (c0 === ENDMARK) throw new Error('Found end of file before end of string')
					if (c0 + c1 === '\\' + STRING_TEMPLATE_DELIM) {
						// we found an escaped string delimiter
						token.add(c0 + c1)
						advance(2)
						continue;
					}
					if (c0 + c1 === STRING_TEMPLATE_INTERP_START) {
						// add interpolation delims to token, end the token
						token.add(STRING_TEMPLATE_INTERP_START)
						advance(STRING_TEMPLATE_INTERP_START.length)
						break;
					}
					if (c0 === STRING_TEMPLATE_DELIM) {
						// add ending delim to token
						token.add(c0)
						advance()
						template_level--;
						break;
					}
					token.add(c0)
					advance()
				}
			} else if (identifier_starts.includes(c0)) {
				token.type = TokenType.IDENTIFIER
				advance()
				while (!character.done && identifier_chars.includes(c0)) {
					token.add(c0)
					advance()
				}
				if (keywords.includes(token.cargo)) {
					token.type = TokenType.KEYWORD
				}
			} else if (one_char_symbols.includes(c0)) {
				token.type = TokenType.SYMBOL
				let first_char: string = c0
				advance() // read past the first character
				if (two_char_symbols.includes(first_char + c0)) {
					token.add(c0)
					let second_char: string = c0
					advance() // read past the second character
					if (three_char_symbols.includes(first_char + second_char + c0)) {
						token.add(c0)
						advance() // read past the third character
					}
				}
			} else {
				throw new Error(`I found a character or symbol that I do not recognize:
${c0} on ${character.value.lineIndex + 1}:${character.value.colIndex + 1}.`)
			}
			state_newline = false
			yield token
		}
	}


	/**
	 * Construct a new Lexer object.
	 */
	private constructor() {
	}
}

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
class Token {
	/** All the characters in this Token. */
	cargo: string;
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
		this.cargo      = startChar.cargo
		this.lineIndex  = startChar.lineIndex
		this.colIndex   = startChar.colIndex
		this.type       = null
	}


	/**
	 * Return a row that describes this token in a table.
	 * @returns a string representation of this token’s data
	 */
	show(show_line_numbers: boolean = false) {
		const s: string = (show_line_numbers)
			? `    ${this.lineIndex+1}    ${this.colIndex+1}    ` // for some dumb reason, lines and cols start at 1 instad of 0
			: ''
		return s  + `${TokenType[this.type || TokenType.SYMBOL]}: ${this.cargo}`
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
		let character: IteratorResult<Char> = scanner.next()
		let c0: string = character.value.cargo
		let c1: string|null = character.value.lookahead() && character.value.lookahead() !.cargo
		let c2: string|null = character.value.lookahead(2) && character.value.lookahead(2) !.cargo
		/**
		 * Advance the lexer, scanning the next character and reassigning variables.
		 * @param   n the number of times to advance
		 * @throws  {RangeError} if the argument is not a positive integer
		 */
		function advance(n: number = 1): void {
			if (n % 1 !== 0 || n <= 0) throw new RangeError('Argument must be a positive integer.')
			if (n === 1) {
				character = scanner.next()
				c0 = character.value.cargo
				c1 = character.value.lookahead() && character.value.lookahead() !.cargo
				c2 = character.value.lookahead(2) && character.value.lookahead(2) !.cargo
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
					wstoken.cargo += c0
					advance()
				}
				// yield wstoken // only if we want the lexer to return whitespace
				break;
			}

			const token = new Token(character.value)
			if (c0 === ENDMARK) {
				token.type = TokenType.EOF
				advance()
			// TODO comments
			} else if (identifier_starts.includes(c0)) {
				token.type = TokenType.IDENTIFIER
				advance()
				while (!character.done && identifier_chars.includes(c0)) {
					token.cargo += c0
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
					token.cargo += c0
					let second_char: string = c0
					advance() // read past the second character
					if (three_char_symbols.includes(first_char + second_char + c0)) {
						token.cargo += c0
						advance() // read past the third character
					}
				}
			} else {
				throw new Error(`I found a character or symbol that I do not recognize: ${c0}`)
			}
			yield token
		}
	}


	/**
	 * Construct a new Lexer object.
	 */
	private constructor() {
	}
}

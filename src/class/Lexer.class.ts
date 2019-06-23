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

export enum TokenType {
	SYMBOL     ,
	KEYWORD    ,
	STRING     ,
	IDENTIFIER ,
	NUMBER     ,
	WHITESPACE ,
	COMMENT    ,
	EOF        ,
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
	/** The index of the line the first character is on. */
	readonly lineIndex: number;
	/** The index of the column the first character is on. */
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


	show(showLineNumbers = false) {
		const s: string = (showLineNumbers)
			? `    ${this.lineIndex+1}    ${this.colIndex+1}    ` // for some dumb reason, lines and cols start at 1 instad of 0
			: ''
		return s  + `${TokenType[this.type || TokenType.SYMBOL]}: ${this.cargo}`
	}
}


/**
 * A lexer (aka: Tokenizer, Lexical Analyzer)
 */
export default class Lexer {
	/**
	 * Construct a new Lexer object.
	 */
	private constructor() {
	}

	/**
	 * Construct and return the next token in the sourceText.
	 * @param   sourceText - the entire source text
	 * @returns the next token, if it does not contain whitespace
	 */
	static * generate(sourceText: string): Iterator<Token> {
		const scanner = Scanner.generate(sourceText)
		let character: IteratorResult<[Char, Char|null]> = scanner.next()
		while (!character.done) {
			if (whitespace.includes(character.value[0].cargo)) {
				const wstoken = new Token(character.value[0])
				wstoken.type = TokenType.WHITESPACE
				character = scanner.next()
				while (whitespace.includes(character.value[0].cargo)) {
					wstoken.cargo += character.value[0].cargo
					character = scanner.next()
				}
			}

			const token = new Token(character.value[0])
			if (character.value[0].cargo === ENDMARK) {
				token.type = TokenType.EOF
				character = scanner.next()
			// TODO comments
			} else if (identifier_starts.includes(character.value[0].cargo)) {
				token.type = TokenType.IDENTIFIER
				character = scanner.next()
				while (identifier_chars.includes(character.value[0].cargo)) {
					token.cargo += character.value[0].cargo
					character = scanner.next()
				}
				if (keywords.includes(token.cargo)) {
					token.type = TokenType.KEYWORD
				}
			} else if (one_char_symbols.includes(character.value[0].cargo)) {
				token.type = TokenType.SYMBOL
				let first_char = character.value[0].cargo
				character = scanner.next() // read past the first character
				if (two_char_symbols.includes(first_char + character.value[0].cargo)) {
					token.cargo += character.value[0].cargo
					let second_char = character.value[0].cargo
					character = scanner.next() // read past the second character
					if (three_char_symbols.includes(first_char + second_char + character.value[0].cargo)) {
						token.cargo += character.value[0].cargo
						character = scanner.next() // read past the third character
					}
				}
			} else {
				throw new Error(`I found a character or symbol that I do not recognize: ${character.value[0].cargo}`)
			}
			yield token
		}
	}
}
